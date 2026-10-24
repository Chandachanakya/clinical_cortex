from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import User
from app.config import settings
import hashlib, hmac, os, base64

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# Pure Python password hashing using PBKDF2-HMAC-SHA256
# This avoids passlib's known Windows/asyncio compatibility issues

def get_password_hash(password: str) -> str:
    """Hash a password using PBKDF2-HMAC-SHA256 (stdlib only)"""
    salt = base64.b64encode(os.urandom(16)).decode('utf-8')
    iterations = 260000
    dk = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), iterations)
    dk_b64 = base64.b64encode(dk).decode('utf-8')
    return f"pbkdf2:sha256:{iterations}${salt}${dk_b64}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a stored hash — supports both our format and passlib's pbkdf2_sha256"""
    try:
        # Handle our own hashlib format: pbkdf2:sha256:ITER$SALT$HASH
        if hashed_password.startswith("pbkdf2:sha256:"):
            parts = hashed_password.split("$")
            iterations = int(hashed_password.split(":")[2].split("$")[0])
            salt = parts[1]
            stored_dk = parts[2]
            dk = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt.encode('utf-8'), iterations)
            computed = base64.b64encode(dk).decode('utf-8')
            return hmac.compare_digest(stored_dk, computed)

        # Handle passlib pbkdf2_sha256 format: $pbkdf2-sha256$ROUNDS$SALT$HASH
        if hashed_password.startswith("$pbkdf2-sha256$"):
            parts = hashed_password.split("$")
            # parts: ['', 'pbkdf2-sha256', rounds, salt_b64, hash_b64]
            rounds = int(parts[2])
            # passlib uses a custom base64 alphabet (no padding, url-safe-ish but with . instead of +)
            salt_raw = _passlib_b64_decode(parts[3])
            stored_hash = _passlib_b64_decode(parts[4])
            dk = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt_raw, rounds)
            return hmac.compare_digest(stored_hash, dk)

        return False
    except Exception:
        return False

def _passlib_b64_decode(s: str) -> bytes:
    """Decode passlib's modified base64 (uses . instead of +, no padding)"""
    s = s.replace(".", "+")
    padding = 4 - len(s) % 4
    if padding != 4:
        s += "=" * padding
    return base64.b64decode(s)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    return current_user
