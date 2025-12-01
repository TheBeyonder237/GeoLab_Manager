"""
Modèle pour les notifications
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Boolean, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base


class TypeNotification(str, enum.Enum):
    """Types de notifications"""
    VALIDATION_REQUISE = "validation_requise"
    ESSAI_VALIDE = "essai_valide"
    ESSAI_REJETE = "essai_rejete"
    COMMENTAIRE = "commentaire"
    MODIFICATION = "modification"
    RAPPEL = "rappel"
    SYSTEME = "systeme"


class Notification(Base):
    """Modèle pour les notifications"""
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(Enum(TypeNotification), nullable=False)
    titre = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    lien = Column(String, nullable=True)
    
    # Destinataire
    destinataire_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    destinataire = relationship("User", foreign_keys=[destinataire_id])
    
    # Émetteur (peut être null si notification système)
    emetteur_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    emetteur = relationship("User", foreign_keys=[emetteur_id])
    
    # Essai concerné (optionnel)
    essai_id = Column(Integer, ForeignKey("essais.id"), nullable=True)
    essai = relationship("Essai")
    
    # Statut
    lu = Column(Boolean, default=False, nullable=False)
    archive = Column(Boolean, default=False, nullable=False)
    date_lecture = Column(DateTime(timezone=True), nullable=True)
    
    # Métadonnées
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
