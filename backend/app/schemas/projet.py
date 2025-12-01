"""
Schémas Pydantic pour les projets
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ProjetBase(BaseModel):
    nom: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    code_projet: str = Field(..., min_length=1, max_length=50)
    client: Optional[str] = None
    site: Optional[str] = None
    responsable_id: Optional[int] = None
    date_debut: Optional[datetime] = None
    date_fin: Optional[datetime] = None
    statut: str = Field(default="actif", pattern="^(actif|termine|archive)$")


class ProjetCreate(ProjetBase):
    pass


class ProjetUpdate(BaseModel):
    nom: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    code_projet: Optional[str] = Field(None, min_length=1, max_length=50)
    client: Optional[str] = None
    site: Optional[str] = None
    responsable_id: Optional[int] = None
    date_debut: Optional[datetime] = None
    date_fin: Optional[datetime] = None
    statut: Optional[str] = Field(None, pattern="^(actif|termine|archive)$")
    est_archive: Optional[bool] = None


class Projet(ProjetBase):
    id: int
    est_archive: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by_id: int
    responsable_id: Optional[int] = None
    
    # Informations liées
    responsable_nom: Optional[str] = None
    created_by_nom: Optional[str] = None
    nombre_essais: int = 0
    
    class Config:
        from_attributes = True


class ProjetWithEssais(Projet):
    """Projet avec la liste des essais"""
    essais: List[dict] = []

