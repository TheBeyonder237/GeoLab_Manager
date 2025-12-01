"""
Service de validation automatique selon les normes géotechniques
"""
from typing import Dict, List, Any, Optional
from app.models.essai import EssaiAtterberg, EssaiCBR, EssaiProctor, EssaiGranulometrie


class ValidationError(Exception):
    """Exception pour les erreurs de validation"""
    pass


def validate_atterberg(atterberg: EssaiAtterberg) -> Dict[str, Any]:
    """
    Valide les données d'un essai Atterberg selon NF P94-051
    
    Retourne un dictionnaire avec:
    - valid: bool
    - warnings: List[str]
    - errors: List[str]
    """
    result = {
        "valid": True,
        "warnings": [],
        "errors": []
    }
    
    # Validation de la limite de liquidité (WL)
    if atterberg.wl_nombre_coups_1:
        if not (15 <= atterberg.wl_nombre_coups_1 <= 35):
            result["warnings"].append(
                f"Nombre de coups essai 1 ({atterberg.wl_nombre_coups_1}) hors de la plage recommandée (15-35)"
            )
    
    if atterberg.wl_nombre_coups_2:
        if not (15 <= atterberg.wl_nombre_coups_2 <= 35):
            result["warnings"].append(
                f"Nombre de coups essai 2 ({atterberg.wl_nombre_coups_2}) hors de la plage recommandée (15-35)"
            )
    
    if atterberg.wl_nombre_coups_3:
        if not (15 <= atterberg.wl_nombre_coups_3 <= 35):
            result["warnings"].append(
                f"Nombre de coups essai 3 ({atterberg.wl_nombre_coups_3}) hors de la plage recommandée (15-35)"
            )
    
    # Validation des teneurs en eau
    teneurs_eau_wl = [
        atterberg.wl_teneur_eau_1,
        atterberg.wl_teneur_eau_2,
        atterberg.wl_teneur_eau_3
    ]
    teneurs_eau_wl = [t for t in teneurs_eau_wl if t is not None]
    
    if len(teneurs_eau_wl) > 0:
        for te in teneurs_eau_wl:
            if te < 0 or te > 200:
                result["errors"].append(f"Teneur en eau invalide: {te}% (doit être entre 0 et 200%)")
                result["valid"] = False
    
    # Validation de la limite de plasticité (WP)
    teneurs_eau_wp = [
        atterberg.wp_teneur_eau_1,
        atterberg.wp_teneur_eau_2,
        atterberg.wp_teneur_eau_3
    ]
    teneurs_eau_wp = [t for t in teneurs_eau_wp if t is not None]
    
    if len(teneurs_eau_wp) > 0:
        for te in teneurs_eau_wp:
            if te < 0 or te > 100:
                result["errors"].append(f"Teneur en eau WP invalide: {te}% (doit être entre 0 et 100%)")
                result["valid"] = False
    
    # Validation de la cohérence WL > WP
    if atterberg.wl and atterberg.wp:
        if atterberg.wl < atterberg.wp:
            result["errors"].append(
                f"La limite de liquidité ({atterberg.wl}%) doit être supérieure à la limite de plasticité ({atterberg.wp}%)"
            )
            result["valid"] = False
    
    # Validation de l'indice de plasticité
    if atterberg.ip:
        if atterberg.ip < 0:
            result["errors"].append(f"L'indice de plasticité ({atterberg.ip}%) ne peut pas être négatif")
            result["valid"] = False
        elif atterberg.ip > 100:
            result["warnings"].append(f"Indice de plasticité très élevé: {atterberg.ip}%")
    
    return result


def validate_cbr(cbr: EssaiCBR) -> Dict[str, Any]:
    """
    Valide les données d'un essai CBR selon NF P94-078
    """
    result = {
        "valid": True,
        "warnings": [],
        "errors": []
    }
    
    # Validation des valeurs de pénétration
    if cbr.points_penetration:
        for point in cbr.points_penetration:
            if isinstance(point, dict):
                force = point.get("force_kn", 0)
                penetration = point.get("penetration_mm", 0)
                
                if penetration < 0 or penetration > 12.5:
                    result["errors"].append(
                        f"Pénétration invalide: {penetration}mm (doit être entre 0 et 12.5mm)"
                    )
                    result["valid"] = False
                
                if force < 0 or force > 50:
                    result["warnings"].append(
                        f"Force élevée: {force}kN (vérifier la cohérence)"
                    )
    
    # Validation des CBR calculés
    if cbr.cbr_25mm:
        if cbr.cbr_25mm < 0 or cbr.cbr_25mm > 100:
            result["errors"].append(f"CBR à 2.5mm invalide: {cbr.cbr_25mm}%")
            result["valid"] = False
    
    if cbr.cbr_50mm:
        if cbr.cbr_50mm < 0 or cbr.cbr_50mm > 100:
            result["errors"].append(f"CBR à 5.0mm invalide: {cbr.cbr_50mm}%")
            result["valid"] = False
    
    # Validation de la cohérence CBR
    if cbr.cbr_25mm and cbr.cbr_50mm:
        if cbr.cbr_25mm > cbr.cbr_50mm:
            result["warnings"].append(
                "Le CBR à 2.5mm est supérieur au CBR à 5.0mm (vérifier la cohérence)"
            )
    
    # Validation de la teneur en eau
    if cbr.teneur_eau_finale:
        if cbr.teneur_eau_finale < 0 or cbr.teneur_eau_finale > 100:
            result["errors"].append(f"Teneur en eau finale invalide: {cbr.teneur_eau_finale}%")
            result["valid"] = False
    
    return result


def validate_proctor(proctor: EssaiProctor) -> Dict[str, Any]:
    """
    Valide les données d'un essai Proctor selon NF P94-093
    """
    result = {
        "valid": True,
        "warnings": [],
        "errors": []
    }
    
    # Validation des points de mesure
    if proctor.points_mesure:
        for point in proctor.points_mesure:
            if isinstance(point, dict):
                teneur_eau = point.get("teneur_eau", 0)
                densite_seche = point.get("densite_seche", 0)
                
                if teneur_eau < 0 or teneur_eau > 50:
                    result["errors"].append(
                        f"Teneur en eau invalide: {teneur_eau}% (doit être entre 0 et 50%)"
                    )
                    result["valid"] = False
                
                if densite_seche < 0 or densite_seche > 3.0:
                    result["errors"].append(
                        f"Densité sèche invalide: {densite_seche}g/cm³ (doit être entre 0 et 3.0g/cm³)"
                    )
                    result["valid"] = False
    
    # Validation de l'OPM
    if proctor.optimum_proctor:
        if proctor.optimum_proctor < 0 or proctor.optimum_proctor > 50:
            result["errors"].append(f"OPM invalide: {proctor.optimum_proctor}%")
            result["valid"] = False
    
    # Validation de la densité sèche max
    if proctor.densite_seche_max:
        if proctor.densite_seche_max < 1.0 or proctor.densite_seche_max > 3.0:
            result["warnings"].append(
                f"Densité sèche max inhabituelle: {proctor.densite_seche_max}g/cm³"
            )
    
    return result


def validate_granulometrie(granulometrie: EssaiGranulometrie) -> Dict[str, Any]:
    """
    Valide les données d'un essai de granulométrie selon NF P94-056
    """
    result = {
        "valid": True,
        "warnings": [],
        "errors": []
    }
    
    # Validation de la masse totale
    if granulometrie.masse_totale_seche:
        if granulometrie.masse_totale_seche <= 0:
            result["errors"].append("La masse totale sèche doit être positive")
            result["valid"] = False
        elif granulometrie.masse_totale_seche < 100:
            result["warnings"].append("Masse totale très faible, vérifier la précision")
    
    # Validation des points de tamisage
    if granulometrie.points_tamisage:
        total_pourcentage = 0
        for point in granulometrie.points_tamisage:
            if isinstance(point, dict):
                pourcentage = point.get("pourcentage_retenu", 0) or point.get("pourcentage_cumule", 0)
                total_pourcentage += pourcentage
                
                if pourcentage < 0 or pourcentage > 100:
                    result["errors"].append(f"Pourcentage invalide: {pourcentage}%")
                    result["valid"] = False
        
        if abs(total_pourcentage - 100) > 5:
            result["warnings"].append(
                f"La somme des pourcentages ({total_pourcentage}%) s'écarte significativement de 100%"
            )
    
    # Validation des diamètres caractéristiques
    if granulometrie.d10:
        if granulometrie.d10 <= 0:
            result["errors"].append("D10 doit être positif")
            result["valid"] = False
    
    if granulometrie.d60 and granulometrie.d10:
        if granulometrie.d60 < granulometrie.d10:
            result["errors"].append("D60 doit être supérieur à D10")
            result["valid"] = False
    
    return result


def validate_essai(essai_type: str, essai_data: Any) -> Dict[str, Any]:
    """
    Valide un essai selon son type
    """
    validators = {
        "atterberg": validate_atterberg,
        "cbr": validate_cbr,
        "proctor": validate_proctor,
        "granulometrie": validate_granulometrie
    }
    
    validator = validators.get(essai_type)
    if not validator:
        return {
            "valid": True,
            "warnings": [],
            "errors": []
        }
    
    return validator(essai_data)

