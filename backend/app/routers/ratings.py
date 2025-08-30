# app/routers/ratings.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict
from .auth import get_current_user
from .. import schemas, crud, models
from ..database import get_db

router = APIRouter(prefix="/videos/{video_id}/ratings", tags=["Ratings"])

@router.put("/", response_model=schemas.RatingOut)
def rate(video_id: int, payload: schemas.RatingBase, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return crud.upsert_rating(db, video_id=video_id, user_id=user.user_id, rating_value=payload.rating)

@router.get("/summary", response_model=dict)
def rating_summary(video_id: int, db: Session = Depends(get_db)) -> Dict[str, float | int]:
    return crud.rating_summary(db, video_id)
