"""Schémas Pydantic pour le workflow de validation"""
from datetime import datetime
from typing import Optional, List, Dict, Any

from pydantic import BaseModel

from app.models.workflow import StatutValidation, NiveauValidation
from app.schemas.user import User as UserSchema


# ---------------------
# Workflow de validation
# ---------------------

class WorkflowBase(BaseModel):
    """Champs communs pour un workflow de validation"""
    essai_id: int
    workflow_config: List[NiveauValidation]
    commentaire: Optional[str] = None


class WorkflowCreate(WorkflowBase):
    """Schéma pour démarrer un workflow"""
    # Validateur cible du premier niveau (utilisé pour créer la notification)
    validateur_id: int


class WorkflowUpdate(BaseModel):
    """Schéma générique de mise à jour (peu utilisé directement)"""
    statut: Optional[StatutValidation] = None
    commentaire: Optional[str] = None


class WorkflowRead(WorkflowBase):
    """Schéma de lecture d'un workflow"""
    id: int
    niveau_actuel: NiveauValidation
    statut: StatutValidation
    historique_validations: Optional[List[Dict[str, Any]]] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    validateur_actuel_id: Optional[int] = None
    validateur_actuel: Optional[UserSchema] = None

    class Config:
        from_attributes = True


# ---------------------
# Critères de validation
# ---------------------

class CritereValidationBase(BaseModel):
    """Champs de base pour un critère de validation"""
    type_essai: str
    niveau_validation: NiveauValidation
    criteres: Dict[str, Any]


class CritereValidationCreate(CritereValidationBase):
    """Schéma pour créer un critère"""
    pass


class CritereValidationRead(CritereValidationBase):
    """Schéma de lecture d'un critère"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
