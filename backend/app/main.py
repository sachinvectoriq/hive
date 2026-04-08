from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import engine, Base
from app.models import *  # noqa: F401, F403 — ensure all models are registered
from app.auth.router import router as auth_router
from app.routers.applications import router as applications_router
from app.routers.dashboard import router as dashboard_router
from app.routers.aggregates import router as aggregates_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title="Hive",
    description="Azure Resource Management Platform",
    version="2.0.0",
    lifespan=lifespan,
)

_settings = get_settings()
_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
if _settings.FRONTEND_URL:
    _origins.append(_settings.FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(applications_router)
app.include_router(aggregates_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
