"""
Agente Operativo Orión — usa Claude con tool use para consultar la DB
y responder preguntas en lenguaje natural sobre la operación de la flota.
"""

import json
import os
from datetime import datetime, timedelta
from typing import AsyncGenerator

import anthropic
from sqlalchemy.orm import Session

from models import EventoViaje, Viaje

# ─── Cliente Anthropic ────────────────────────────────────────────────────────

def get_client() -> anthropic.AsyncAnthropic:
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY no está configurada en el archivo .env")
    return anthropic.AsyncAnthropic(api_key=api_key)


# ─── System Prompt ────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """Eres el Agente Operativo de Orión Logística México.
Tu rol es responder preguntas sobre la operación de la flota de camiones en tiempo real.

EMPRESA: Orión opera camiones de carga (general y refrigerada) en México.
Los viajes tienen ID formato ORI-XXX. Operadores reportan por WhatsApp.

ESTATUS DE VIAJE:
🟢 en_ruta: Activo sin problemas
🔴 con_incidencia: Tiene incidencia activa
🟡 detenido: Parado sin incidencia
🔵 en_destino: Llegó al destino
⚫ completado: Viaje finalizado

TIPOS DE EVENTO: salida_origen, llegada_destino, salida_destino, fin_viaje,
incidencia, detencion_prolongada, retoma_ruta, desvio_ruta, evidencia, cumplimiento_check

FORMATO DE RESPUESTA (MUY IMPORTANTE — se visualiza en celular):
- NUNCA uses tablas markdown (no uses | para tablas)
- Para listar unidades usa viñetas con este formato:
  🟢 **Unidad X** — Operador · Ruta · Último evento
- Para reportes de flota: encabezado con resumen → luego cada unidad en su propia viñeta
- Máximo 1-2 líneas por unidad en resúmenes generales
- Si hay incidencias, ponlas PRIMERO con 🔴 y destácalas
- Usa saltos de línea para separar secciones
- Responde en español, conciso y directo como un reporte operativo
- Sé breve: el jefe lee esto en el celular mientras trabaja"""


# ─── Definición de herramientas ───────────────────────────────────────────────

TOOLS = [
    {
        "name": "get_fleet_status",
        "description": "Obtiene el estatus actual de TODA la flota: viajes activos, con incidencia, detenidos, completados. Úsala para preguntas generales sobre el estado de la operación.",
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "get_trip_detail",
        "description": "Obtiene el detalle completo de un viaje específico: info del viaje y todos sus eventos cronológicos.",
        "input_schema": {
            "type": "object",
            "properties": {
                "viaje_id": {"type": "string", "description": "ID del viaje, ej: ORI-001"}
            },
            "required": ["viaje_id"],
        },
    },
    {
        "name": "get_incidents",
        "description": "Obtiene todas las incidencias registradas (problemas, fallas, accidentes). Úsala para preguntas sobre incidencias o novedades.",
        "input_schema": {
            "type": "object",
            "properties": {
                "dias": {"type": "integer", "description": "Días hacia atrás a buscar (default: 7)"}
            },
        },
    },
    {
        "name": "get_operator_status",
        "description": "Busca el viaje activo y eventos recientes de un operador por nombre (búsqueda parcial).",
        "input_schema": {
            "type": "object",
            "properties": {
                "nombre": {"type": "string", "description": "Nombre o apellido del operador, ej: 'Sergio', 'López'"}
            },
            "required": ["nombre"],
        },
    },
    {
        "name": "get_detentions",
        "description": "Obtiene todos los eventos de detención (detencion_prolongada) registrados.",
        "input_schema": {
            "type": "object",
            "properties": {
                "dias": {"type": "integer", "description": "Días hacia atrás (default: 7)"}
            },
        },
    },
    {
        "name": "search_events",
        "description": "Búsqueda flexible de eventos por tipo, operador o texto en la descripción.",
        "input_schema": {
            "type": "object",
            "properties": {
                "tipo_evento": {"type": "string", "description": "Tipo de evento"},
                "operador": {"type": "string", "description": "Nombre parcial del operador"},
                "texto": {"type": "string", "description": "Texto a buscar en la descripción"},
                "dias": {"type": "integer", "description": "Días hacia atrás (default: 7)"},
            },
        },
    },
]


# ─── Implementación de herramientas ───────────────────────────────────────────

def _fmt_ts(dt: datetime | None) -> str:
    if not dt:
        return "—"
    return dt.strftime("%d/%m/%Y %H:%M")


def tool_get_fleet_status(db: Session) -> dict:
    viajes = db.query(Viaje).order_by(Viaje.fecha_inicio.desc()).all()
    result = []
    for v in viajes:
        ultimo = (
            db.query(EventoViaje)
            .filter(EventoViaje.viaje_id == v.viaje_id)
            .order_by(EventoViaje.timestamp.desc())
            .first()
        )
        result.append({
            "viaje_id": v.viaje_id,
            "unidad": v.unidad,
            "placa": v.placa,
            "operador": v.operador,
            "origen": v.origen,
            "destino": v.destino,
            "cliente": v.cliente,
            "tipo_carga": v.tipo_carga,
            "estatus": v.estatus,
            "fecha_inicio": _fmt_ts(v.fecha_inicio),
            "total_eventos": db.query(EventoViaje).filter(EventoViaje.viaje_id == v.viaje_id).count(),
            "ultimo_evento": {
                "tipo": ultimo.tipo_evento,
                "descripcion": ultimo.descripcion,
                "timestamp": _fmt_ts(ultimo.timestamp),
                "fuente": ultimo.fuente,
            } if ultimo else None,
        })
    return {"total": len(result), "viajes": result}


def tool_get_trip_detail(viaje_id: str, db: Session) -> dict:
    viaje = db.query(Viaje).filter(Viaje.viaje_id == viaje_id).first()
    if not viaje:
        return {"error": f"Viaje {viaje_id} no encontrado"}
    eventos = (
        db.query(EventoViaje)
        .filter(EventoViaje.viaje_id == viaje_id)
        .order_by(EventoViaje.timestamp.asc())
        .all()
    )
    return {
        "viaje": {
            "viaje_id": viaje.viaje_id,
            "unidad": viaje.unidad,
            "operador": viaje.operador,
            "origen": viaje.origen,
            "destino": viaje.destino,
            "cliente": viaje.cliente,
            "estatus": viaje.estatus,
            "fecha_inicio": _fmt_ts(viaje.fecha_inicio),
            "fecha_fin": _fmt_ts(viaje.fecha_fin),
        },
        "eventos": [
            {
                "tipo": e.tipo_evento,
                "descripcion": e.descripcion,
                "timestamp": _fmt_ts(e.timestamp),
                "fuente": e.fuente,
            }
            for e in eventos
        ],
    }


def tool_get_incidents(dias: int, db: Session) -> dict:
    desde = datetime.utcnow() - timedelta(days=dias)
    eventos = (
        db.query(EventoViaje)
        .filter(EventoViaje.tipo_evento == "incidencia", EventoViaje.timestamp >= desde)
        .order_by(EventoViaje.timestamp.desc())
        .all()
    )
    return {
        "total": len(eventos),
        "periodo_dias": dias,
        "incidencias": [
            {
                "viaje_id": e.viaje_id,
                "unidad": e.unidad,
                "operador": e.operador,
                "descripcion": e.descripcion,
                "timestamp": _fmt_ts(e.timestamp),
            }
            for e in eventos
        ],
    }


def tool_get_operator_status(nombre: str, db: Session) -> dict:
    viajes = db.query(Viaje).filter(Viaje.operador.ilike(f"%{nombre}%")).all()
    if not viajes:
        return {"encontrado": False, "mensaje": f"No se encontró ningún operador con '{nombre}'"}
    result = []
    for v in viajes:
        eventos = (
            db.query(EventoViaje)
            .filter(EventoViaje.viaje_id == v.viaje_id)
            .order_by(EventoViaje.timestamp.desc())
            .limit(5)
            .all()
        )
        result.append({
            "viaje_id": v.viaje_id,
            "operador": v.operador,
            "unidad": v.unidad,
            "ruta": f"{v.origen} → {v.destino}",
            "estatus": v.estatus,
            "fecha_inicio": _fmt_ts(v.fecha_inicio),
            "eventos_recientes": [
                {"tipo": e.tipo_evento, "descripcion": e.descripcion, "timestamp": _fmt_ts(e.timestamp)}
                for e in eventos
            ],
        })
    return {"encontrado": True, "total": len(result), "operadores": result}


def tool_get_detentions(dias: int, db: Session) -> dict:
    desde = datetime.utcnow() - timedelta(days=dias)
    eventos = (
        db.query(EventoViaje)
        .filter(EventoViaje.tipo_evento == "detencion_prolongada", EventoViaje.timestamp >= desde)
        .order_by(EventoViaje.timestamp.desc())
        .all()
    )
    return {
        "total": len(eventos),
        "periodo_dias": dias,
        "detenciones": [
            {
                "viaje_id": e.viaje_id,
                "unidad": e.unidad,
                "operador": e.operador,
                "descripcion": e.descripcion,
                "timestamp": _fmt_ts(e.timestamp),
            }
            for e in eventos
        ],
    }


def tool_search_events(inputs: dict, db: Session) -> dict:
    desde = datetime.utcnow() - timedelta(days=inputs.get("dias", 7))
    q = db.query(EventoViaje).filter(EventoViaje.timestamp >= desde)
    if inputs.get("tipo_evento"):
        q = q.filter(EventoViaje.tipo_evento == inputs["tipo_evento"])
    if inputs.get("operador"):
        q = q.filter(EventoViaje.operador.ilike(f"%{inputs['operador']}%"))
    if inputs.get("texto"):
        q = q.filter(EventoViaje.descripcion.ilike(f"%{inputs['texto']}%"))
    eventos = q.order_by(EventoViaje.timestamp.desc()).limit(20).all()
    return {
        "total": len(eventos),
        "eventos": [
            {
                "viaje_id": e.viaje_id,
                "tipo": e.tipo_evento,
                "unidad": e.unidad,
                "operador": e.operador,
                "descripcion": e.descripcion,
                "timestamp": _fmt_ts(e.timestamp),
            }
            for e in eventos
        ],
    }


def execute_tool(name: str, inputs: dict, db: Session) -> str:
    try:
        if name == "get_fleet_status":
            result = tool_get_fleet_status(db)
        elif name == "get_trip_detail":
            result = tool_get_trip_detail(inputs["viaje_id"], db)
        elif name == "get_incidents":
            result = tool_get_incidents(inputs.get("dias", 7), db)
        elif name == "get_operator_status":
            result = tool_get_operator_status(inputs["nombre"], db)
        elif name == "get_detentions":
            result = tool_get_detentions(inputs.get("dias", 7), db)
        elif name == "search_events":
            result = tool_search_events(inputs, db)
        else:
            result = {"error": f"Herramienta '{name}' no encontrada"}
    except Exception as e:
        result = {"error": str(e)}
    return json.dumps(result, ensure_ascii=False, default=str)


# ─── Loop agéntico con streaming ──────────────────────────────────────────────

TOOL_LABELS = {
    "get_fleet_status": "Consultando estatus de flota...",
    "get_trip_detail": "Consultando detalle del viaje...",
    "get_incidents": "Consultando incidencias...",
    "get_operator_status": "Buscando operador...",
    "get_detentions": "Consultando detenciones...",
    "search_events": "Buscando eventos...",
}


async def agent_stream(
    pregunta: str,
    historial: list[dict],
    db: Session,
) -> AsyncGenerator[str, None]:
    """
    Genera eventos SSE: text chunks, tool notifications y done/error.
    historial: lista de {"role": "user"|"assistant", "content": "..."}
    """
    try:
        client = get_client()
    except ValueError as e:
        yield json.dumps({"type": "error", "message": str(e)})
        return

    messages = list(historial) + [{"role": "user", "content": pregunta}]

    for _ in range(8):  # máximo 8 iteraciones del loop agéntico
        async with client.messages.stream(
            model="claude-opus-4-6",
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            tools=TOOLS,
            messages=messages,
        ) as stream:
            # Transmitir texto en tiempo real
            async for text in stream.text_stream:
                yield json.dumps({"type": "text", "content": text})

            response = await stream.get_final_message()

        if response.stop_reason == "end_turn":
            break

        if response.stop_reason == "tool_use":
            # Guardar respuesta del asistente (con tool_use blocks)
            assistant_content = []
            for block in response.content:
                if block.type == "text":
                    assistant_content.append({"type": "text", "text": block.text})
                elif block.type == "tool_use":
                    assistant_content.append({
                        "type": "tool_use",
                        "id": block.id,
                        "name": block.name,
                        "input": block.input,
                    })
            messages.append({"role": "assistant", "content": assistant_content})

            # Ejecutar herramientas y notificar al frontend
            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    label = TOOL_LABELS.get(block.name, f"Consultando {block.name}...")
                    yield json.dumps({"type": "tool", "label": label})
                    result = execute_tool(block.name, block.input, db)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": result,
                    })

            messages.append({"role": "user", "content": tool_results})

    yield json.dumps({"type": "done"})
