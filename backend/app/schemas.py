# app/schemas.py
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

from app.models import UserRole


class UserBase(BaseModel):
    email: EmailStr
    display_name: Optional[str] = None
    role: UserRole

class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=30, pattern=r"^[a-zA-Z0-9_.]+$")
    password: str = Field(min_length=8)

class UserOut(UserBase):
    user_id: int
    username: str
    class Config: from_attributes = True

class UserUpdate(BaseModel):
    email: Optional[EmailStr]
    display_name: Optional[str]
    role: Optional[UserRole]

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserRoleChange(BaseModel):
    role: UserRole  # only 'consumer' or 'creator' will be allowed for self-service



class AdminUserCreate(UserCreate):
    role: UserRole


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenWithUser(Token):
    user: UserOut

# Videos
class VideoBase(BaseModel):
    title: str
    publisher: Optional[str] = None
    producer: Optional[str] = None
    genre: Optional[str] = None
    age_rating: Optional[str] = None
    blob_uri: Optional[str] = None

class VideoCreate(VideoBase): pass

class VideoOut(VideoBase):
    video_id: int
    upload_date: datetime
    creator_id: int
    class Config: from_attributes = True

class VideoUpdate(BaseModel):
    title: Optional[str] = None
    publisher: Optional[str] = None
    producer: Optional[str] = None
    genre: Optional[str] = None
    age_rating: Optional[str] = None
    blob_uri: Optional[str] = None

# Comments
class CommentBase(BaseModel):
    comment_text: str

class CommentCreate(CommentBase):
    video_id: int  # user_id from token

class CommentOut(CommentBase):
    comment_id: int
    created_at: datetime
    user_id: int
    video_id: int
    class Config: from_attributes = True

class CommentUpdate(BaseModel):
    comment_text: Optional[str]

# Ratings
class RatingBase(BaseModel):
    rating: int = Field(ge=1, le=5)

class RatingCreate(RatingBase):
    video_id: int   # user_id from token

class RatingOut(RatingBase):
    rating_id: int
    created_at: datetime
    user_id: int
    video_id: int
    class Config: from_attributes = True

class RatingUpdate(BaseModel):
    rating: int = Field(ge=1, le=5)
