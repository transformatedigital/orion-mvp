# PROYECTO ORIÓN — Agente Logístico MVP

## Cliente
Orión Logística México. Contacto: Ulises Gil.
Objetivo: Reemplazar caos de WhatsApp + screenshots GPS + bitácoras duplicadas con una plataforma unificada.

## Stack
- Backend: FastAPI + SQLAlchemy + SQLite (→ PostgreSQL en producción)
- Frontend: Next.js 14 + Tailwind CSS + Chart.js
- Real-time: Server-Sent Events (SSE)
- Proxy: next.config.js rewrites `/api/*` → `http://localhost:8000/api/*`

## Estructura
```
backend/
  main.py          # FastAPI app, rutas, SSE broadcast
  models.py        # Viaje, EventoViaje
  database.py      # SQLite setup
  seed_data.py     # Datos demo realistas (4 viajes, ~15 eventos)
  services/
    parser.py      # Parse mensajes WhatsApp → tipo_evento
frontend/
  app/
    page.tsx           # Flota en vivo (polling + SSE)
    dashboard/         # KPIs + gráficas Chart.js
    bitacora/[id]/     # Timeline eventos por viaje
    simular/           # Consola mock WhatsApp (chat UI)
  components/
    Navbar.tsx
    DonutChart.tsx
    BarChart.tsx
```

## 10 Tipos de evento
salida_origen | llegada_destino | salida_destino | fin_viaje | incidencia |
detencion_prolongada | desvio_ruta | evidencia | falta_reporte | cumplimiento_check

## Datos demo cargados
- ORI-001: Eco 09 / Juan Manuel López → Cuautitlán → Querétaro (en_ruta)
- ORI-002: Eco 12 / Carlos Hernández → CDMX → Guadalajara (con_incidencia: llanta)
- ORI-003: Eco 05 / Roberto Méndez → Monterrey → CDMX (completado)
- ORI-004: Eco 17 / Miguel Torres → Cuautitlán → SLP (en_ruta, recién iniciado)

## Reglas clave
- Transparente para operadores: siguen mandando mensajes normales de WhatsApp
- El parser detecta tipo_evento automáticamente por keywords
- SSE notifica a todos los clientes conectados en tiempo real
- El frontend es mobile-first (demo en celular de Ulises)
- Proxy en next.config.js: solo necesitas un ngrok tunnel (puerto 3000)

## Arranque
```bash
# Terminal 1 — Backend
cd backend && pip install -r requirements.txt && uvicorn main:app --reload

# Terminal 2 — Frontend
cd frontend && npm install && npm run dev

# Demo en celular
ngrok http 3000
```

## Próximas fases
- Fase 2: Twilio WhatsApp real (webhook → mismo parser)
- Fase 3: GPS real (coordenadas → detección desvío/detención automática)
- Fase 4: Write al ERP de Orión
- Fase 5: IA para clasificación de causas de incidencias
