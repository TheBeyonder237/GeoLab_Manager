"""
Schémas pour la gestion des échantillons
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from .user import UserBase
from app.models.echantillon import StatutEchantillon, TypeEchantillon, MethodePrelevement

class EchantillonBase(BaseModel):
    reference: str
    projet_id: int
    date_prelevement: datetime
    lieu_prelevement: str
    coordonnees: Optional[Dict[str, float]] = None
    profondeur_debut: Optional[float] = None
    profondeur_fin: Optional[float] = None
    methode_prelevement: MethodePrelevement
    type_echantillon: TypeEchantillon
    description: Optional[str] = None
    couleur: Optional[str] = None
    humidite: Optional[str] = None
    texture: Optional[str] = None
    particularites: Optional[str] = None
    photos: Optional[List[str]] = None
    conditions_stockage: Optional[str] = None
    localisation_stockage: Optional[str] = None
    temperature_stockage: Optional[float] = None
    humidite_stockage: Optional[float] = None
    quantite_initiale: float
    unite_quantite: str
    commentaires: Optional[str] = None

class EchantillonCreate(EchantillonBase):
    preleveur_id: int
    receptionnaire_id: Optional[int] = None

class EchantillonUpdate(BaseModel):
    lieu_prelevement: Optional[str] = None
    coordonnees: Optional[Dict[str, float]] = None
    profondeur_debut: Optional[float] = None
    profondeur_fin: Optional[float] = None
    methode_prelevement: Optional[MethodePrelevement] = None
    type_echantillon: Optional[TypeEchantillon] = None
    description: Optional[str] = None
    couleur: Optional[str] = None
    humidite: Optional[str] = None
    texture: Optional[str] = None
    particularites: Optional[str] = None
    photos: Optional[List[str]] = None
    conditions_stockage: Optional[str] = None
    localisation_stockage: Optional[str] = None
    temperature_stockage: Optional[float] = None
    humidite_stockage: Optional[float] = None
    quantite_restante: Optional[float] = None
    commentaires: Optional[str] = None
    statut: Optional[StatutEchantillon] = None
    motif_epuisement: Optional[str] = None

class ManipulationCreate(BaseModel):
    action: str
    quantite: Optional[float] = None
    essai_id: Optional[int] = None

class Manipulation(ManipulationCreate):
    date: datetime
    operateur_id: int

    class Config:
        orm_mode = True

class EchantillonRead(EchantillonBase):
    id: int
    statut: StatutEchantillon
    date_reception: datetime
    quantite_restante: float
    date_epuisement: Optional[datetime] = None
    motif_epuisement: Optional[str] = None
    preleveur: UserBase
    receptionnaire: Optional[UserBase] = None
    historique_manipulations: List[Manipulation] = []
    created_at: datetime
    updated_at: Optional[datetime] = None
    pourcentage_restant: Optional[float] = None

    class Config:
        orm_mode = True

class EchantillonList(BaseModel):
    total: int
    items: List[EchantillonRead]

    class Config:
        orm_mode = True
