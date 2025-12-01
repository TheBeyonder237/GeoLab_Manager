"""
Schémas Pydantic pour les utilisateurs
"""
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime
from app.models.user import UserRole


class UserBase(BaseModel):
    """Schéma de base pour un utilisateur"""
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    role: UserRole = UserRole.TECHNICIEN


class UserCreate(UserBase):
    """Schéma pour créer un utilisateur"""
    password: str


class UserUpdate(BaseModel):
    """Schéma pour mettre à jour un utilisateur"""
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None


class UserInDB(UserBase):
    """Schéma utilisateur en base de données"""
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class User(UserInDB):
    """Schéma utilisateur pour les réponses API"""
    pass


class Token(BaseModel):
    """Schéma pour le token JWT"""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Données du token"""
    user_id: Optional[int] = None

