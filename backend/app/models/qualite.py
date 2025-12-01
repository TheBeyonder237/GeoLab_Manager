"""
Modèle pour le contrôle qualité
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, JSON, Text, Float, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base


class TypeControle(str, enum.Enum):
    """Types de contrôle qualité"""
    VERIFICATION_DONNEES = "verification_donnees"
    CALIBRATION = "calibration"
    MAINTENANCE = "maintenance"
    AUDIT = "audit"
    FORMATION = "formation"


class StatutControle(str, enum.Enum):
    """Statuts du contrôle qualité"""
    PLANIFIE = "planifie"
    EN_COURS = "en_cours"
    TERMINE = "termine"
    NON_CONFORME = "non_conforme"


class ControleQualite(Base):
    """Modèle pour le contrôle qualité"""
    __tablename__ = "controles_qualite"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(Enum(TypeControle), nullable=False)
    statut = Column(Enum(StatutControle), nullable=False, default=StatutControle.PLANIFIE)
    
    # Détails du contrôle
    titre = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    date_prevue = Column(DateTime(timezone=True), nullable=False)
    date_realisation = Column(DateTime(timezone=True), nullable=True)
    
    # Résultats
    resultats = Column(JSON, nullable=True)
    conforme = Column(Boolean, nullable=True)
    actions_correctives = Column(Text, nullable=True)
    
    # Relations
    responsable_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    responsable = relationship("User", foreign_keys=[responsable_id])
    
    # Métadonnées
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class CalibrationEquipement(Base):
    """Modèle pour la calibration des équipements"""
    __tablename__ = "calibrations"

    id = Column(Integer, primary_key=True, index=True)
    equipement = Column(String, nullable=False)
    numero_serie = Column(String, nullable=False)
    
    # Données de calibration
    date_calibration = Column(DateTime(timezone=True), nullable=False)
    date_prochaine = Column(DateTime(timezone=True), nullable=False)
    mesures = Column(JSON, nullable=False)  # [{valeur_reference, valeur_mesuree, ecart}]
    
    # Résultats
    precision = Column(Float, nullable=True)
    conforme = Column(Boolean, nullable=False)
    commentaires = Column(Text, nullable=True)
    
    # Relations
    technicien_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    technicien = relationship("User")
    
    # Métadonnées
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class NonConformite(Base):
    """Modèle pour les non-conformités"""
    __tablename__ = "non_conformites"

    id = Column(Integer, primary_key=True, index=True)
    titre = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    
    # Classification
    gravite = Column(Integer, nullable=False)  # 1-5
    type = Column(String, nullable=False)
    origine = Column(String, nullable=False)
    
    # Relations
    essai_id = Column(Integer, ForeignKey("essais.id"), nullable=True)
    essai = relationship("Essai")
    
    detecteur_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    detecteur = relationship("User", foreign_keys=[detecteur_id])
    
    responsable_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    responsable = relationship("User", foreign_keys=[responsable_id])
    
    # Traitement
    action_immediate = Column(Text, nullable=True)
    action_corrective = Column(Text, nullable=True)
    date_resolution = Column(DateTime(timezone=True), nullable=True)
    
    # Métadonnées
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
