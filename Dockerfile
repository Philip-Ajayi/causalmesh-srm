# ==========================================
# STAGE 1: Build React Frontend
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /build/frontend

COPY frontend/package*.json ./
RUN npm ci || npm install

COPY frontend/ ./
RUN npm run build

# ==========================================
# STAGE 2: Python Backend + Production Server
# ==========================================
FROM python:3.12-slim
WORKDIR /app

# Install system dependencies & Coin-OR CBC solver binary for PuLP
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    coinor-cbc \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY backend/ ./

# Copy compiled frontend from Stage 1
COPY --from=frontend-builder /build/frontend/dist ./frontend_dist

# Render automatically sets $PORT at runtime
ENV PORT=8000
EXPOSE $PORT

# Start Uvicorn bound to dynamic $PORT
CMD sh -c "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"
