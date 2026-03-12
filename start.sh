#!/bin/bash
# Orión MVP — Arranque rápido
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

echo "🚛 Iniciando Orión MVP..."

# Backend
echo "→ Instalando dependencias Python..."
cd "$BACKEND"
pip install -r requirements.txt -q

echo "→ Arrancando API (puerto 8000)..."
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

# Frontend
echo "→ Instalando dependencias Node..."
cd "$FRONTEND"
npm install -q

echo "→ Arrancando Next.js (puerto 3000)..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Orión corriendo:"
echo "   Dashboard:  http://localhost:3000"
echo "   API docs:   http://localhost:8000/docs"
echo ""
echo "📱 Para demo en celular:"
echo "   ngrok http 3000"
echo ""
echo "Ctrl+C para detener todo"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
