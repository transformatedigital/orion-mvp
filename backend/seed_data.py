"""
Datos demo realistas basados en operación real de Orión.
Rutas reales México: Cuautitlán → Querétaro, CDMX → Guadalajara, Monterrey → CDMX.
"""

import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models import Viaje, EventoViaje, OperadorWhatsapp


def seed_database(db: Session):
    if db.query(Viaje).count() > 0:
        return

    now = datetime.utcnow()

    viajes_data = [
        {
            "viaje_id": "ORI-001",
            "unidad": "Unidad 1",
            "placa": "VKR-4831",
            "operador": "Juan Manuel López Reyes",
            "origen": "Cuautitlán Izcalli, EDOMEX",
            "destino": "Querétaro, QRO",
            "cliente": "Distribuidora del Norte SA",
            "tipo_carga": "Carga general",
            "estatus": "en_ruta",
            "fecha_inicio": now - timedelta(hours=3),
        },
        {
            "viaje_id": "ORI-002",
            "unidad": "Unidad 2",
            "placa": "BNM-7294",
            "operador": "Carlos Hernández Vega",
            "origen": "CDMX - Bodega Central",
            "destino": "Guadalajara, JAL",
            "cliente": "Frigolite Comercial",
            "tipo_carga": "Refrigerada",
            "estatus": "con_incidencia",
            "fecha_inicio": now - timedelta(hours=6),
        },
        {
            "viaje_id": "ORI-003",
            "unidad": "Unidad 3",
            "placa": "PLT-3562",
            "operador": "Roberto Méndez Sánchez",
            "origen": "Monterrey, NL",
            "destino": "CDMX - Bodega Central",
            "cliente": "Aceros Monterrey SA",
            "tipo_carga": "Carga pesada",
            "estatus": "completado",
            "fecha_inicio": now - timedelta(hours=14),
            "fecha_fin": now - timedelta(hours=1),
        },
        {
            "viaje_id": "ORI-004",
            "unidad": "Unidad 4",
            "placa": "JGS-8147",
            "operador": "Miguel Ángel Torres Fuentes",
            "origen": "Cuautitlán Izcalli, EDOMEX",
            "destino": "San Luis Potosí, SLP",
            "cliente": "Industrias Potosinas",
            "tipo_carga": "Carga general",
            "estatus": "en_ruta",
            "fecha_inicio": now - timedelta(hours=1, minutes=30),
        },
        {
            "viaje_id": "ORI-005",
            "unidad": "Unidad 5",
            "placa": "CTF-9625",
            "operador": "Sergio Pérez Ramos",
            "origen": "Cuautitlán Izcalli, EDOMEX",
            "destino": "Puebla, PUE",
            "cliente": "Grupo Textil Puebla",
            "tipo_carga": "Carga general",
            "estatus": "en_ruta",
            "fecha_inicio": now - timedelta(minutes=45),
        },
        {
            "viaje_id": "ORI-006",
            "unidad": "Unidad 6",
            "placa": "CFO-2026",
            "operador": "Cesar Fonseca",
            "origen": "CDMX - Bodega Central",
            "destino": "Monterrey, NL",
            "cliente": "Demo Orión",
            "tipo_carga": "Carga general",
            "estatus": "en_ruta",
            "fecha_inicio": now - timedelta(minutes=10),
        },
    ]

    for v in viajes_data:
        db.add(Viaje(**v))
    db.flush()

    eventos = [
        # ORI-001: En ruta Cuautitlán → Querétaro
        {
            "viaje_id": "ORI-001", "tipo_evento": "salida_origen",
            "timestamp": now - timedelta(hours=3),
            "descripcion": "Operador confirma salida de origen",
            "fuente": "whatsapp", "operador": "Juan Manuel López Reyes", "unidad": "Unidad 1",
            "payload": json.dumps({"mensaje": "ya saliendo de cuautitlan"}),
        },
        {
            "viaje_id": "ORI-001", "tipo_evento": "cumplimiento_check",
            "timestamp": now - timedelta(hours=2),
            "descripcion": "Reporte de estatus en ruta: circulando en autopista México-Querétaro, sin novedad",
            "fuente": "whatsapp", "operador": "Juan Manuel López Reyes", "unidad": "Unidad 1",
            "lat": 20.12, "lng": -99.88,
            "payload": json.dumps({"mensaje": "todo bien circulando en autopista sin novedad"}),
        },
        {
            "viaje_id": "ORI-001", "tipo_evento": "detencion_prolongada",
            "timestamp": now - timedelta(hours=1),
            "descripcion": "Detención reportada: retención en caseta Palmillas por revisión",
            "fuente": "whatsapp", "operador": "Juan Manuel López Reyes", "unidad": "Unidad 1",
            "lat": 20.38, "lng": -99.65,
            "payload": json.dumps({"mensaje": "detenido en caseta por revisión"}),
        },

        # ORI-002: Con incidencia CDMX → Guadalajara
        {
            "viaje_id": "ORI-002", "tipo_evento": "salida_origen",
            "timestamp": now - timedelta(hours=6),
            "descripcion": "Operador confirma salida de origen",
            "fuente": "whatsapp", "operador": "Carlos Hernández Vega", "unidad": "Unidad 2",
            "payload": json.dumps({"mensaje": "saliendo de bodega en camino"}),
        },
        {
            "viaje_id": "ORI-002", "tipo_evento": "cumplimiento_check",
            "timestamp": now - timedelta(hours=4),
            "descripcion": "Reporte de estatus en ruta: altura Atlacomulco, sin novedad",
            "fuente": "gps", "operador": "Carlos Hernández Vega", "unidad": "Unidad 2",
            "lat": 19.79, "lng": -99.88,
        },
        {
            "viaje_id": "ORI-002", "tipo_evento": "incidencia",
            "timestamp": now - timedelta(hours=2, minutes=30),
            "descripcion": "⚠️ INCIDENCIA reportada: llanta ponchada, unidad detenida en acotamiento km 47 libramiento Palmillas",
            "fuente": "whatsapp", "operador": "Carlos Hernández Vega", "unidad": "Unidad 2",
            "lat": 20.05, "lng": -100.21,
            "payload": json.dumps({"mensaje": "incidencia llanta ponchada, detenido en acotamiento", "prioridad": "alta"}),
        },
        {
            "viaje_id": "ORI-002", "tipo_evento": "evidencia",
            "timestamp": now - timedelta(hours=2),
            "descripcion": "Evidencia fotográfica enviada por operador (llanta ponchada)",
            "fuente": "whatsapp", "operador": "Carlos Hernández Vega", "unidad": "Unidad 2",
        },

        # ORI-003: Completado Monterrey → CDMX
        {
            "viaje_id": "ORI-003", "tipo_evento": "salida_origen",
            "timestamp": now - timedelta(hours=14),
            "descripcion": "Operador confirma salida de origen",
            "fuente": "whatsapp", "operador": "Roberto Méndez Sánchez", "unidad": "Unidad 3",
        },
        {
            "viaje_id": "ORI-003", "tipo_evento": "cumplimiento_check",
            "timestamp": now - timedelta(hours=10),
            "descripcion": "Reporte de estatus en ruta: pasando Saltillo, sin novedad",
            "fuente": "whatsapp", "operador": "Roberto Méndez Sánchez", "unidad": "Unidad 3",
        },
        {
            "viaje_id": "ORI-003", "tipo_evento": "cumplimiento_check",
            "timestamp": now - timedelta(hours=6),
            "descripcion": "Reporte de estatus en ruta: pasando San Luis Potosí, sin novedad",
            "fuente": "whatsapp", "operador": "Roberto Méndez Sánchez", "unidad": "Unidad 3",
        },
        {
            "viaje_id": "ORI-003", "tipo_evento": "llegada_destino",
            "timestamp": now - timedelta(hours=2),
            "descripcion": "Operador confirma llegada a destino",
            "fuente": "whatsapp", "operador": "Roberto Méndez Sánchez", "unidad": "Unidad 3",
        },
        {
            "viaje_id": "ORI-003", "tipo_evento": "salida_destino",
            "timestamp": now - timedelta(hours=1, minutes=30),
            "descripcion": "Operador confirma salida de punto de entrega",
            "fuente": "whatsapp", "operador": "Roberto Méndez Sánchez", "unidad": "Unidad 3",
        },
        {
            "viaje_id": "ORI-003", "tipo_evento": "fin_viaje",
            "timestamp": now - timedelta(hours=1),
            "descripcion": "Viaje finalizado, unidad en base",
            "fuente": "sistema", "operador": "Roberto Méndez Sánchez", "unidad": "Unidad 3",
        },

        # ORI-004: Recién iniciado Cuautitlán → SLP
        {
            "viaje_id": "ORI-004", "tipo_evento": "salida_origen",
            "timestamp": now - timedelta(hours=1, minutes=30),
            "descripcion": "Operador confirma salida de origen",
            "fuente": "whatsapp", "operador": "Miguel Ángel Torres Fuentes", "unidad": "Unidad 4",
            "payload": json.dumps({"mensaje": "saliendo rumbo a SLP"}),
        },

        # ORI-005: Sergio Pérez Ramos, Cuautitlán → Puebla
        {
            "viaje_id": "ORI-005", "tipo_evento": "salida_origen",
            "timestamp": now - timedelta(minutes=45),
            "descripcion": "Operador confirma salida de origen",
            "fuente": "whatsapp", "operador": "Sergio Pérez Ramos", "unidad": "Unidad 5",
            "payload": json.dumps({"mensaje": "ya saliendo, todo en orden"}),
        },

        # ORI-006: Cesar Fonseca, CDMX → Monterrey (demo WhatsApp)
        {
            "viaje_id": "ORI-006", "tipo_evento": "salida_origen",
            "timestamp": now - timedelta(minutes=10),
            "descripcion": "Operador confirma salida de origen",
            "fuente": "whatsapp", "operador": "Cesar Fonseca", "unidad": "Unidad 6",
            "payload": json.dumps({"mensaje": "saliendo a Monterrey"}),
        },
    ]

    for e in eventos:
        db.add(EventoViaje(**e))

    # Operadores WhatsApp registrados
    operadores_wa = [
        {
            "telefono": "whatsapp:+821026311719",
            "nombre": "Cesar Fonseca",
            "viaje_id_activo": "ORI-006",
        },
    ]
    for op in operadores_wa:
        existe = db.query(OperadorWhatsapp).filter(
            OperadorWhatsapp.telefono == op["telefono"]
        ).first()
        if not existe:
            db.add(OperadorWhatsapp(**op))

    db.commit()
    print("✅ Datos demo Orión cargados correctamente")


if __name__ == "__main__":
    from database import Base, engine, SessionLocal
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
