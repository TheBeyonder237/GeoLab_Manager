"""Schémas Pydantic pour les notifications"""
from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel

from app.models.notification import TypeNotification
from app.schemas.user import User as UserSchema


class NotificationBase(BaseModel):
    """Champs communs à toutes les notifications"""
    type: TypeNotification
    titre: str
    message: str
    lien: Optional[str] = None
    essai_id: Optional[int] = None


class NotificationCreate(NotificationBase):
    """Schéma pour créer une notification"""
    destinataire_id: int


class NotificationUpdate(BaseModel):
    """Schéma générique de mise à jour (actuellement peu utilisé)"""
    lu: Optional[bool] = None
    archive: Optional[bool] = None


class NotificationRead(NotificationBase):
    """Schéma de lecture d'une notification"""
    id: int
    destinataire: UserSchema
    emetteur: Optional[UserSchema] = None
    lu: bool
    archive: bool
    date_lecture: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class NotificationList(BaseModel):
    """Liste paginée de notifications"""
    total: int
    notifications: List[NotificationRead]
    non_lues: int
