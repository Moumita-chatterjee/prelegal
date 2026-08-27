from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.db import reset_db
from app.routers import auth, documents, saved_documents


@asynccontextmanager
async def lifespan(app: FastAPI):
    reset_db()
    yield


app = FastAPI(title="Prelegal API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(saved_documents.router)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


if settings.static_path.is_dir():
    app.mount("/", StaticFiles(directory=settings.static_path, html=True), name="static")
