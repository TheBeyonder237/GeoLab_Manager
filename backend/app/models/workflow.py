"""
Modèle pour le workflow de validation
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, JSON, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base


class StatutValidation(str, enum.Enum):
    """Statuts de validation"""
    EN_ATTENTE = "en_attente"
    APPROUVE = "approuve"
    REJETE = "rejete"
    REVISION_DEMANDEE = "revision_demandee"


class NiveauValidation(str, enum.Enum):
    """Niveaux de validation"""
    TECHNICIEN = "technicien"
    CHEF_LABO = "chef_labo"
    INGENIEUR = "ingenieur"
    ADMIN = "admin"


class WorkflowValidation(Base):
    """Modèle pour le workflow de validation"""
    __tablename__ = "workflow_validations"

    id = Column(Integer, primary_key=True, index=True)
    
    # Essai concerné
    essai_id = Column(Integer, ForeignKey("essais.id"), nullable=False)
    essai = relationship("Essai")
    
    # Niveau de validation actuel
    niveau_actuel = Column(Enum(NiveauValidation), nullable=False)
    statut = Column(Enum(StatutValidation), nullable=False, default=StatutValidation.EN_ATTENTE)
    
    # Configuration du workflow
    workflow_config = Column(JSON, nullable=False)  # Liste ordonnée des niveaux de validation requis
    
    # Historique des validations
    historique_validations = Column(JSON, nullable=True)  # [{niveau, validateur_id, date, statut, commentaire}]
    
    # Commentaires
    commentaire = Column(Text, nullable=True)
    
    # Métadonnées
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relations
    validateur_actuel_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    validateur_actuel = relationship("User", foreign_keys=[validateur_actuel_id])


class CritereValidation(Base):
    """Critères de validation par type d'essai"""
    __tablename__ = "criteres_validation"

    id = Column(Integer, primary_key=True, index=True)
    type_essai = Column(String, nullable=False)
    niveau_validation = Column(Enum(NiveauValidation), nullable=False)
    
    # Critères de validation
    criteres = Column(JSON, nullable=False)  # Liste de critères à vérifier
    
    # Métadonnées
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
