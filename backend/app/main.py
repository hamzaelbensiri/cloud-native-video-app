# app/main.py
from __future__ import annotations
import logging, os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.requests import Request
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from .settings import settings
from .database import engine, Base
from .routers import auth, users, videos, ratings, comments


# --- Dev bootstrap: create tables + dev upload dir
if settings.is_dev:
    Base.metadata.create_all(bind=engine)  # Use Alembic in prod
    os.makedirs(settings.LOCAL_DEV_UPLOAD_DIR, exist_ok=True)

app = FastAPI(title="Cloud-Native Video API")

# --- Mount /static ONLY in dev (or if dir exists)
if settings.is_dev and Path(settings.LOCAL_DEV_UPLOAD_DIR).exists():
    app.mount("/static", StaticFiles(directory=settings.LOCAL_DEV_UPLOAD_DIR), name="static")

# --- CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(o) for o in settings.CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Upload size guard
MAX_UPLOAD_BYTES = 200 * 1024 * 1024  # 200 MB
class LimitUploadSizeMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        if request.method == "POST" and request.url.path.startswith("/videos"):
            cl = request.headers.get("content-length")
            if cl and int(cl) > MAX_UPLOAD_BYTES:
                return JSONResponse({"detail": "File too large"}, status_code=413)
        return await call_next(request)

app.add_middleware(LimitUploadSizeMiddleware)

# --- Error handler
logger = logging.getLogger("uvicorn.error")
@app.exception_handler(Exception)
async def unhandled_ex_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse({"detail": "Internal Server Error"}, status_code=500)

# --- Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(videos.router)
app.include_router(comments.router)
app.include_router(ratings.router)

# --- Health + Root
@app.get("/healthz")
def healthz():
    return {"status": "ok"}

@app.get("/")
async def root():
    return {"message": "Welcome to the Video Sharing App API"}

# --- Debug settings (dev only)
if settings.is_dev:
    @app.get("/debug-settings")
    def debug_settings():
        return {
            "ENV": settings.ENV,
            "DATABASE_URL": settings.DATABASE_URL,
            "UPLOAD_DIR": settings.LOCAL_DEV_UPLOAD_DIR,
        }
