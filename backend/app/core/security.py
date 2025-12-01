"""
Utilitaires de sécurité (JWT, hashage de mots de passe, clés API)
"""
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt
import secrets
from fastapi import HTTPException, Security, Depends
from fastapi.security.api_key import APIKeyHeader
from starlette.status import HTTP_403_FORBIDDEN
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.models.api_key import APIKey


def _truncate_password(password: str) -> bytes:
    """Tronque un mot de passe à 72 bytes maximum (limite de bcrypt)"""
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        return password_bytes[:72]
    return password_bytes


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Vérifie un mot de passe en clair contre un hash"""
    password_bytes = _truncate_password(plain_password)
    return bcrypt.checkpw(password_bytes, hashed_password.encode('utf-8'))


def get_password_hash(password: str) -> str:
    """Hash un mot de passe avec bcrypt"""
    # Bcrypt limite les mots de passe à 72 bytes
    password_bytes = _truncate_password(password)
    # Générer le salt et hasher
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Crée un token JWT"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """Décode un token JWT"""
    try:
        # Nettoyer le token si il contient "Bearer "
        if token.startswith("Bearer "):
            token = token[7:]
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError as e:
        print(f"Erreur de décodage JWT: {e}")
        return None
    except Exception as e:
        print(f"Erreur inattendue lors du décodage: {e}")
        return None


def generate_api_key() -> str:
    """Génère une nouvelle clé API"""
    return secrets.token_urlsafe(32)


api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


def get_api_key(db: Session, key: str) -> Optional[APIKey]:
    """Récupère une clé API depuis la base de données"""
    return db.query(APIKey).filter(APIKey.key == key, APIKey.active == True).first()


async def verify_api_key(api_key: str = Security(api_key_header), db: Session = Depends(get_db)) -> str:
    """Vérifie une clé API"""
    if not api_key:
        raise HTTPException(
            status_code=HTTP_403_FORBIDDEN,
            detail="Clé API manquante"
        )
    
    db_key = get_api_key(db, api_key)
    if not db_key or not db_key.is_valid():
        raise HTTPException(
            status_code=HTTP_403_FORBIDDEN,
            detail="Clé API invalide"
        )
    
    # Mettre à jour la date de dernière utilisation
    db_key.last_used = datetime.now()
    db.commit()
    
    return api_key
