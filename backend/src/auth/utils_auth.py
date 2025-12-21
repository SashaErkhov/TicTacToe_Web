import os
import uuid
import bcrypt
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError

ALGORITHM = "HS256"

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))

def _secret() -> str:
    s = os.getenv("JWT_SECRET_KEY")
    if not s:
        raise RuntimeError("JWT_SECRET_KEY is not set")
    return s

def _access_ttl() -> int:
    return int(os.getenv("ACCESS_TTL_SECONDS", "900"))

def _refresh_ttl() -> int:
    return int(os.getenv("REFRESH_TTL_SECONDS", "604800"))

def create_access_token(user_id: int, username: str) -> tuple[str, int]:
    now = datetime.now(timezone.utc)
    expires_in = _access_ttl()

    payload = {
        "sub": str(user_id),
        "username": username,
        "type": "access",
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(seconds=expires_in)).timestamp()),
    }
    token = jwt.encode(payload, _secret(), algorithm=ALGORITHM)
    return token, expires_in

def decode_access_token(token: str) -> dict:
    payload = jwt.decode(token, _secret(), algorithms=[ALGORITHM])
    if payload.get("type") != "access":
        raise JWTError("Invalid token type")
    return payload

def create_refresh_token() -> str:
    return uuid.uuid4().hex

def refresh_ttl_seconds() -> int:
    return _refresh_ttl()