"""
Modèle pour les projets géotechniques
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Projet(Base):
    """Modèle pour un projet géotechnique"""
    __tablename__ = "projets"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    code_projet = Column(String, unique=True, nullable=False, index=True)  # Code unique du projet
    client = Column(String, nullable=True)
    site = Column(String, nullable=True)  # Localisation du site
    responsable_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Responsable du projet
    date_debut = Column(DateTime(timezone=True), nullable=True)
    date_fin = Column(DateTime(timezone=True), nullable=True)
    statut = Column(String, default="actif", nullable=False)  # actif, termine, archive
    est_archive = Column(Boolean, default=False, nullable=False)
    
    # Métadonnées
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relations
    responsable = relationship("User", foreign_keys=[responsable_id])
    created_by = relationship("User", foreign_keys=[created_by_id])
    essais = relationship("Essai", back_populates="projet", cascade="all, delete-orphan")
    echantillons = relationship("Echantillon", back_populates="projet", cascade="all, delete-orphan")
