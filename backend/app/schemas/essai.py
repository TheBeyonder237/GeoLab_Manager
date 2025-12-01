"""
Schémas Pydantic pour les essais géotechniques
"""
from pydantic import BaseModel, model_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.essai import TypeEssai, StatutEssai


# Schémas de base pour Essai
class EssaiBase(BaseModel):
    """Schéma de base pour un essai"""
    numero_essai: str
    type_essai: TypeEssai
    projet: Optional[str] = None
    echantillon: Optional[str] = None
    date_reception: Optional[datetime] = None
    observations: Optional[str] = None


class EssaiCreate(EssaiBase):
    """Schéma pour créer un essai"""
    projet_id: Optional[int] = None  # ID du projet (nouveau système)


class EssaiUpdate(BaseModel):
    """Schéma pour mettre à jour un essai"""
    statut: Optional[StatutEssai] = None
    projet: Optional[str] = None  # Pour compatibilité
    projet_id: Optional[int] = None  # ID du projet (nouveau système)
    echantillon: Optional[str] = None
    date_reception: Optional[datetime] = None
    observations: Optional[str] = None
    resultats: Optional[Dict[str, Any]] = None


class EssaiInDB(EssaiBase):
    """Schéma essai en base de données"""
    id: int
    statut: StatutEssai
    operateur_id: int
    projet_id: Optional[int] = None
    projet_nom: Optional[str] = None
    date_essai: datetime
    resultats: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    @model_validator(mode='before')
    @classmethod
    def extract_projet_nom(cls, data):
        """Extrait le nom du projet si c'est un objet"""
        # Si data est déjà un dict, le retourner tel quel
        if isinstance(data, dict):
            # Si le dict contient un objet projet, le convertir en string
            if 'projet' in data and data['projet'] and not isinstance(data['projet'], str):
                if hasattr(data['projet'], 'nom'):
                    data['projet'] = data['projet'].nom
            return data
        
        # Si data est un objet SQLAlchemy
        if hasattr(data, '__dict__'):
            # Créer un dict à partir de l'objet
            data_dict = {}
            for key in dir(data):
                if not key.startswith('_') and not callable(getattr(data, key, None)):
                    try:
                        value = getattr(data, key, None)
                        # Gérer la relation projet spécialement
                        if key == 'projet' and value and not isinstance(value, str):
                            if hasattr(value, 'nom'):
                                data_dict['projet'] = value.nom
                                # Mettre à jour projet_nom si nécessaire
                                if not hasattr(data, 'projet_nom') or not getattr(data, 'projet_nom', None):
                                    data_dict['projet_nom'] = value.nom
                            else:
                                data_dict['projet'] = None
                        else:
                            data_dict[key] = value
                    except:
                        pass
            
            # Utiliser projet_nom pour projet si projet n'est pas défini
            if 'projet' not in data_dict or not data_dict['projet']:
                if 'projet_nom' in data_dict and data_dict['projet_nom']:
                    data_dict['projet'] = data_dict['projet_nom']
            
            return data_dict
        
        return data

    class Config:
        from_attributes = True


class Essai(EssaiInDB):
    """Schéma essai pour les réponses API"""
    pass


class EssaiExport(EssaiInDB):
    """Schéma d'export d'essai pour l'API externe"""
    pass


class EssaiImport(BaseModel):
    """Schéma d'import d'essai pour l'API externe"""
    numero_essai: str
    type_essai: TypeEssai
    statut: Optional[StatutEssai] = StatutEssai.BROUILLON
    projet_id: Optional[int] = None
    projet_nom: Optional[str] = None
    echantillon: Optional[str] = None
    date_essai: Optional[datetime] = None
    date_reception: Optional[datetime] = None
    observations: Optional[str] = None
    resultats: Optional[Dict[str, Any]] = None
    donnees_specifiques: Optional[Dict[str, Any]] = None


# Schémas pour EssaiAtterberg
class EssaiAtterbergBase(BaseModel):
    """Schéma de base pour Atterberg - Tous les paramètres réels"""
    # Limite de liquidité (WL)
    wl_nombre_coups_1: Optional[int] = None
    wl_teneur_eau_1: Optional[float] = None
    wl_nombre_coups_2: Optional[int] = None
    wl_teneur_eau_2: Optional[float] = None
    wl_nombre_coups_3: Optional[int] = None
    wl_teneur_eau_3: Optional[float] = None
    wl_methode: Optional[str] = "casagrande"
    
    # Limite de plasticité (WP)
    wp_teneur_eau_1: Optional[float] = None
    wp_teneur_eau_2: Optional[float] = None
    wp_teneur_eau_3: Optional[float] = None
    
    # Limite de retrait (WR) - Optionnel
    wr_teneur_eau: Optional[float] = None
    volume_initial: Optional[float] = None
    volume_final: Optional[float] = None
    masse_seche: Optional[float] = None
    
    # Conditions
    temperature: Optional[float] = None
    humidite_relative: Optional[float] = None


class EssaiAtterbergCreate(EssaiAtterbergBase):
    """Schéma pour créer un essai Atterberg"""
    essai_id: int


class EssaiAtterbergUpdate(EssaiAtterbergBase):
    """Schéma pour mettre à jour un essai Atterberg"""
    pass


class EssaiAtterberg(EssaiAtterbergBase):
    """Schéma Atterberg pour les réponses API"""
    id: int
    essai_id: int
    wl: Optional[float] = None
    wp: Optional[float] = None
    wr: Optional[float] = None
    ip: Optional[float] = None
    ic: Optional[float] = None
    ir: Optional[float] = None
    ia: Optional[float] = None
    classification: Optional[str] = None

    class Config:
        from_attributes = True


# Schémas pour EssaiCBR
class PointPenetration(BaseModel):
    """Point de la courbe de pénétration CBR"""
    penetration_mm: float
    force_kN: float


class EssaiCBRBase(BaseModel):
    """Schéma de base pour CBR - Tous les paramètres réels"""
    # Conditions de préparation
    teneur_eau_preparation: Optional[float] = None
    densite_seche_preparation: Optional[float] = None
    energie_compactage: Optional[str] = None
    nombre_couches: Optional[int] = None
    nombre_coups: Optional[int] = None
    
    # Courbe de pénétration
    points_penetration: Optional[List[PointPenetration]] = None
    
    # Forces mesurées
    force_25mm: Optional[float] = None
    force_50mm: Optional[float] = None
    
    # Conditions après essai
    teneur_eau_finale: Optional[float] = None
    densite_seche_finale: Optional[float] = None
    gonflement: Optional[float] = None
    temps_immersion: Optional[int] = None


class EssaiCBRCreate(EssaiCBRBase):
    """Schéma pour créer un essai CBR"""
    essai_id: int


class EssaiCBRUpdate(EssaiCBRBase):
    """Schéma pour mettre à jour un essai CBR"""
    pass


class EssaiCBR(EssaiCBRBase):
    """Schéma CBR pour les réponses API"""
    id: int
    essai_id: int
    cbr_25mm: Optional[float] = None
    cbr_50mm: Optional[float] = None
    cbr_final: Optional[float] = None
    module_ev2: Optional[float] = None
    classe_portance: Optional[str] = None

    class Config:
        from_attributes = True


# Schémas pour EssaiProctor
class PointProctor(BaseModel):
    """Point de mesure Proctor complet"""
    teneur_eau: float
    masse_humide: Optional[float] = None
    masse_seche: Optional[float] = None
    volume: Optional[float] = None
    densite_humide: Optional[float] = None
    densite_seche: Optional[float] = None


class EssaiProctorBase(BaseModel):
    """Schéma de base pour Proctor - Tous les paramètres réels"""
    type_proctor: str = "normal"
    
    # Caractéristiques du moule
    diametre_moule: Optional[float] = None
    hauteur_moule: Optional[float] = None
    volume_moule: Optional[float] = None
    
    # Paramètres de compactage
    energie_compactage: Optional[str] = None
    nombre_couches: Optional[int] = None
    nombre_coups: Optional[int] = None
    masse_mouton: Optional[float] = None
    hauteur_chute: Optional[float] = None
    masse_moule_vide: Optional[float] = None
    
    # Points de mesure
    points_mesure: Optional[List[PointProctor]] = None


class EssaiProctorCreate(EssaiProctorBase):
    """Schéma pour créer un essai Proctor"""
    essai_id: int


class EssaiProctorUpdate(EssaiProctorBase):
    """Schéma pour mettre à jour un essai Proctor"""
    pass


class EssaiProctor(EssaiProctorBase):
    """Schéma Proctor pour les réponses API"""
    id: int
    essai_id: int
    opm: Optional[float] = None
    densite_seche_max: Optional[float] = None
    densite_humide_max: Optional[float] = None
    saturation_optimale: Optional[float] = None
    courbe_proctor: Optional[List[Dict[str, float]]] = None

    class Config:
        from_attributes = True


# Schémas pour EssaiGranulometrie
class PointTamisage(BaseModel):
    """Point de tamisage complet"""
    tamis: str
    masse_retenu: float
    pourcentage_retenu: Optional[float] = None
    pourcentage_cumule: Optional[float] = None
    pourcentage_passant: Optional[float] = None


class PointSedimentometrie(BaseModel):
    """Point de sédimentométrie"""
    temps_min: float
    hauteur_cm: float
    diametre_mm: Optional[float] = None
    pourcentage_passant: float


class EssaiGranulometrieBase(BaseModel):
    """Schéma de base pour Granulométrie - Tous les paramètres réels"""
    type_essai: Optional[str] = "tamisage"
    methode: Optional[str] = None
    
    # Données initiales
    masse_totale_seche: Optional[float] = None
    masse_apres_lavage: Optional[float] = None
    pourcentage_fines: Optional[float] = None
    
    # Points de tamisage
    points_tamisage: Optional[List[PointTamisage]] = None
    
    # Sédimentométrie
    points_sedimentometrie: Optional[List[PointSedimentometrie]] = None
    temperature_sedimentometrie: Optional[float] = None
    viscosite_dynamique: Optional[float] = None


class EssaiGranulometrieCreate(EssaiGranulometrieBase):
    """Schéma pour créer un essai Granulométrie"""
    essai_id: int


class EssaiGranulometrieUpdate(EssaiGranulometrieBase):
    """Schéma pour mettre à jour un essai Granulométrie"""
    pass


class EssaiGranulometrie(EssaiGranulometrieBase):
    """Schéma Granulométrie pour les réponses API"""
    id: int
    essai_id: int
    d10: Optional[float] = None
    d16: Optional[float] = None
    d30: Optional[float] = None
    d50: Optional[float] = None
    d60: Optional[float] = None
    d84: Optional[float] = None
    cu: Optional[float] = None
    cc: Optional[float] = None
    cz: Optional[float] = None
    classe_granulometrique: Optional[str] = None
    pourcentage_gravier: Optional[float] = None
    pourcentage_sable: Optional[float] = None
    pourcentage_limon: Optional[float] = None
    pourcentage_argile: Optional[float] = None

    class Config:
        from_attributes = True

