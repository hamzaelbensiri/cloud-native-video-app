# app/models.py
from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from .database import Base

class UserRole(str, enum.Enum):
    consumer = "consumer"
    creator = "creator"
    admin = "admin"

class User(Base):
    __tablename__= "users"
    user_id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    display_name = Column(String)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.consumer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    videos   = relationship("Video", back_populates="creator", cascade="all, delete-orphan", passive_deletes=True)
    comments = relationship("Comment", back_populates="user", cascade="all, delete-orphan", passive_deletes=True)
    ratings  = relationship("Rating", back_populates="user", cascade="all, delete-orphan", passive_deletes=True)

class Video(Base):
    __tablename__ = "videos"
    video_id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    publisher = Column(String)
    producer = Column(String)
    genre = Column(String)
    age_rating = Column(String)
    blob_uri = Column(String)  # Azure blob URL
    upload_date = Column(DateTime, default=datetime.utcnow, nullable=False)

    creator_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)

    creator  = relationship("User", back_populates="videos")
    comments = relationship("Comment", back_populates="video", cascade="all, delete-orphan", passive_deletes=True)
    ratings  = relationship("Rating", back_populates="video", cascade="all, delete-orphan", passive_deletes=True)

class Comment(Base):
    __tablename__ = "comments"
    __table_args__ = (
        Index("ix_comments_video_created", "video_id", "created_at"),
    )

    comment_id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.video_id", ondelete="CASCADE"), nullable=False, index=True)
    user_id  = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    comment_text = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    video = relationship("Video", back_populates="comments")
    user  = relationship("User", back_populates="comments")

class Rating(Base):
    __tablename__ = "ratings"
    __table_args__ = (
        UniqueConstraint("video_id", "user_id", name="uq_rating_video_user"),
        Index("ix_ratings_video", "video_id"),
    )

    rating_id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.video_id", ondelete="CASCADE"), nullable=False, index=True)
    user_id  = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    rating   = Column(Integer, nullable=False)  # 1–5
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    video = relationship("Video", back_populates="ratings")
    user  = relationship("User", back_populates="ratings")

