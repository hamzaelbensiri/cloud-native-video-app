# app/routers/comments.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .auth import get_current_user
from .. import schemas, crud, models
from ..database import get_db

router = APIRouter(prefix="/videos/{video_id}/comments", tags=["Comments"])

@router.post("/", response_model=schemas.CommentOut, status_code=status.HTTP_201_CREATED)
def create_comment(video_id: int, payload: schemas.CommentBase, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return crud.create_comment(db, video_id=video_id, user_id=user.user_id, comment_text=payload.comment_text)

@router.get("/", response_model=List[schemas.CommentOut])
def list_comments(video_id: int, db: Session = Depends(get_db)):
    from ..models import Comment
    return db.query(Comment).filter(Comment.video_id == video_id).order_by(Comment.created_at.desc()).all()

@router.put("/{comment_id}", response_model=schemas.CommentOut)
def update_comment(video_id: int, comment_id: int, payload: schemas.CommentUpdate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    from ..models import Comment
    comment = db.query(Comment).filter(Comment.comment_id == comment_id, Comment.video_id == video_id).first()
    if not comment: raise HTTPException(status_code=404, detail="Comment not found")
    if user.role != models.UserRole.admin and comment.user_id != user.user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(comment, k, v)
    db.commit(); db.refresh(comment)
    return comment

@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(video_id: int, comment_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    from ..models import Comment
    comment = db.query(Comment).filter(Comment.comment_id == comment_id, Comment.video_id == video_id).first()
    if not comment: raise HTTPException(status_code=404, detail="Comment not found")
    if user.role != models.UserRole.admin and comment.user_id != user.user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    db.delete(comment); db.commit()
    return None
