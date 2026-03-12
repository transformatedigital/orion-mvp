from sqlalchemy import Column, Integer, String, DateTime, Float, Text
from database import Base
from datetime import datetime


class Viaje(Base):
    __tablename__ = "viajes"

    id = Column(Integer, primary_key=True, index=True)
    viaje_id = Column(String, unique=True, index=True)
    unidad = Column(String)
    placa = Column(String)
    operador = Column(String)
    origen = Column(String)
    destino = Column(String)
    cliente = Column(String, nullable=True)
    tipo_carga = Column(String, nullable=True)
    fecha_inicio = Column(DateTime, default=datetime.utcnow)
    fecha_fin = Column(DateTime, nullable=True)
    # estatus: en_ruta | en_destino | con_incidencia | detenido | completado
    estatus = Column(String, default="en_ruta")


class EventoViaje(Base):
    __tablename__ = "eventos_viaje"

    id = Column(Integer, primary_key=True, index=True)
    viaje_id = Column(String, index=True)
    tipo_evento = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
    descripcion = Column(Text)
    payload = Column(Text, nullable=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    # fuente: whatsapp | gps | sistema | manual
    fuente = Column(String, default="whatsapp")
    operador = Column(String, nullable=True)
    unidad = Column(String, nullable=True)
