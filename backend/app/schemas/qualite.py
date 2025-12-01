"""Schémas Pydantic pour les fonctionnalités de qualité"""
from datetime import datetime
from typing import Optional, List, Dict, Any

from pydantic import BaseModel

from app.models.qualite import TypeControle, StatutControle
from app.schemas.user import UserBase


# ---------------------
# Contrôles qualité
# ---------------------

class ControleQualiteBase(BaseModel):
    type: TypeControle
    statut: StatutControle = StatutControle.PLANIFIE
    titre: str
    description: Optional[str] = None
    date_prevue: datetime
    resultats: Optional[Dict[str, Any]] = None
    conforme: Optional[bool] = None
    actions_correctives: Optional[str] = None
    responsable_id: int


class ControleQualiteCreate(ControleQualiteBase):
    pass


class ControleQualiteUpdate(BaseModel):
    type: Optional[TypeControle] = None
    statut: Optional[StatutControle] = None
    titre: Optional[str] = None
    description: Optional[str] = None
    date_prevue: Optional[datetime] = None
    date_realisation: Optional[datetime] = None
    resultats: Optional[Dict[str, Any]] = None
    conforme: Optional[bool] = None
    actions_correctives: Optional[str] = None
    responsable_id: Optional[int] = None


class ControleQualiteRead(ControleQualiteBase):
    id: int
    date_realisation: Optional[datetime] = None
    responsable: UserBase
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ---------------------
# Calibrations
# ---------------------

class CalibrationCreate(BaseModel):
    equipement: str
    numero_serie: str
    date_calibration: datetime
    date_prochaine: datetime
    mesures: List[Dict[str, Any]]
    precision: Optional[float] = None
    conforme: bool
    commentaires: Optional[str] = None


class CalibrationRead(CalibrationCreate):
    id: int
    technicien: UserBase
    created_at: datetime

    class Config:
        from_attributes = True


# ---------------------
# Non-conformités
# ---------------------

class NonConformiteBase(BaseModel):
    titre: str
    description: str
    gravite: int
    type: str
    origine: str
    essai_id: Optional[int] = None
    action_immediate: Optional[str] = None


class NonConformiteCreate(NonConformiteBase):
    pass


class NonConformiteRead(NonConformiteBase):
    id: int
    action_corrective: Optional[str] = None
    date_resolution: Optional[datetime] = None
    detecteur: UserBase
    responsable: Optional[UserBase] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
