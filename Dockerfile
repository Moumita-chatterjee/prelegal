# ---- Stage 1: build the static frontend ----
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- Stage 2: backend runtime, serving the built frontend ----
FROM python:3.13-slim

RUN pip install --no-cache-dir uv

WORKDIR /app
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY backend/app ./app
RUN uv sync --frozen --no-dev

COPY --from=frontend-builder /frontend/out ./static

ENV PATH="/app/.venv/bin:$PATH"
ENV STATIC_DIR=/app/static
ENV DATABASE_PATH=/app/data/app.db

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
