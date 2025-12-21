from fastapi import Depends, HTTPException, status, Request
from fastapi.responses import Response
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext

from database import SessionLocal
from models import User

SECRET = "SECRET_KEY_CHANGE_ME"
ALGORITHM = "HS256"
TOKEN_EXPIRE_SECONDS = 60 * 60 * 24  # 1 day

pwd = CryptContext(
    schemes=["argon2"],
    deprecated="auto"
)

# ─────────────────────── DB dependency ───────────────────────

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ─────────────────────── JWT helpers ───────────────────────

def create_token(user_id: int):
    payload = {
        "sub": str(user_id),
        "exp": datetime.utcnow() + timedelta(seconds=TOKEN_EXPIRE_SECONDS)
    }
    return jwt.encode(payload, SECRET, algorithm=ALGORITHM)


def decode_token(token: str):
    try:
        return jwt.decode(token, SECRET, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ─────────────────────── Current user ───────────────────────

def get_current_user(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("accessToken")
    if not token:
        raise HTTPException(status_code=401, detail="No token in cookies")

    payload = decode_token(token)
    user_id = int(payload["sub"])
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


# ─────────────────────── Auth logic ───────────────────────

def register_user(data, db: Session):
    if len(data.login) < 3:
        raise HTTPException(status_code=400, detail="Login must be at least 3 characters long")
    if len(data.login) > 32:
        raise HTTPException(status_code=400, detail="Login must not exceed 32 characters")
    if len(data.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
    if len(data.password) > 128:
        raise HTTPException(status_code=400, detail="Password must not exceed 128 characters")

    existing = db.query(User).filter(User.login == data.login).first()
    if existing:
        raise HTTPException(status_code=409, detail="Login already exists")

    user = User(
        login=data.login,
        password_hash=pwd.hash(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def login_user(data, response: Response, db: Session):
    user = db.query(User).filter(User.login == data.login).first()
    if not user or not pwd.verify(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token(user.id)

    response.set_cookie(
        key="accessToken",
        value=token,
        httponly=True,
        secure=True, # True for production False for dev
        samesite="lax",
        max_age=TOKEN_EXPIRE_SECONDS
    )

    return {"status": "ok"}