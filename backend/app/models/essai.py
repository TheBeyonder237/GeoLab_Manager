"""
Modèles pour les essais géotechniques
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base


class TypeEssai(str, enum.Enum):
    """Types d'essais géotechniques"""
    ATTERBERG = "atterberg"
    CBR = "cbr"
    PROCTOR = "proctor"
    GRANULOMETRIE = "granulometrie"
    AUTRE = "autre"


class StatutEssai(str, enum.Enum):
    """Statuts d'un essai"""
    BROUILLON = "brouillon"
    EN_COURS = "en_cours"
    TERMINE = "termine"
    VALIDE = "valide"


class Essai(Base):
    """Modèle de base pour un essai géotechnique"""
    __tablename__ = "essais"

    id = Column(Integer, primary_key=True, index=True)
    numero_essai = Column(String, unique=True, index=True, nullable=False)
    type_essai = Column(Enum(TypeEssai), nullable=False)
    statut = Column(Enum(StatutEssai), default=StatutEssai.BROUILLON, nullable=False)
    
    # Informations générales
    projet_id = Column(Integer, ForeignKey("projets.id"), nullable=True, index=True)
    projet_nom = Column(String, nullable=True)  # Nom du projet (pour compatibilité)
    echantillon = Column(String, nullable=True)
    date_essai = Column(DateTime(timezone=True), server_default=func.now())
    date_reception = Column(DateTime(timezone=True), nullable=True)
    
    # Opérateur
    operateur_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    operateur = relationship("User", foreign_keys=[operateur_id])
    projet = relationship("Projet", back_populates="essais")
    
    # Résultats calculés (JSON pour flexibilité)
    resultats = Column(JSON, nullable=True)
    
    # Observations
    observations = Column(Text, nullable=True)
    
    # Métadonnées
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relations spécifiques
    atterberg = relationship("EssaiAtterberg", back_populates="essai", uselist=False)
    cbr = relationship("EssaiCBR", back_populates="essai", uselist=False)
    proctor = relationship("EssaiProctor", back_populates="essai", uselist=False)
    granulometrie = relationship("EssaiGranulometrie", back_populates="essai", uselist=False)


class EssaiAtterberg(Base):
    """Données spécifiques pour l'essai de limites d'Atterberg (NF P94-051)"""
    __tablename__ = "essais_atterberg"

    id = Column(Integer, primary_key=True, index=True)
    essai_id = Column(Integer, ForeignKey("essais.id"), unique=True, nullable=False)
    essai = relationship("Essai", back_populates="atterberg")
    
    # Limite de liquidité (WL) - Essai à la coupelle de Casagrande
    wl_nombre_coups_1 = Column(Integer, nullable=True)  # Nombre de coups essai 1
    wl_teneur_eau_1 = Column(Float, nullable=True)  # Teneur en eau essai 1 (%)
    wl_nombre_coups_2 = Column(Integer, nullable=True)  # Nombre de coups essai 2
    wl_teneur_eau_2 = Column(Float, nullable=True)  # Teneur en eau essai 2 (%)
    wl_nombre_coups_3 = Column(Integer, nullable=True)  # Nombre de coups essai 3
    wl_teneur_eau_3 = Column(Float, nullable=True)  # Teneur en eau essai 3 (%)
    wl_methode = Column(String, default="casagrande", nullable=True)  # casagrande ou cone
    
    # Limite de plasticité (WP)
    wp_teneur_eau_1 = Column(Float, nullable=True)  # Teneur en eau essai 1 (%)
    wp_teneur_eau_2 = Column(Float, nullable=True)  # Teneur en eau essai 2 (%)
    wp_teneur_eau_3 = Column(Float, nullable=True)  # Teneur en eau essai 3 (%)
    
    # Limite de retrait (WR) - Optionnel
    wr_teneur_eau = Column(Float, nullable=True)
    volume_initial = Column(Float, nullable=True)  # cm³
    volume_final = Column(Float, nullable=True)  # cm³
    masse_seche = Column(Float, nullable=True)  # g
    
    # Conditions de l'essai
    temperature = Column(Float, nullable=True)  # °C
    humidite_relative = Column(Float, nullable=True)  # %
    
    # Résultats calculés
    wl = Column(Float, nullable=True)  # Limite de liquidité (%)
    wp = Column(Float, nullable=True)  # Limite de plasticité (%)
    wr = Column(Float, nullable=True)  # Limite de retrait (%)
    ip = Column(Float, nullable=True)  # Indice de plasticité (%)
    ic = Column(Float, nullable=True)  # Indice de consistance
    ir = Column(Float, nullable=True)  # Indice de retrait
    ia = Column(Float, nullable=True)  # Indice d'activité (si fraction argileuse connue)
    
    # Classification
    classification = Column(String, nullable=True)  # Classification selon norme


class EssaiCBR(Base):
    """Données spécifiques pour l'essai CBR (NF P94-078)"""
    __tablename__ = "essais_cbr"

    id = Column(Integer, primary_key=True, index=True)
    essai_id = Column(Integer, ForeignKey("essais.id"), unique=True, nullable=False)
    essai = relationship("Essai", back_populates="cbr")
    
    # Conditions de préparation
    teneur_eau_preparation = Column(Float, nullable=True)  # Teneur en eau de préparation (%)
    densite_seche_preparation = Column(Float, nullable=True)  # Densité sèche de préparation (g/cm³)
    energie_compactage = Column(String, nullable=True)  # OPM, OPM+2%, etc.
    nombre_couches = Column(Integer, nullable=True)  # Nombre de couches de compactage
    nombre_coups = Column(Integer, nullable=True)  # Nombre de coups par couche
    
    # Données de pénétration (plusieurs points pour la courbe)
    points_penetration = Column(JSON, nullable=True)  # [{penetration_mm, force_kN}]
    
    # Forces mesurées
    force_25mm = Column(Float, nullable=True)  # Force à 2.5mm (kN)
    force_50mm = Column(Float, nullable=True)  # Force à 5.0mm (kN)
    
    # Conditions après essai
    teneur_eau_finale = Column(Float, nullable=True)  # Teneur en eau après essai (%)
    densite_seche_finale = Column(Float, nullable=True)  # Densité sèche après essai (g/cm³)
    gonflement = Column(Float, nullable=True)  # Gonflement pendant immersion (mm)
    temps_immersion = Column(Integer, nullable=True)  # Temps d'immersion (heures)
    
    # Résultats calculés
    cbr_25mm = Column(Float, nullable=True)  # CBR à 2.5mm (%)
    cbr_50mm = Column(Float, nullable=True)  # CBR à 5.0mm (%)
    cbr_final = Column(Float, nullable=True)  # CBR retenu (%)
    module_ev2 = Column(Float, nullable=True)  # Module EV2 (MPa) si disponible
    
    # Classification
    classe_portance = Column(String, nullable=True)  # Classification selon CBR


class EssaiProctor(Base):
    """Données spécifiques pour l'essai Proctor (NF P94-093)"""
    __tablename__ = "essais_proctor"

    id = Column(Integer, primary_key=True, index=True)
    essai_id = Column(Integer, ForeignKey("essais.id"), unique=True, nullable=False)
    essai = relationship("Essai", back_populates="proctor")
    
    # Type de Proctor
    type_proctor = Column(String, default="normal", nullable=False)  # normal, modifie, ou cbr
    
    # Caractéristiques du moule
    diametre_moule = Column(Float, nullable=True)  # mm
    hauteur_moule = Column(Float, nullable=True)  # mm
    volume_moule = Column(Float, nullable=True)  # cm³
    
    # Paramètres de compactage
    energie_compactage = Column(String, nullable=True)  # Normal, Modifié, CBR
    nombre_couches = Column(Integer, nullable=True)  # Nombre de couches
    nombre_coups = Column(Integer, nullable=True)  # Nombre de coups par couche
    masse_mouton = Column(Float, nullable=True)  # Masse du mouton (kg)
    hauteur_chute = Column(Float, nullable=True)  # Hauteur de chute (cm)
    
    # Points de mesure (JSON pour stocker plusieurs points)
    points_mesure = Column(JSON, nullable=True)  # [{teneur_eau, masse_humide, masse_seche, densite_humide, densite_seche, volume}]
    
    # Données supplémentaires par point
    masse_moule_vide = Column(Float, nullable=True)  # Masse du moule vide (g)
    
    # Résultats calculés
    opm = Column(Float, nullable=True)  # Optimum Proctor (teneur en eau optimale en %)
    densite_seche_max = Column(Float, nullable=True)  # Densité sèche maximale (g/cm³)
    densite_humide_max = Column(Float, nullable=True)  # Densité humide maximale (g/cm³)
    saturation_optimale = Column(Float, nullable=True)  # Degré de saturation à l'optimum (%)
    
    # Courbe Proctor (données pour graphique)
    courbe_proctor = Column(JSON, nullable=True)  # Points pour la courbe complète


class EssaiGranulometrie(Base):
    """Données spécifiques pour l'essai de granulométrie (NF P94-056)"""
    __tablename__ = "essais_granulometrie"

    id = Column(Integer, primary_key=True, index=True)
    essai_id = Column(Integer, ForeignKey("essais.id"), unique=True, nullable=False)
    essai = relationship("Essai", back_populates="granulometrie")
    
    # Type d'essai
    type_essai = Column(String, default="tamisage", nullable=True)  # tamisage, sedimentometrie, ou mixte
    methode = Column(String, nullable=True)  # sèche, humide
    
    # Données initiales
    masse_totale_seche = Column(Float, nullable=True)  # Masse totale sèche (g)
    masse_apres_lavage = Column(Float, nullable=True)  # Masse après lavage (g)
    pourcentage_fines = Column(Float, nullable=True)  # Pourcentage de fines (%)
    
    # Points de tamisage (JSON)
    points_tamisage = Column(JSON, nullable=True)  # [{tamis, masse_retenu, pourcentage_retenu, pourcentage_passant, pourcentage_cumule}]
    
    # Sédimentométrie (si applicable)
    points_sedimentometrie = Column(JSON, nullable=True)  # [{temps_min, hauteur_cm, diametre_mm, pourcentage_passant}]
    temperature_sedimentometrie = Column(Float, nullable=True)  # °C
    viscosite_dynamique = Column(Float, nullable=True)  # Pa.s
    
    # Résultats calculés
    d10 = Column(Float, nullable=True)  # Diamètre à 10% de passant (mm)
    d30 = Column(Float, nullable=True)  # Diamètre à 30% de passant (mm)
    d60 = Column(Float, nullable=True)  # Diamètre à 60% de passant (mm)
    d16 = Column(Float, nullable=True)  # Diamètre à 16% de passant (mm)
    d50 = Column(Float, nullable=True)  # Diamètre médian (mm)
    d84 = Column(Float, nullable=True)  # Diamètre à 84% de passant (mm)
    cu = Column(Float, nullable=True)  # Coefficient d'uniformité (D60/D10)
    cc = Column(Float, nullable=True)  # Coefficient de courbure ((D30)²/(D10*D60))
    cz = Column(Float, nullable=True)  # Coefficient de zone ((D30)²/(D10*D60))
    
    # Classification granulométrique
    classe_granulometrique = Column(String, nullable=True)  # Classification selon norme
    pourcentage_gravier = Column(Float, nullable=True)  # % de gravier (>2mm)
    pourcentage_sable = Column(Float, nullable=True)  # % de sable (0.063-2mm)
    pourcentage_limon = Column(Float, nullable=True)  # % de limon (0.002-0.063mm)
    pourcentage_argile = Column(Float, nullable=True)  # % d'argile (<0.002mm)

