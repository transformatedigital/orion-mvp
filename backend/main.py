import asyncio
import json
import os
from datetime import datetime, timezone
from typing import Optional

import httpx

from dotenv import load_dotenv
load_dotenv()


def ts(dt: datetime | None) -> str | None:
    """Convierte datetime UTC a ISO 8601 con 'Z' para que el navegador lo convierta a hora local."""
    if dt is None:
        return None
    return dt.isoformat() + "Z"

from fastapi import Depends, FastAPI, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse, FileResponse
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import Base, engine, get_db
from models import EventoViaje, OperadorWhatsapp, Viaje
from seed_data import seed_database
from services.parser import parse_whatsapp_message
from services.agent import agent_stream

Base.metadata.create_all(bind=engine)  # Crea tablas si no existen (SQLite en Cloud Run)

app = FastAPI(title="Orión Logística — API MVP")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cola SSE: lista de asyncio.Queue, una por cliente conectado
_sse_queues: list[asyncio.Queue] = []


async def _broadcast(data: dict):
    payload = json.dumps(data, ensure_ascii=False)
    for q in list(_sse_queues):
        try:
            q.put_nowait(payload)
        except asyncio.QueueFull:
            pass


@app.on_event("startup")
def startup():
    db = next(get_db())
    seed_database(db)


# ─── Schemas ───────────────────────────────────────────────────────────────

class MensajeRequest(BaseModel):
    mensaje: str
    viaje_id: str
    operador: Optional[str] = None
    unidad: Optional[str] = None


class ChatRequest(BaseModel):
    pregunta: str
    historial: list[dict] = []


# ─── Endpoints ─────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "Orión MVP"}


@app.get("/api/viajes")
def list_viajes(db: Session = Depends(get_db)):
    viajes = db.query(Viaje).order_by(Viaje.fecha_inicio.desc()).all()
    result = []
    for v in viajes:
        ultimo = (
            db.query(EventoViaje)
            .filter(EventoViaje.viaje_id == v.viaje_id)
            .order_by(EventoViaje.timestamp.desc())
            .first()
        )
        total_eventos = (
            db.query(EventoViaje)
            .filter(EventoViaje.viaje_id == v.viaje_id)
            .count()
        )
        op_wa = db.query(OperadorWhatsapp).filter(
            OperadorWhatsapp.viaje_id_activo == v.viaje_id,
            OperadorWhatsapp.activo == True,
        ).first()
        telefono = op_wa.telefono.replace("whatsapp:", "") if op_wa else None

        result.append({
            "viaje_id": v.viaje_id,
            "unidad": v.unidad,
            "placa": v.placa,
            "operador": v.operador,
            "telefono": telefono,
            "origen": v.origen,
            "destino": v.destino,
            "cliente": v.cliente,
            "tipo_carga": v.tipo_carga,
            "estatus": v.estatus,
            "fecha_inicio": ts(v.fecha_inicio),
            "fecha_fin": ts(v.fecha_fin),
            "total_eventos": total_eventos,
            "ultimo_evento": {
                "tipo": ultimo.tipo_evento,
                "descripcion": ultimo.descripcion,
                "timestamp": ts(ultimo.timestamp),
            } if ultimo else None,
        })
    return result


@app.get("/api/viajes/{viaje_id}")
def get_viaje(viaje_id: str, db: Session = Depends(get_db)):
    viaje = db.query(Viaje).filter(Viaje.viaje_id == viaje_id).first()
    if not viaje:
        raise HTTPException(status_code=404, detail="Viaje no encontrado")

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
            "placa": viaje.placa,
            "operador": viaje.operador,
            "origen": viaje.origen,
            "destino": viaje.destino,
            "cliente": viaje.cliente,
            "tipo_carga": viaje.tipo_carga,
            "estatus": viaje.estatus,
            "fecha_inicio": ts(viaje.fecha_inicio),
            "fecha_fin": ts(viaje.fecha_fin),
        },
        "eventos": [
            {
                "id": e.id,
                "tipo_evento": e.tipo_evento,
                "timestamp": ts(e.timestamp),
                "descripcion": e.descripcion,
                "payload": e.payload,
                "lat": e.lat,
                "lng": e.lng,
                "fuente": e.fuente,
                "operador": e.operador,
                "unidad": e.unidad,
            }
            for e in eventos
        ],
    }


@app.get("/api/dashboard")
def get_dashboard(db: Session = Depends(get_db)):
    total_viajes = db.query(Viaje).count()
    viajes_activos = db.query(Viaje).filter(Viaje.estatus == "en_ruta").count()
    viajes_alerta = db.query(Viaje).filter(
        Viaje.estatus.in_(["con_incidencia", "detenido"])
    ).count()

    hoy = datetime.utcnow().date()
    viajes_completados_hoy = db.query(Viaje).filter(
        Viaje.estatus == "completado",
        func.date(Viaje.fecha_fin) == hoy,
    ).count()

    total_incidencias = db.query(EventoViaje).filter(
        EventoViaje.tipo_evento == "incidencia"
    ).count()
    total_detenciones = db.query(EventoViaje).filter(
        EventoViaje.tipo_evento == "detencion_prolongada"
    ).count()
    eventos_hoy = db.query(EventoViaje).filter(
        func.date(EventoViaje.timestamp) == hoy
    ).count()

    eventos_por_tipo = dict(
        db.query(EventoViaje.tipo_evento, func.count(EventoViaje.id))
        .group_by(EventoViaje.tipo_evento)
        .all()
    )

    incidencias_recientes = (
        db.query(EventoViaje)
        .filter(EventoViaje.tipo_evento == "incidencia")
        .order_by(EventoViaje.timestamp.desc())
        .limit(5)
        .all()
    )

    return {
        "kpis": {
            "total_viajes": total_viajes,
            "viajes_activos": viajes_activos,
            "viajes_alerta": viajes_alerta,
            "viajes_completados_hoy": viajes_completados_hoy,
            "total_incidencias": total_incidencias,
            "total_detenciones": total_detenciones,
            "eventos_hoy": eventos_hoy,
            "cumplimiento_reportes": 87,
        },
        "eventos_por_tipo": eventos_por_tipo,
        "incidencias_recientes": [
            {
                "viaje_id": i.viaje_id,
                "unidad": i.unidad,
                "descripcion": i.descripcion,
                "timestamp": ts(i.timestamp),
            }
            for i in incidencias_recientes
        ],
    }


@app.post("/api/simular")
async def simular_mensaje(req: MensajeRequest, db: Session = Depends(get_db)):
    viaje = db.query(Viaje).filter(Viaje.viaje_id == req.viaje_id).first()
    if not viaje:
        raise HTTPException(status_code=404, detail="Viaje no encontrado")

    # Pasar historial del viaje al parser para decisiones con contexto
    historial = [
        e.tipo_evento for e in
        db.query(EventoViaje.tipo_evento)
        .filter(EventoViaje.viaje_id == req.viaje_id)
        .order_by(EventoViaje.id.asc())
        .all()
    ]

    parsed = parse_whatsapp_message(
        req.mensaje, req.viaje_id,
        req.operador or viaje.operador,
        req.unidad or viaje.unidad,
        historial=historial,
    )

    evento = EventoViaje(
        viaje_id=parsed["viaje_id"],
        tipo_evento=parsed["tipo_evento"],
        descripcion=parsed["descripcion"],
        payload=json.dumps({"mensaje_original": req.mensaje}),
        fuente="whatsapp",
        operador=parsed["operador"],
        unidad=parsed["unidad"],
    )
    db.add(evento)

    # Actualizar estatus del viaje según el evento
    tipo = parsed["tipo_evento"]
    if tipo == "incidencia":
        viaje.estatus = "con_incidencia"
    elif tipo == "detencion_prolongada":
        viaje.estatus = "detenido"
    elif tipo == "llegada_destino":
        viaje.estatus = "en_destino"
    elif tipo in ("fin_viaje", "salida_destino") and viaje.estatus == "en_destino":
        viaje.estatus = "completado"
        viaje.fecha_fin = datetime.utcnow()
    elif tipo in ("salida_origen", "retoma_ruta"):
        viaje.estatus = "en_ruta"

    db.commit()
    db.refresh(evento)

    # Broadcast SSE
    await _broadcast({
        "type": "nuevo_evento",
        "viaje_id": req.viaje_id,
        "estatus_viaje": viaje.estatus,
        "evento": {
            "tipo_evento": evento.tipo_evento,
            "descripcion": evento.descripcion,
            "timestamp": ts(evento.timestamp),
            "unidad": evento.unidad,
            "operador": evento.operador,
        },
    })

    return {
        "success": True,
        "mensaje_original": req.mensaje,
        "evento_detectado": parsed["tipo_evento"],
        "descripcion": parsed["descripcion"],
        "respuesta_bot": parsed["respuesta"],
        "nuevo_estatus_viaje": viaje.estatus,
    }


@app.post("/api/reset-demo")
async def reset_demo(db: Session = Depends(get_db)):
    """Borra todos los eventos y regresa viajes a estado inicial. Usar antes del demo."""
    db.query(EventoViaje).delete()
    db.query(Viaje).update({"estatus": "en_ruta", "fecha_fin": None})
    db.commit()
    await _broadcast({"type": "reset"})
    return {"success": True, "mensaje": "Demo reiniciado. Todos los eventos borrados."}


@app.get("/api/stream")
async def stream_events():
    q: asyncio.Queue = asyncio.Queue(maxsize=50)
    _sse_queues.append(q)

    async def generator():
        try:
            yield f"data: {json.dumps({'type': 'connected'})}\n\n"
            while True:
                try:
                    data = await asyncio.wait_for(q.get(), timeout=25.0)
                    yield f"data: {data}\n\n"
                except asyncio.TimeoutError:
                    yield f"data: {json.dumps({'type': 'ping'})}\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            _sse_queues.remove(q)

    return StreamingResponse(
        generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.post("/api/chat")
async def chat(req: ChatRequest, db: Session = Depends(get_db)):
    """Chat con el Agente Operativo Orión — streaming SSE."""

    async def generator():
        async for chunk in agent_stream(req.pregunta, req.historial, db):
            yield f"data: {chunk}\n\n"

    return StreamingResponse(
        generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ─── WhatsApp Webhook (Twilio) ──────────────────────────────────────────────

def _twiml(mensaje: str) -> Response:
    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response><Message>{mensaje}</Message></Response>"""
    return Response(content=xml, media_type="application/xml")


@app.post("/webhook/whatsapp")
async def whatsapp_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    """Recibe mensajes de WhatsApp vía Twilio y los procesa."""
    form = await request.form()
    from_num = form.get("From", "")      # e.g. "whatsapp:+521234567890"
    body = form.get("Body", "").strip()
    num_media = int(form.get("NumMedia", "0"))
    media_url = form.get("MediaUrl0", None) if num_media > 0 else None
    media_type = form.get("MediaContentType0", "image/jpeg") if num_media > 0 else None

    if not body and not media_url:
        return _twiml("No entendí el mensaje. Escribe algo 😊")

    # Buscar operador registrado por su número
    operador_reg = db.query(OperadorWhatsapp).filter(
        OperadorWhatsapp.telefono == from_num,
        OperadorWhatsapp.activo == True,
    ).first()

    if not operador_reg:
        return _twiml(
            "👋 Hola, no estás registrado en Orión. "
            "Contacta a tu supervisor para que te den de alta."
        )

    viaje_id = operador_reg.viaje_id_activo
    if not viaje_id:
        return _twiml("No tienes un viaje activo asignado. Contacta a tu supervisor.")

    viaje = db.query(Viaje).filter(Viaje.viaje_id == viaje_id).first()
    if not viaje:
        return _twiml("No encontré tu viaje activo. Contacta a tu supervisor.")

    # Historial para contexto del parser
    historial = [
        e.tipo_evento for e in
        db.query(EventoViaje.tipo_evento)
        .filter(EventoViaje.viaje_id == viaje_id)
        .order_by(EventoViaje.id.asc())
        .all()
    ]

    # Si el operador mandó una foto, es evidencia directa
    if media_url:
        parsed = {
            "tipo_evento": "evidencia",
            "descripcion": "Evidencia fotográfica enviada por operador",
            "respuesta": "✅ Foto guardada en bitácora. ¡Gracias! 📋",
        }
        payload_data = {
            "mensaje_original": body or "[foto]",
            "fuente": from_num,
            "media_url": media_url,
            "media_type": media_type,
        }
    else:
        parsed = parse_whatsapp_message(
            body, viaje_id,
            operador_reg.nombre,
            viaje.unidad,
            historial=historial,
        )
        payload_data = {"mensaje_original": body, "fuente": from_num}

    evento = EventoViaje(
        viaje_id=viaje_id,
        tipo_evento=parsed["tipo_evento"],
        descripcion=parsed["descripcion"],
        payload=json.dumps(payload_data),
        fuente="whatsapp",
        operador=operador_reg.nombre,
        unidad=viaje.unidad,
    )
    db.add(evento)

    # Actualizar estatus del viaje
    tipo = parsed["tipo_evento"]
    if tipo == "incidencia":
        viaje.estatus = "con_incidencia"
    elif tipo == "detencion_prolongada":
        viaje.estatus = "detenido"
    elif tipo == "llegada_destino":
        viaje.estatus = "en_destino"
    elif tipo in ("fin_viaje", "salida_destino") and viaje.estatus == "en_destino":
        viaje.estatus = "completado"
        viaje.fecha_fin = datetime.utcnow()
    elif tipo in ("salida_origen", "retoma_ruta"):
        viaje.estatus = "en_ruta"

    db.commit()
    db.refresh(evento)

    await _broadcast({
        "type": "nuevo_evento",
        "viaje_id": viaje_id,
        "estatus_viaje": viaje.estatus,
        "evento": {
            "tipo_evento": evento.tipo_evento,
            "descripcion": evento.descripcion,
            "timestamp": ts(evento.timestamp),
            "unidad": evento.unidad,
            "operador": evento.operador,
        },
    })

    return _twiml(parsed["respuesta"])


# ─── Gestión de operadores WhatsApp ─────────────────────────────────────────

class OperadorRequest(BaseModel):
    telefono: str       # formato: +521234567890
    nombre: str
    viaje_id: str


@app.post("/api/operadores")
def registrar_operador(req: OperadorRequest, db: Session = Depends(get_db)):
    """Registra o actualiza un operador con su número de WhatsApp."""
    telefono_fmt = f"whatsapp:{req.telefono}" if not req.telefono.startswith("whatsapp:") else req.telefono

    existing = db.query(OperadorWhatsapp).filter(
        OperadorWhatsapp.telefono == telefono_fmt
    ).first()

    if existing:
        existing.nombre = req.nombre
        existing.viaje_id_activo = req.viaje_id
        existing.activo = True
    else:
        db.add(OperadorWhatsapp(
            telefono=telefono_fmt,
            nombre=req.nombre,
            viaje_id_activo=req.viaje_id,
        ))

    db.commit()
    return {"success": True, "mensaje": f"Operador {req.nombre} registrado en {req.viaje_id}"}


@app.get("/api/media/{event_id}")
async def get_media(event_id: int, db: Session = Depends(get_db)):
    """Sirve la foto de evidencia almacenada en el evento."""
    evento = db.query(EventoViaje).filter(EventoViaje.id == event_id).first()
    if not evento or not evento.payload:
        raise HTTPException(status_code=404, detail="No encontrado")

    try:
        payload = json.loads(evento.payload)
    except Exception:
        raise HTTPException(status_code=404, detail="Payload inválido")

    media_url = payload.get("media_url")
    if not media_url:
        raise HTTPException(status_code=404, detail="Sin foto en este evento")

    account_sid = os.getenv("TWILIO_ACCOUNT_SID", "")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN", "")

    from fastapi.responses import StreamingResponse as SR
    async with httpx.AsyncClient(follow_redirects=True) as client:
        resp = await client.get(
            media_url,
            auth=(account_sid, auth_token) if account_sid else None,
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail="No se pudo obtener la imagen")

    content_type = payload.get("media_type", resp.headers.get("content-type", "image/jpeg"))
    return Response(content=resp.content, media_type=content_type)


@app.get("/api/operadores")
def listar_operadores(db: Session = Depends(get_db)):
    """Lista todos los operadores registrados con WhatsApp."""
    ops = db.query(OperadorWhatsapp).filter(OperadorWhatsapp.activo == True).all()
    return [
        {
            "telefono": o.telefono,
            "nombre": o.nombre,
            "viaje_id_activo": o.viaje_id_activo,
            "creado_en": ts(o.creado_en),
        }
        for o in ops
    ]


# ============================================================================
# HTML PAGES - Formulario Cryo y Dashboards
# ============================================================================

@app.get("/cryo")
def cryo_portal():
    return FileResponse("index_cryo.html", media_type="text/html")

@app.get("/solicitudes-ui")
def solicitudes_ui():
    return FileResponse("solicitudes.html", media_type="text/html")

@app.get("/aprobaciones")
def aprobaciones():
    return FileResponse("aprobaciones.html", media_type="text/html")

@app.get("/flota")
def flota():
    return FileResponse("flota.html", media_type="text/html")

@app.get("/")
def home():
    return FileResponse("index.html", media_type="text/html")

@app.get("/coming-soon")
def coming_soon():
    return FileResponse("coming-soon.html", media_type="text/html")
