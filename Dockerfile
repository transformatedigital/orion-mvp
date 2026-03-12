# ─── Stage 1: Build Next.js ───────────────────────────────────────────────
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ─── Stage 2: Runtime ─────────────────────────────────────────────────────
FROM python:3.11-slim

# Instalar Node.js 18
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Backend: dependencias Python
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Backend: código
COPY backend/ ./backend/

# Frontend: dependencias Node (solo producción)
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci

# Frontend: build compilado
COPY --from=frontend-builder /app/frontend/.next ./frontend/.next
COPY frontend/public ./frontend/public
COPY frontend/next.config.js ./frontend/

# Script de arranque
COPY docker-start.sh ./
RUN chmod +x docker-start.sh

EXPOSE 8080
CMD ["./docker-start.sh"]
