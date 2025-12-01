"""
Modèle pour les clés API
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, JSON
from sqlalchemy.sql import func
from app.core.database import Base

class APIKey(Base):
    """Modèle pour les clés API"""
    __tablename__ = "api_keys"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    
    # Permissions et configuration
    permissions = Column(JSON, nullable=False, default=list)
    rate_limit = Column(Integer, nullable=False, default=1000)  # Requêtes par heure
    
    # Statut
    active = Column(Boolean, default=True, nullable=False)
    last_used = Column(DateTime(timezone=True), nullable=True)
    
    # Validité
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)
    
    def is_valid(self) -> bool:
        """Vérifie si la clé API est valide"""
        if not self.active:
            return False
        
        if self.expires_at and self.expires_at < func.now():
            return False
            
        return True
