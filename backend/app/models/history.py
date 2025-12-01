"""
Modèle pour l'historique des modifications (Audit Trail)
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class EssaiHistory(Base):
    """Historique des modifications d'un essai"""
    __tablename__ = "essais_history"

    id = Column(Integer, primary_key=True, index=True)
    essai_id = Column(Integer, ForeignKey("essais.id"), nullable=False, index=True)
    
    # Qui a fait la modification
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User", foreign_keys=[user_id])
    
    # Type d'action
    action = Column(String, nullable=False)  # 'create', 'update', 'delete', 'status_change'
    
    # Données modifiées
    field_name = Column(String, nullable=True)  # Nom du champ modifié
    old_value = Column(Text, nullable=True)  # Ancienne valeur (JSON si complexe)
    new_value = Column(Text, nullable=True)  # Nouvelle valeur (JSON si complexe)
    
    # Métadonnées
    changes = Column(JSON, nullable=True)  # Tous les changements en une fois
    comment = Column(Text, nullable=True)  # Commentaire optionnel
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

