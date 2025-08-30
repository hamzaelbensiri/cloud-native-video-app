# app/routers/users.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .auth import get_current_user, require_admin
from .. import schemas, crud, models
from ..database import get_db

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_admin)])
def create_user_admin(user: schemas.UserCreate, db: Session = Depends(get_db)):
    return crud.create_user(db, user)

@router.get("/{user_id}", response_model=schemas.UserOut)
def read_user(user_id: int, db: Session = Depends(get_db)):
    db_user = crud.get_user(db, user_id)
    if not db_user: raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.get("/", response_model=List[schemas.UserOut], dependencies=[Depends(require_admin)])
def list_users(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    return crud.get_users(db, skip=skip, limit=limit)

@router.put("/{user_id}", response_model=schemas.UserOut)
def update_user(user_id: int, user_update: schemas.UserUpdate, db: Session = Depends(get_db), current: models.User = Depends(get_current_user)):
    db_user = crud.get_user(db, user_id)
    if not db_user: raise HTTPException(status_code=404, detail="User not found")
    # Only admin can change role; users can change own profile fields
    if user_update.role and current.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="Only admin can change roles")
    if current.role != models.UserRole.admin and current.user_id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    payload = user_update.dict(exclude_unset=True)

    # email uniqueness
    if "email" in payload:
        existing = crud.get_user_by_email(db, payload["email"])
        if existing and existing.user_id != user_id:
            raise HTTPException(status_code=400, detail="Email already in use")

    

    for k, v in payload.items():
        setattr(db_user, k, v)
    db.commit();
    db.refresh(db_user)
    return db_user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin)])
def delete_user(user_id: int, db: Session = Depends(get_db)):
    db_user = crud.get_user(db, user_id)
    if not db_user: raise HTTPException(status_code=404, detail="User not found")
    db.delete(db_user); db.commit()
    return None

@router.post("/me/role", response_model=schemas.UserOut)
def set_my_role(
    payload: schemas.UserRoleChange,
    db: Session = Depends(get_db),
    current: models.User = Depends(get_current_user)
):
    """
    Let a logged-in user choose between 'consumer' and 'creator' for themselves.
    Never allow self-escalation to admin.
    """
  
    role_value = getattr(payload.role, "value", payload.role)

    if role_value not in (models.UserRole.consumer.value, models.UserRole.creator.value):
        raise HTTPException(status_code=403, detail="You can only choose consumer or creator.")

    current.role = models.UserRole(role_value)
    db.commit(); db.refresh(current)
    return current

@router.post("/admin", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_admin)])
def create_user_with_role(user: schemas.AdminUserCreate, db: Session = Depends(get_db)):
    return crud.create_user(db, user)