"""JWT üretimi/doğrulaması ve parola hash'leme.

M10 (Kullanıcı Yönetimi ve Yetkilendirme, Gün 3) kapsamında require_role
bağımlılığı ve tam RBAC akışıyla genişletilecektir (FR-10-1..3).
"""

from datetime import datetime, timedelta, timezone

from jose import jwt
from passlib.context import CryptContext

from core.config import get_settings

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(subject: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {"sub": subject, "role": role, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
