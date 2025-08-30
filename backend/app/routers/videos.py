from urllib.parse import urlparse
from uuid import uuid4
from typing import List

from fastapi import APIRouter, Depends, Form, File, UploadFile, HTTPException, status
from sqlalchemy.orm import Session

from ..models import UserRole
from ..settings import settings
from .auth import get_current_user
from .. import schemas, crud, models
from ..database import get_db

router = APIRouter(prefix="/videos", tags=["Videos"])

# --- Azure optional import (so local dev works without azure-storage-blob)
_blob_service = None
_ContentSettings = None
_container_client = None
if settings.AZURE_STORAGE_CONNECTION_STRING:
    try:
        from azure.storage.blob import BlobServiceClient, ContentSettings  # type: ignore
        _blob_service = BlobServiceClient.from_connection_string(
            settings.AZURE_STORAGE_CONNECTION_STRING
        )
        _ContentSettings = ContentSettings
        _container_client = _blob_service.get_container_client(settings.AZURE_BLOB_CONTAINER)
        try:
            _container_client.create_container()
        except Exception:
            pass  
    except ImportError:
        # Azure libs not installed -> fall back to local filesystem
        _blob_service = None
        _ContentSettings = None
        _container_client = None


def _ensure_owner_or_admin(db_video: models.Video, user: models.User):
    if not db_video:
        raise HTTPException(status_code=404, detail="Video not found")
    if user.role != models.UserRole.admin and db_video.creator_id != user.user_id:
        raise HTTPException(status_code=403, detail="Forbidden")


@router.post("/", response_model=schemas.VideoOut, status_code=status.HTTP_201_CREATED)
async def create_video(
    title: str = Form(...),
    publisher: str | None = Form(None),
    producer: str | None = Form(None),
    genre: str | None = Form(None),
    age_rating: str | None = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role not in (UserRole.creator, UserRole.admin):
        raise HTTPException(status_code=403, detail="Only creators or admins can upload videos")

    if file.content_type not in {"video/mp4", "video/quicktime", "video/webm"}:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    if _container_client:
        # Azure branch
        data = await file.read()  # simple (can be streamed later)
        blob_name = f"{current_user.user_id}/{uuid4()}_{file.filename}"
        content_settings = _ContentSettings(content_type=file.content_type) if _ContentSettings else None
        _container_client.upload_blob(name=blob_name, data=data, overwrite=True, content_settings=content_settings)
        blob_url = _container_client.get_blob_client(blob=blob_name).url
    else:
        # DEV branch: write to disk
        import os, aiofiles
        from pathlib import Path
        root = settings.LOCAL_DEV_UPLOAD_DIR
        os.makedirs(root, exist_ok=True)
        dev_name = f"{current_user.user_id}_{uuid4()}_{file.filename}"
        full_path = Path(root) / dev_name
        async with aiofiles.open(full_path, "wb") as f:
            while True:
                chunk = await file.read(1024 * 1024)  # 1MB chunks
                if not chunk:
                    break
                await f.write(chunk)
        blob_url = f"/static/{dev_name}"

    db_video = crud.create_video(
        db,
        video=schemas.VideoCreate(
            title=title, publisher=publisher, producer=producer,
            genre=genre, age_rating=age_rating, blob_uri=blob_url
        ),
        creator_id=current_user.user_id,
        blob_url=blob_url,
    )
    return db_video


@router.get("/{video_id}", response_model=schemas.VideoOut)
def read_video(video_id: int, db: Session = Depends(get_db)):
    video = crud.get_video(db, video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    return video


@router.get("/", response_model=List[schemas.VideoOut])
def list_videos(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    return crud.get_videos(db, skip=skip, limit=limit)


@router.put("/{video_id}", response_model=schemas.VideoOut)
def update_video(video_id: int, video_update: schemas.VideoUpdate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    db_video = crud.get_video(db, video_id)
    _ensure_owner_or_admin(db_video, user)
    for k, v in video_update.dict(exclude_unset=True).items():
        setattr(db_video, k, v)
    db.commit(); db.refresh(db_video)
    return db_video


def _try_delete_blob(blob_url: str):
    # Only applies to Azure URLs when we have a container client
    if not _container_client or not blob_url:
        return
    path = urlparse(blob_url).path  # /<container>/<blob_name>
    parts = [p for p in path.split("/") if p]
    if len(parts) >= 2:  # container + blob
        blob_name = "/".join(parts[1:])
        try:
            _container_client.delete_blob(blob_name)
        except Exception:
            pass


@router.delete("/{video_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_video(video_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    db_video = crud.get_video(db, video_id)
    _ensure_owner_or_admin(db_video, user)
    blob_url = db_video.blob_uri
    db.delete(db_video); db.commit()
    _try_delete_blob(blob_url)
    return None
