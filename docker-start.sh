#!/bin/bash
set -e

PORT=${PORT:-8080}

echo "Orión MVP — arrancando servicios..."

# FastAPI en puerto 8000 (interno)
echo "→ FastAPI en puerto 8000..."
cd /app/backend
uvicorn main:app --host 0.0.0.0 --port 8000 &

# Esperar a que FastAPI esté listo
sleep 2

# Next.js en PORT (Cloud Run lo define, default 8080)
echo "→ Next.js en puerto $PORT..."
cd /app/frontend
exec node_modules/.bin/next start --port "$PORT"
