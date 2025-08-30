# app/crud.py
from sqlalchemy.orm import Session
from sqlalchemy import func
from . import models, schemas
from pydantic import EmailStr
from .utils import hash_password

# Users
def get_user_by_email(db: Session, email: EmailStr):
    return db.query(models.User).filter(models.User.email == email).first()

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_pw = hash_password(user.password)

    # If the incoming model has a "role" attribute (e.g., you temporarily kept it in the schema),
    # use it; otherwise default to consumer. Also cast to the SQLAlchemy enum.
    incoming_role = getattr(user, "role", None)          # could be enums.UserRole or str or None
    role_value = getattr(incoming_role, "value", incoming_role) or models.UserRole.consumer.value
    db_user = models.User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_pw,
        role=models.UserRole(role_value),                 # ensure proper enum instance
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.user_id == user_id).first()

def get_users(db: Session, skip: int = 0, limit: int = 10):
    return db.query(models.User).offset(skip).limit(limit).all()

# Videos
def create_video(db: Session, video: schemas.VideoCreate, creator_id: int, blob_url: str):
    db_video = models.Video(
        title=video.title, publisher=video.publisher, producer=video.producer,
        genre=video.genre, age_rating=video.age_rating, blob_uri=blob_url,
        creator_id=creator_id,
    )
    db.add(db_video); db.commit(); db.refresh(db_video)
    return db_video

def get_video(db: Session, video_id: int):
    return db.query(models.Video).filter(models.Video.video_id == video_id).first()

def get_videos(db: Session, skip: int = 0, limit: int = 10):
    return db.query(models.Video).order_by(models.Video.upload_date.desc()).offset(skip).limit(limit).all()

# Comments
def create_comment(db: Session, video_id: int, user_id: int, comment_text: str):
    db_comment = models.Comment(video_id=video_id, user_id=user_id, comment_text=comment_text)
    db.add(db_comment); db.commit(); db.refresh(db_comment)
    return db_comment

# Ratings
def upsert_rating(db: Session, video_id: int, user_id: int, rating_value: int):
    existing = db.query(models.Rating).filter_by(video_id=video_id, user_id=user_id).first()
    if existing:
        existing.rating = rating_value
        db.commit(); db.refresh(existing)
        return existing
    db_rating = models.Rating(video_id=video_id, user_id=user_id, rating=rating_value)
    db.add(db_rating); db.commit(); db.refresh(db_rating)
    return db_rating

def rating_summary(db: Session, video_id: int):
    avg_, cnt_ = db.query(func.avg(models.Rating.rating), func.count(models.Rating.rating)).filter_by(video_id=video_id).one()
    return {"video_id": video_id, "average": float(avg_) if avg_ is not None else 0.0, "count": int(cnt_)}
