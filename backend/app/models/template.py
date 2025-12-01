"""
Modèle pour les templates/modèles réutilisables d'essais
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class EssaiTemplate(Base):
    """Template réutilisable pour créer des essais"""
    __tablename__ = "essais_templates"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    type_essai = Column(String, nullable=False)  # atterberg, cbr, proctor, granulometrie
    
    # Données du template (JSON pour flexibilité)
    donnees_generales = Column(JSON, nullable=True)  # Projet, échantillon, etc.
    donnees_specifiques = Column(JSON, nullable=True)  # Données spécifiques au type d'essai
    
    # Créateur
    createur_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    createur = relationship("User", foreign_keys=[createur_id])
    
    # Visibilité
    est_public = Column(Boolean, default=False, nullable=False)  # Template partagé ou privé
    
    # Métadonnées
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    usage_count = Column(Integer, default=0, nullable=False)  # Nombre d'utilisations

