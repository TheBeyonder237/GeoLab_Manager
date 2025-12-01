"""
Modèle pour la gestion des échantillons
"""
from sqlalchemy import Column, Integer, String, DateTime, Float, Text, ForeignKey, JSON, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base
from datetime import datetime

class StatutEchantillon(str, enum.Enum):
    """Statuts possibles pour un échantillon"""
    RECU = "recu"
    EN_COURS = "en_cours"
    EN_ATTENTE = "en_attente"
    EPUISE = "epuise"
    ARCHIVE = "archive"

class TypeEchantillon(str, enum.Enum):
    """Types d'échantillons"""
    SOL = "sol"
    ROCHE = "roche"
    GRANULAT = "granulat"
    EAU = "eau"
    AUTRE = "autre"

class MethodePrelevement(str, enum.Enum):
    """Méthodes de prélèvement"""
    TARIERE = "tariere"
    CAROTTAGE = "carottage"
    PELLE = "pelle"
    MANUEL = "manuel"
    AUTRE = "autre"

class Echantillon(Base):
    """Modèle pour les échantillons"""
    __tablename__ = "echantillons"

    id = Column(Integer, primary_key=True, index=True)
    reference = Column(String, unique=True, index=True, nullable=False)
    
    # Informations projet
    projet_id = Column(Integer, ForeignKey("projets.id"), nullable=False)
    projet = relationship("Projet", back_populates="echantillons")
    
    # Informations prélèvement
    date_prelevement = Column(DateTime(timezone=True), nullable=False)
    lieu_prelevement = Column(String, nullable=False)
    coordonnees = Column(JSON)  # {latitude: x, longitude: y}
    profondeur_debut = Column(Float)
    profondeur_fin = Column(Float)
    methode_prelevement = Column(Enum(MethodePrelevement), nullable=False)
    preleveur_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    preleveur = relationship("User", foreign_keys=[preleveur_id])
    
    # Caractéristiques
    type_echantillon = Column(Enum(TypeEchantillon), nullable=False)
    description = Column(Text)
    couleur = Column(String)
    humidite = Column(String)
    texture = Column(String)
    particularites = Column(Text)
    photos = Column(JSON)  # Liste des URLs des photos
    
    # Stockage
    date_reception = Column(DateTime(timezone=True), nullable=False)
    conditions_stockage = Column(String)
    localisation_stockage = Column(String)  # Emplacement physique dans le labo
    temperature_stockage = Column(Float)
    humidite_stockage = Column(Float)
    quantite_initiale = Column(Float)
    quantite_restante = Column(Float)
    unite_quantite = Column(String)
    
    # État
    statut = Column(Enum(StatutEchantillon), nullable=False, default=StatutEchantillon.RECU)
    date_epuisement = Column(DateTime(timezone=True))
    motif_epuisement = Column(String)
    
    # Traçabilité
    receptionnaire_id = Column(Integer, ForeignKey("users.id"))
    receptionnaire = relationship("User", foreign_keys=[receptionnaire_id])
    historique_manipulations = Column(JSON, default=list)  # [{date, action, operateur, quantite, essai}]
    commentaires = Column(Text)
    
    # Relations
    
    # Métadonnées
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<Echantillon {self.reference}>"
    
    @property
    def pourcentage_restant(self):
        """Calcule le pourcentage d'échantillon restant"""
        if not self.quantite_initiale or not self.quantite_restante:
            return None
        return (self.quantite_restante / self.quantite_initiale) * 100
    
    def ajouter_manipulation(self, action: str, operateur_id: int, quantite: float = None, essai_id: int = None):
        """Ajoute une manipulation à l'historique"""
        if self.historique_manipulations is None:
            self.historique_manipulations = []
            
        manipulation = {
            "date": datetime.now().isoformat(),
            "action": action,
            "operateur_id": operateur_id,
            "quantite": quantite,
            "essai_id": essai_id
        }
        
        self.historique_manipulations.append(manipulation)
        
        # Mettre à jour la quantité restante si une quantité est spécifiée
        if quantite:
            self.quantite_restante = max(0, self.quantite_restante - quantite)
            
            # Vérifier si l'échantillon est épuisé
            if self.quantite_restante == 0:
                self.statut = StatutEchantillon.EPUISE
                self.date_epuisement = datetime.now()
                self.motif_epuisement = "Épuisement naturel"
