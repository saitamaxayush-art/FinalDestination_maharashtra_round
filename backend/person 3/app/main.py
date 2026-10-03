from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from fastapi.staticfiles import StaticFiles
import os

from .config import settings
from .database import init_db
from .routes import projects_router, assets_router, scripts_router, jobs_router, exports_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(title="CreatorAi Backend", description="Backend API for CreatorAi", version="1.0.0", lifespan=lifespan)

uploads_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

exports_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads", "exports"))
os.makedirs(exports_dir, exist_ok=True)
app.mount("/exports", StaticFiles(directory=exports_dir), name="exports")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects_router)
app.include_router(assets_router)
app.include_router(scripts_router)
app.include_router(jobs_router)
app.include_router(exports_router)

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": settings.app_name
    }
