# app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from jose import JWTError, jwt
from .. import schemas, crud, models, utils
from ..database import get_db
from ..settings import settings

ALGORITHM = utils.ALGORITHM
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if crud.get_user_by_email(db, user.email):
        raise HTTPException(status_code=400, detail="Email already registered")
        # check username
    if crud.get_user_by_username(db, user.username):
        raise HTTPException(status_code=400, detail="Username already taken")
    # role is forced to consumer in CRUD
    return crud.create_user(db, user)

@router.post("/login", response_model=schemas.TokenWithUser)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, form.username)
    if not user or not utils.verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password", headers={"WWW-Authenticate": "Bearer"})
    token = utils.create_access_token(data={"sub": str(user.user_id)})
    return {"access_token": token, "token_type": "bearer", "user": user}

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    creds_exc = HTTPException(status_code=401, detail="Could not validate credentials", headers={"WWW-Authenticate": "Bearer"})
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise creds_exc
    except JWTError:
        raise creds_exc
    user = crud.get_user(db, int(user_id))
    if not user:
        raise creds_exc
    return user

def require_admin(user: models.User = Depends(get_current_user)):
    if user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin only")
    return user

@router.get("/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(get_current_user)):
    return current_user
