"""
Parser de mensajes tipo WhatsApp → eventos de bitácora.
Versión 4: sistema de scoring multi-keyword + diccionario expandido.

Cambios v4:
- Scoring: gana el tipo con más keywords en el mensaje (no "primer match")
- fin_viaje: reconoce "base", "patio", "corral" como señales de regreso
- retoma_ruta: +frases de reanudación tras mecánico o parada
- incidencia: +slang de fallas de refrigeración, "refri", "se kago"
- desvio_ruta: prioridad sobre detencion_prolongada
- Filtro de lenguaje para descripción limpia en bitácora
"""

import re

# ─── Orden de prioridad (importa para desempates) ─────────────────────────────

ORDEN_PRIORIDAD = [
    "salida_origen",
    "llegada_destino",
    "salida_destino",
    "fin_viaje",
    "incidencia",
    "desvio_ruta",          # antes que detencion para no confundir bloqueo/manif
    "detencion_prolongada",
    "retoma_ruta",
    "evidencia",
    "cumplimiento_check",
]

# ─── Diccionario de keywords ──────────────────────────────────────────────────

EVENTOS_KEYWORDS: dict[str, list[str]] = {
    "salida_origen": [
        # Formal
        "salida", "salí", "en camino", "arrancando", "partiendo",
        "iniciando viaje", "salimos", "salgo",
        # Informal
        "ya me fui", "vamos pa la carretera", "listo pa rodar",
        "saliendo ahorita", "ya rumbiamos", "ya saliendo",
        # Faltas
        "sali", "salk", "en kmino", "arrankando", "ya sali",
        "iniciando biage", "salimoz",
        # Jerga
        "bajando la paloma", "10-20 origen ok",
    ],
    "llegada_destino": [
        # Formal
        "ya llegué", "llegué", "llegamos", "en destino", "llegando",
        "ya estoy", "acabo de llegar", "llegue",
        # Informal
        "aki stoy", "llegue al destino", "ya en el lugar", "llegamos enteros",
        # Faltas
        "ya legue", "lleguee", "llegamoss", "en detino",
        "llegandoo", "ya etoy", "akabo de llegar",
        # Jerga
        "10-42 destino",
    ],
    "salida_destino": [
        # Formal
        "saliendo de destino", "ya descargué", "descargado",
        "listo para salir", "terminé descarga", "descarga completa",
        "ya descargue",
        # Entrega
        "ya entregué", "ya entregue", "entregué", "entregue",
        "entrega hecha", "entrega completa", "entregado", "entregada",
        "ya entregué la carga", "ya entregue la carga",
        "hice la entrega", "se hizo la entrega", "entrega realizada",
        "deje la carga", "dejé la carga", "dejamos la carga",
        "ya dejé", "ya deje",
        # Informal
        "ya baje la carga", "ya baje carga", "baje carga", "listo saliendo", "termino descarg",
        "saliendo destino", "destino",
        "baje",
        "todo listo pa regresar",
        # Faltas
        "saliendo detino", "ya degarge", "degargado",
        "listo pa slr", "termine degarga", "ya entregue la karga",
        # Jerga
        "carga abajo", "10-22 saliendo destino",
    ],
    "fin_viaje": [
        # Frases completas (alta precisión — suman +1 además de keywords sueltas)
        "llegué a base", "llegue a base", "llegue al patio",
        "llegue al corral", "llegue cdmx patio", "de vuelta a base",
        "de vuelta al patio", "ya en base", "ya en patio",
        # Keywords sueltas que combinadas puntúan alto
        "base", "patio", "corral",
        "llegue base", "llegue al patio", "llegue patio",
        # Formal
        "fin viaje", "viaje completado", "regresé", "regrese",
        "ya en casa", "llegue al patio", "biage terminado",
        # Faltas
        "fin biage", "de rgreso", "en baze", "llegue a baze",
        "biage completado", "ya en pato", "biage kompleto",
        # Jerga
        "10-24 llegada base", "descargue total",
    ],

    # ⚠️ PROBLEMAS ──────────────────────────────────────────────────────────────
    "incidencia": [
        # Mecánicas
        "llanta", "falla", "avería", "averia", "mecánico", "mecanico",
        "frenos", "motor", "electrico", "suspension", "transmision",
        "reventón", "reveton", "refri", "refrigerador", "cadena fria",
        "temperatura alta", "temperatura",
        # Fallas slang
        "se kago", "se jodio", "se jodió", "se chingo", "se chingó",
        "se calo", "se apago", "se trono", "trono",
        "trueno", "averiya", "meganko",
        # Accidentes
        "accidente", "choque", "chokke", "volcadura", "bolkadura",
        "robo", "asalto", "aalto", "emergencia", "emegensia",
        "peligro", "fuga",
        # Autoridades
        "multa", "tránsito", "transito", "infracción", "infraccion",
        "mordida", "inspector", "me paró", "me paro", "me detuvo",
        "me detuvieron", "policía", "policia",
        "federico", "verde", "smokey", "cuello duro",
        "me pidieron", "mordida federales", "verdes kobrando",
        # Faltas + groserías mecánicas
        "pinche falla", "llanta ponchada", "freno no jala",
        "llamando mekaniko",
        # Robo / emergencias slang
        "robo karga", "asalto pinche", "volkadura la verga",
        # Jerga códigos 10
        "10-42 choque", "10-47 peligro", "10-200 policia",
        "bombas de tiempo",
    ],
    "desvio_ruta": [
        # Formal
        "desvío", "desviado", "otra ruta", "cambio ruta", "cierre", "desvio",
        # Informal
        "tome otra calle", "cerraron la carretera", "desviandome",
        "tome otra kale", "cerraron la karretera",
        "desviado por", "manifestacion", "manifestación",
        # Faltas
        "desbio", "desbiado", "otra rutta", "kamio ruta", "sierree",
        # Jerga
        "10-33 trafico pesado", "cierre karretera", "desbio por federales",
    ],
    "detencion_prolongada": [
        # Formal
        "detenido", "parado", "en espera", "retención", "retencion",
        "aduana", "bloqueo", "blokeo", "caseta",
        "gasolinera", "diesel", "gasolina", "cargando combustible",
        "trafico", "trafiko", "trafico pesado", "trafiko pesado",
        # Informal
        "parao aki", "etoy esperando", "bloqueados", "en la keta",
        # Faltas
        "detenidio", "paradoo", "en epera", "retengion", "adwanas",
        "manifiestasion",
        # Jerga
        "10-36 break", "caseta larga", "federales en caseta",
    ],
    "retoma_ruta": [
        # Formal
        "continuando", "retomando", "ya cargué diesel", "ya cargue diesel",
        "ya eché gasolina", "ya eche gasolina",
        "saliendo de gasolinera", "ya salimos de la caseta",
        "ya pasé la caseta", "ya pase la caseta",
        "seguimos camino", "continuamos", "reanudamos",
        "ya terminé de cargar", "ya termine de cargar",
        "me vuelvo a incorporar", "de regreso a la ruta",
        "retomo viaje", "continúo ruta",
        # Frases post-mecánico / post-parada
        "mekaniko listo", "mecánico listo", "ya arreglaron",
        "salgo ya", "listo salgo", "ya listo salgo",
        "ya me arreglaron", "ya quedó", "ya quedo",
        "retomo kamino", "retomo ruta", "sigo kamino", "sigo ruta",
        "ya salgo", "de regreso a ruta",
        # Faltas / slang
        "kontinuando", "retomandoo", "ya karge dizel",
        "saliendo gasol", "pase la keta", "seguimo kamino",
        "ya sali de la gasol", "retomandoo", "ya listo salgo",
    ],
    "evidencia": [
        "foto", "evidencia", "imagen", "comprobante", "sello",
        "firma", "adjunto", "te mando",
        # Informal
        "aki la foto", "firma del cliente", "te mando la imagen",
        "aki la imahen", "firma del kiente", "te mando la iagen",
        # Faltas
        "fotto", "ebidensia", "imgen", "komprobante", "selo",
        "firrma", "adkunto",
    ],
    "cumplimiento_check": [
        "todo bien", "sin novedad", "normal", "check", "reporte",
        "novedad", "estatus", "circulando", "avanzando",
        # Informal
        "todo ok", "sigo bien", "sin problema", "reportando",
        # Faltas
        "todo bienn", "sin nobedad", "chek", "repote",
        "estatu", "irkulando",
    ],
}

# ─── Filtro de lenguaje ───────────────────────────────────────────────────────

_RE_GROSERIA = re.compile(
    r"\b(ching[ao]?|chingad[ao]|jod[ióo]|madreó|la verga|pinche|puta madre|"
    r"caraj[oa]|hijo de puta|se cagó|se kago|a la chingada)\b",
    re.IGNORECASE,
)

def _limpiar(texto: str) -> str:
    return _RE_GROSERIA.sub("[***]", texto)


# ─── Respuestas y descripciones ───────────────────────────────────────────────

DESCRIPCIONES = {
    "salida_origen": "Operador confirma salida de origen",
    "llegada_destino": "Operador confirma llegada a destino",
    "salida_destino": "Operador confirma salida de punto de entrega",
    "fin_viaje": "Viaje finalizado, unidad en base",
    "incidencia": "⚠️ INCIDENCIA reportada",
    "detencion_prolongada": "Unidad reporta detención",
    "desvio_ruta": "Cambio de ruta reportado",
    "evidencia": "Evidencia enviada por operador",
    "falta_reporte": "Sin reporte en tiempo esperado",
    "retoma_ruta": "Operador retoma ruta y continúa viaje",
    "cumplimiento_check": "Reporte de estatus en ruta",
}

RESPUESTAS_BOT = {
    "salida_origen": "✅ Salida registrada. Buen viaje, monitoreo activo.",
    "llegada_destino": "✅ Llegada registrada. Notificando a administración.",
    "salida_destino": "📸 Entrega confirmada. Necesitamos foto de la firma del cliente para cerrar el viaje. ¡Mándala por favor! 👍",
    "fin_viaje": "✅ Fin de viaje registrado. ¡Buen trabajo! 🚛",
    "incidencia": "🚨 Incidencia registrada. Monitorista notificado.",
    "detencion_prolongada": "⏱️ Detención registrada. Confirma causa cuando puedas.",
    "desvio_ruta": "📍 Cambio de ruta registrado.",
    "evidencia": "📎 Evidencia recibida y vinculada al viaje.",
    "retoma_ruta": "✅ Reanudación registrada. Monitoreo activo.",
    "cumplimiento_check": "✅ Reporte registrado en bitácora.",
}

# ─── Lógica de contexto ───────────────────────────────────────────────────────

EVENTOS_UNICOS = {"salida_origen", "llegada_destino", "fin_viaje"}

RECLASIFICACION = {
    ("salida_origen", "salida_origen"): "retoma_ruta",
    ("salida_origen", "llegada_destino"): "salida_destino",
    ("llegada_destino", "fin_viaje"): "cumplimiento_check",
    ("fin_viaje", "fin_viaje"): "cumplimiento_check",
}

_TIPOS_CON_DETALLE = {
    "incidencia", "cumplimiento_check", "retoma_ruta",
    "detencion_prolongada", "desvio_ruta",
}

# ─── Parser principal ─────────────────────────────────────────────────────────

def parse_whatsapp_message(
    mensaje: str,
    viaje_id: str,
    operador: str | None = None,
    unidad: str | None = None,
    historial: list[str] | None = None,
) -> dict:
    """
    v4: scoring multi-keyword — gana el tipo con más coincidencias.
    Desempates se resuelven por orden de prioridad (ORDEN_PRIORIDAD).
    historial: tipos de evento ya registrados en el viaje (cronológico).
    """
    historial = historial or []
    msg = mensaje.lower()

    # 1. Scoring: contar cuántas keywords de cada tipo aparecen en el mensaje
    scores: dict[str, int] = {}
    for tipo, keywords in EVENTOS_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in msg)
        if score > 0:
            scores[tipo] = score

    # 2. Elegir el tipo con mayor score, desempatando por prioridad
    if scores:
        tipo_detectado = max(
            scores,
            key=lambda t: (scores[t], -ORDEN_PRIORIDAD.index(t)),
        )
    else:
        tipo_detectado = "cumplimiento_check"

    # 3. Corrección por contexto del viaje (eventos únicos)
    if historial and tipo_detectado in EVENTOS_UNICOS:
        if tipo_detectado in historial:
            nuevo_tipo = None
            for ya_ocurrido in reversed(historial):
                clave = (tipo_detectado, ya_ocurrido)
                if clave in RECLASIFICACION:
                    nuevo_tipo = RECLASIFICACION[clave]
                    break
            if nuevo_tipo is None:
                nuevo_tipo = "retoma_ruta" if tipo_detectado == "salida_origen" else "cumplimiento_check"
            tipo_detectado = nuevo_tipo

    # 4. Construir descripción con texto limpio
    descripcion_base = DESCRIPCIONES.get(tipo_detectado, "Evento registrado")
    if tipo_detectado in _TIPOS_CON_DETALLE:
        texto_limpio = _limpiar(mensaje[:120])
        descripcion = f"{descripcion_base}: {texto_limpio}"
    else:
        descripcion = descripcion_base

    return {
        "viaje_id": viaje_id,
        "tipo_evento": tipo_detectado,
        "descripcion": descripcion,
        "respuesta": RESPUESTAS_BOT.get(tipo_detectado, "✅ Registrado."),
        "operador": operador,
        "unidad": unidad,
    }
