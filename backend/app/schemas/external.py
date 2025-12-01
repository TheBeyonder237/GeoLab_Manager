"""
Schémas pour l'API externe
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from datetime import datetime
from .essai import EssaiBase

class ExternalError(BaseModel):
    """Erreur lors de l'import/export"""
    item_id: str
    error: str

class ExternalResponse(BaseModel):
    """Réponse standard de l'API externe"""
    success: bool
    imported_count: int = 0
    imported_items: List[str] = []
    errors: List[ExternalError] = []
    message: Optional[str] = None

class DataExport(BaseModel):
    """Données exportées"""
    format: str
    data: Any
    count: int
    generated_at: datetime
    metadata: Optional[Dict] = None

class DataSync(BaseModel):
    """Données de synchronisation"""
    last_sync: datetime
    current_sync: datetime
    modified_count: int
    deleted_count: int
    modified_items: List[Dict]
    deleted_items: List[str]

class APIKeyCreate(BaseModel):
    """Création d'une clé API"""
    name: str = Field(..., description="Nom de l'application")
    description: Optional[str] = None
    permissions: List[str] = []
    expires_at: Optional[datetime] = None

class APIKeyResponse(BaseModel):
    """Réponse de création de clé API"""
    key: str
    name: str
    created_at: datetime
    expires_at: Optional[datetime]
    permissions: List[str]
