"""
Services de calcul automatique pour les essais géotechniques
"""
from typing import Dict, Any, List
from app.models.essai import EssaiAtterberg, EssaiCBR, EssaiProctor, EssaiGranulometrie


def calculer_atterberg(atterberg: EssaiAtterberg) -> Dict[str, Any]:
    """
    Calcule les limites d'Atterberg selon NF P94-051
    
    Formules normatives:
    - WL (Limite de liquidité) = interpolation à 25 coups (méthode Casagrande)
    - WP (Limite de plasticité) = moyenne des teneurs en eau
    - IP (Indice de plasticité) = WL - WP
    - IC (Indice de consistance) = (WL - W) / IP
    - IR (Indice de retrait) = WR - WP
    """
    resultats = {}
    
    # Limite de liquidité (WL) - Interpolation à partir de plusieurs points
    points_wl = []
    if atterberg.wl_nombre_coups_1 and atterberg.wl_teneur_eau_1:
        points_wl.append((atterberg.wl_nombre_coups_1, atterberg.wl_teneur_eau_1))
    if atterberg.wl_nombre_coups_2 and atterberg.wl_teneur_eau_2:
        points_wl.append((atterberg.wl_nombre_coups_2, atterberg.wl_teneur_eau_2))
    if atterberg.wl_nombre_coups_3 and atterberg.wl_teneur_eau_3:
        points_wl.append((atterberg.wl_nombre_coups_3, atterberg.wl_teneur_eau_3))
    
    if len(points_wl) >= 2:
        # Interpolation linéaire en échelle logarithmique (méthode standard)
        # WL = a * log(N) + b où N est le nombre de coups
        import math
        try:
            # Transformation logarithmique
            log_points = [(math.log(n), w) for n, w in points_wl if n > 0]
            if len(log_points) >= 2:
                # Régression linéaire simple
                n_vals = [p[0] for p in log_points]
                w_vals = [p[1] for p in log_points]
                n_mean = sum(n_vals) / len(n_vals)
                w_mean = sum(w_vals) / len(w_vals)
                
                # Calcul des coefficients
                numerator = sum((n_vals[i] - n_mean) * (w_vals[i] - w_mean) for i in range(len(n_vals)))
                denominator = sum((n_vals[i] - n_mean) ** 2 for i in range(len(n_vals)))
                
                if denominator != 0:
                    a = numerator / denominator
                    b = w_mean - a * n_mean
                    # WL à 25 coups
                    wl = a * math.log(25) + b
                    resultats["wl"] = round(wl, 2)
                else:
                    # Si un seul point, utiliser la formule d'ajustement
                    if len(points_wl) == 1:
                        n, w = points_wl[0]
                        wl = w * (25 / n) ** 0.12
                        resultats["wl"] = round(wl, 2)
        except:
            # Fallback: méthode simple
            if len(points_wl) == 1:
                n, w = points_wl[0]
                wl = w * (25 / n) ** 0.12
                resultats["wl"] = round(wl, 2)
    
    # Limite de plasticité (WP) - Moyenne des essais
    points_wp = []
    if atterberg.wp_teneur_eau_1 is not None:
        points_wp.append(atterberg.wp_teneur_eau_1)
    if atterberg.wp_teneur_eau_2 is not None:
        points_wp.append(atterberg.wp_teneur_eau_2)
    if atterberg.wp_teneur_eau_3 is not None:
        points_wp.append(atterberg.wp_teneur_eau_3)
    
    if points_wp:
        resultats["wp"] = round(sum(points_wp) / len(points_wp), 2)
    
    # Limite de retrait (WR)
    if (atterberg.wr_teneur_eau is not None and 
        atterberg.volume_initial is not None and 
        atterberg.volume_final is not None and 
        atterberg.masse_seche is not None):
        # WR = teneur en eau correspondant au retrait maximum
        # Calcul simplifié: WR = teneur en eau mesurée
        resultats["wr"] = round(atterberg.wr_teneur_eau, 2)
    
    # Indice de plasticité (IP)
    if "wl" in resultats and "wp" in resultats:
        resultats["ip"] = round(resultats["wl"] - resultats["wp"], 2)
    
    # Indice de retrait (IR)
    if "wr" in resultats and "wp" in resultats:
        resultats["ir"] = round(resultats["wr"] - resultats["wp"], 2)
    
    # Classification selon la norme
    if "ip" in resultats and "wl" in resultats:
        ip = resultats["ip"]
        wl = resultats["wl"]
        if ip < 0:
            classification = "Non plastique"
        elif ip <= 7:
            classification = "Peu plastique"
        elif ip <= 17:
            classification = "Plastique"
        else:
            classification = "Très plastique"
        
        # Classification selon WL
        if wl < 35:
            classification += " - Faible liquidité"
        elif wl <= 50:
            classification += " - Liquidité moyenne"
        else:
            classification += " - Forte liquidité"
        
        resultats["classification"] = classification
    
    return resultats


def calculer_cbr(cbr: EssaiCBR) -> Dict[str, Any]:
    """
    Calcule les valeurs CBR selon NF P94-078
    
    Formules normatives:
    - CBR = (Force mesurée / Force standard) * 100
    - Force standard à 2.5mm = 13.24 kN (NF P94-078)
    - Force standard à 5.0mm = 19.96 kN (NF P94-078)
    - CBR retenu = max(CBR_2.5mm, CBR_5.0mm) si différence < 2%, sinon refaire l'essai
    """
    resultats = {}
    
    # Calculer CBR à partir de la courbe de pénétration si disponible
    if cbr.points_penetration:
        # Extraire les forces à 2.5mm et 5.0mm de la courbe
        for point in cbr.points_penetration:
            if isinstance(point, dict):
                penetration = point.get("penetration_mm", 0)
                force = point.get("force_kN", 0)
                if abs(penetration - 2.5) < 0.1:  # Tolérance de 0.1mm
                    cbr.force_25mm = force
                if abs(penetration - 5.0) < 0.1:
                    cbr.force_50mm = force
    
    # CBR à 2.5mm
    if cbr.force_25mm is not None:
        force_standard_25 = 13.24  # kN (NF P94-078)
        cbr_25 = (cbr.force_25mm / force_standard_25) * 100
        resultats["cbr_25mm"] = round(cbr_25, 2)
    
    # CBR à 5.0mm
    if cbr.force_50mm is not None:
        force_standard_50 = 19.96  # kN (NF P94-078)
        cbr_50 = (cbr.force_50mm / force_standard_50) * 100
        resultats["cbr_50mm"] = round(cbr_50, 2)
    
    # CBR final selon la norme
    if "cbr_25mm" in resultats and "cbr_50mm" in resultats:
        cbr_25 = resultats["cbr_25mm"]
        cbr_50 = resultats["cbr_50mm"]
        difference = abs(cbr_25 - cbr_50)
        
        if difference < 2.0:  # Si différence < 2%, prendre le maximum
            resultats["cbr_final"] = round(max(cbr_25, cbr_50), 2)
        else:
            # Si différence >= 2%, prendre CBR à 2.5mm (selon norme)
            resultats["cbr_final"] = round(cbr_25, 2)
            resultats["note"] = "Différence > 2%, CBR à 2.5mm retenu"
    elif "cbr_25mm" in resultats:
        resultats["cbr_final"] = resultats["cbr_25mm"]
    elif "cbr_50mm" in resultats:
        resultats["cbr_final"] = resultats["cbr_50mm"]
    
    # Classification de portance selon CBR
    if "cbr_final" in resultats:
        cbr_val = resultats["cbr_final"]
        if cbr_val < 2:
            classe = "C1 - Très faible"
        elif cbr_val < 5:
            classe = "C2 - Faible"
        elif cbr_val < 8:
            classe = "C3 - Moyenne"
        elif cbr_val < 15:
            classe = "C4 - Bonne"
        else:
            classe = "C5 - Très bonne"
        resultats["classe_portance"] = classe
    
    # Calcul du module EV2 si les données sont disponibles
    if cbr.points_penetration:
        # Module EV2 approximatif (nécessite courbe complète)
        resultats["note_module"] = "Calcul EV2 nécessite courbe complète charge-déformation"
    
    return resultats


def calculer_proctor(proctor: EssaiProctor) -> Dict[str, Any]:
    """
    Calcule l'optimum Proctor selon NF P94-093
    
    Utilise une interpolation polynomiale pour trouver le maximum de la courbe Proctor
    """
    resultats = {}
    
    if not proctor.points_mesure or len(proctor.points_mesure) < 3:
        return resultats
    
    # Extraire et calculer les points complets
    points = []
    for point in proctor.points_mesure:
        if isinstance(point, dict):
            teneur_eau = point.get("teneur_eau")
            densite_humide = point.get("densite_humide")
            densite_seche = point.get("densite_seche")
            masse_humide = point.get("masse_humide")
            masse_seche = point.get("masse_seche")
            volume = point.get("volume")
            
            # Calculer la densité sèche si non fournie
            if densite_seche is None:
                if densite_humide is not None and teneur_eau is not None:
                    densite_seche = densite_humide / (1 + teneur_eau / 100)
                elif masse_seche is not None and volume is not None and volume > 0:
                    densite_seche = masse_seche / volume
                elif masse_humide is not None and teneur_eau is not None and volume is not None and volume > 0:
                    masse_seche_calc = masse_humide / (1 + teneur_eau / 100)
                    densite_seche = masse_seche_calc / volume
            
            if teneur_eau is not None and densite_seche is not None:
                points.append((teneur_eau, densite_seche))
    
    if len(points) < 3:
        return resultats
    
    # Trier par teneur en eau
    points.sort(key=lambda x: x[0])
    
    # Trouver le maximum (approximation simple)
    max_densite = max(points, key=lambda x: x[1])
    resultats["densite_seche_max"] = round(max_densite[1], 2)
    resultats["opm"] = round(max_densite[0], 2)
    
    # Interpolation polynomiale pour plus de précision
    if len(points) >= 4:
        try:
            import numpy as np
            x = np.array([p[0] for p in points])
            y = np.array([p[1] for p in points])
            
            # Ajustement polynomial de degré 2 (courbe Proctor)
            coeffs = np.polyfit(x, y, 2)
            # y = ax² + bx + c, maximum à x = -b/(2a)
            if coeffs[0] < 0:  # Parabole concave (normal pour Proctor)
                opm_opt = -coeffs[1] / (2 * coeffs[0])
                densite_opt = np.polyval(coeffs, opm_opt)
                
                # Vérifier que l'optimum est dans la plage des mesures
                if points[0][0] <= opm_opt <= points[-1][0]:
                    resultats["opm"] = round(float(opm_opt), 2)
                    resultats["densite_seche_max"] = round(float(densite_opt), 2)
                
                # Générer la courbe Proctor complète pour graphique
                x_curve = np.linspace(points[0][0] - 1, points[-1][0] + 1, 100)
                y_curve = np.polyval(coeffs, x_curve)
                resultats["courbe_proctor"] = [
                    {"teneur_eau": float(x_curve[i]), "densite_seche": float(y_curve[i])}
                    for i in range(len(x_curve))
                ]
        except ImportError:
            pass  # numpy non disponible
    
    # Calculer la densité humide maximale
    if "opm" in resultats and "densite_seche_max" in resultats:
        opm = resultats["opm"]
        densite_seche_max = resultats["densite_seche_max"]
        # Densité humide = densité sèche * (1 + teneur en eau/100)
        resultats["densite_humide_max"] = round(densite_seche_max * (1 + opm / 100), 2)
    
    # Calculer le degré de saturation à l'optimum (si masse volumique des grains connue)
    # S = (w * ρs) / (e * ρw) où e = (ρs/ρd) - 1
    # Approximation: S ≈ w * ρs / ((ρs/ρd - 1) * ρw)
    # Pour simplifier, on peut utiliser ρs = 2.65 g/cm³ (valeur moyenne)
    if "opm" in resultats and "densite_seche_max" in resultats:
        rho_s = 2.65  # Masse volumique des grains (g/cm³) - valeur par défaut
        rho_w = 1.0   # Masse volumique de l'eau (g/cm³)
        w = resultats["opm"] / 100
        rho_d = resultats["densite_seche_max"]
        e = (rho_s / rho_d) - 1  # Indice des vides
        if e > 0:
            S = (w * rho_s) / (e * rho_w) * 100
            resultats["saturation_optimale"] = round(min(S, 100), 1)  # Limité à 100%
    
    return resultats


def calculer_granulometrie(granulometrie: EssaiGranulometrie) -> Dict[str, Any]:
    """
    Calcule les paramètres granulométriques selon NF P94-056
    
    Formules normatives:
    - D10, D30, D60, D16, D50, D84: diamètres correspondant aux pourcentages de passant
    - CU (Coefficient d'uniformité) = D60 / D10
    - CC (Coefficient de courbure) = (D30)² / (D10 * D60)
    - Classification granulométrique selon norme
    """
    resultats = {}
    
    # Calculer les pourcentages cumulés si non fournis
    if granulometrie.points_tamisage:
        masse_totale = granulometrie.masse_totale_seche or 1000  # Valeur par défaut
        
        # Calculer les pourcentages si nécessaire
        points_complets = []
        masse_cumulee = 0
        
        for point in granulometrie.points_tamisage:
            if isinstance(point, dict):
                masse_retenu = point.get("masse_retenu", 0)
                pourcentage_retenu = point.get("pourcentage_retenu")
                pourcentage_passant = point.get("pourcentage_passant")
                pourcentage_cumule = point.get("pourcentage_cumule")
                
                # Calculer si manquant
                if pourcentage_retenu is None and masse_retenu is not None:
                    pourcentage_retenu = (masse_retenu / masse_totale) * 100
                
                masse_cumulee += masse_retenu
                if pourcentage_cumule is None:
                    pourcentage_cumule = (masse_cumulee / masse_totale) * 100
                
                if pourcentage_passant is None:
                    pourcentage_passant = 100 - pourcentage_cumule
                
                point["masse_retenu"] = masse_retenu
                point["pourcentage_retenu"] = round(pourcentage_retenu, 2)
                point["pourcentage_cumule"] = round(pourcentage_cumule, 2)
                point["pourcentage_passant"] = round(pourcentage_passant, 2)
                
                points_complets.append(point)
        
        granulometrie.points_tamisage = points_complets
    
    # Extraire et trier les points
    points = []
    for point in granulometrie.points_tamisage or []:
        if isinstance(point, dict):
            tamis = point.get("tamis")
            pourcentage = point.get("pourcentage_passant")
            if tamis and pourcentage is not None:
                diametre = convertir_tamis_en_diametre(tamis)
                if diametre:
                    points.append((diametre, pourcentage))
    
    # Ajouter les points de sédimentométrie si disponibles
    if granulometrie.points_sedimentometrie:
        for point in granulometrie.points_sedimentometrie:
            if isinstance(point, dict):
                diametre = point.get("diametre_mm")
                pourcentage = point.get("pourcentage_passant")
                if diametre and pourcentage is not None:
                    points.append((diametre, pourcentage))
    
    if len(points) < 2:
        return resultats
    
    # Trier par diamètre décroissant (logarithmique pour meilleure interpolation)
    points.sort(key=lambda x: x[0], reverse=True)
    
    # Interpolation logarithmique pour trouver les diamètres caractéristiques
    resultats["d10"] = round(interpoler_diametre(points, 10), 3) if interpoler_diametre(points, 10) else None
    resultats["d16"] = round(interpoler_diametre(points, 16), 3) if interpoler_diametre(points, 16) else None
    resultats["d30"] = round(interpoler_diametre(points, 30), 3) if interpoler_diametre(points, 30) else None
    resultats["d50"] = round(interpoler_diametre(points, 50), 3) if interpoler_diametre(points, 50) else None
    resultats["d60"] = round(interpoler_diametre(points, 60), 3) if interpoler_diametre(points, 60) else None
    resultats["d84"] = round(interpoler_diametre(points, 84), 3) if interpoler_diametre(points, 84) else None
    
    # Calculer les coefficients
    if resultats.get("d10") and resultats.get("d60"):
        resultats["cu"] = round(resultats["d60"] / resultats["d10"], 2)
    
    if resultats.get("d10") and resultats.get("d30") and resultats.get("d60"):
        resultats["cc"] = round((resultats["d30"] ** 2) / (resultats["d10"] * resultats["d60"]), 2)
    
    # Calculer les pourcentages granulométriques
    if granulometrie.points_tamisage:
        pourcentage_gravier = 0
        pourcentage_sable = 0
        pourcentage_limon = 0
        pourcentage_argile = 0
        
        for point in granulometrie.points_tamisage:
            if isinstance(point, dict):
                diametre = convertir_tamis_en_diametre(point.get("tamis", ""))
                pourcentage_retenu = point.get("pourcentage_retenu", 0)
                
                if diametre:
                    if diametre > 2.0:  # Gravier
                        pourcentage_gravier += pourcentage_retenu
                    elif diametre > 0.063:  # Sable
                        pourcentage_sable += pourcentage_retenu
                    elif diametre > 0.002:  # Limon
                        pourcentage_limon += pourcentage_retenu
                    else:  # Argile
                        pourcentage_argile += pourcentage_retenu
        
        # Ajouter les fines de sédimentométrie
        if granulometrie.points_sedimentometrie:
            for point in granulometrie.points_sedimentometrie:
                if isinstance(point, dict):
                    diametre = point.get("diametre_mm", 0)
                    pourcentage = point.get("pourcentage_passant", 0)
                    if diametre <= 0.002:
                        pourcentage_argile += pourcentage
        
        resultats["pourcentage_gravier"] = round(pourcentage_gravier, 1)
        resultats["pourcentage_sable"] = round(pourcentage_sable, 1)
        resultats["pourcentage_limon"] = round(pourcentage_limon, 1)
        resultats["pourcentage_argile"] = round(pourcentage_argile, 1)
    
    # Classification granulométrique selon NF P94-056
    if resultats.get("d50"):
        d50 = resultats["d50"]
        if d50 > 20:
            classe = "G - Grave"
        elif d50 > 2:
            classe = "S - Sable"
        elif d50 > 0.063:
            classe = "L - Limon"
        else:
            classe = "A - Argile"
        
        # Affiner selon CU et CC
        if resultats.get("cu") and resultats.get("cc"):
            cu = resultats["cu"]
            cc = resultats["cc"]
            if cu > 4 and 1 <= cc <= 3:
                classe += " bien gradué"
            else:
                classe += " mal gradué"
        
        resultats["classe_granulometrique"] = classe
    
    return resultats


def convertir_tamis_en_diametre(tamis: str) -> float:
    """Convertit une référence de tamis en diamètre en mm"""
    # Table de conversion standard (ISO/NF)
    tamis_table = {
        "80mm": 80, "63mm": 63, "50mm": 50, "40mm": 40, "31.5mm": 31.5,
        "25mm": 25, "20mm": 20, "16mm": 16, "12.5mm": 12.5, "10mm": 10,
        "8mm": 8, "6.3mm": 6.3, "5mm": 5, "4mm": 4, "3.15mm": 3.15,
        "2.5mm": 2.5, "2mm": 2, "1.6mm": 1.6, "1.25mm": 1.25, "1mm": 1,
        "0.8mm": 0.8, "0.63mm": 0.63, "0.5mm": 0.5, "0.4mm": 0.4, "0.315mm": 0.315,
        "0.25mm": 0.25, "0.2mm": 0.2, "0.16mm": 0.16, "0.125mm": 0.125, "0.1mm": 0.1,
        "0.08mm": 0.08, "0.063mm": 0.063, "0.05mm": 0.05, "0.04mm": 0.04
    }
    
    # Essayer de trouver une correspondance
    tamis_lower = tamis.lower().strip()
    if tamis_lower in tamis_table:
        return tamis_table[tamis_lower]
    
    # Essayer d'extraire un nombre
    import re
    match = re.search(r'(\d+\.?\d*)', tamis)
    if match:
        return float(match.group(1))
    
    return None


def interpoler_diametre(points: List[tuple], pourcentage: float) -> float:
    """Interpole le diamètre pour un pourcentage de passant donné"""
    if not points:
        return None
    
    # Trouver les deux points encadrant le pourcentage
    for i in range(len(points) - 1):
        d1, p1 = points[i]
        d2, p2 = points[i + 1]
        
        if p1 >= pourcentage >= p2 or p1 <= pourcentage <= p2:
            # Interpolation linéaire
            if p2 != p1:
                d = d1 + (d2 - d1) * (pourcentage - p1) / (p2 - p1)
                return d
            else:
                return d1
    
    # Extrapolation si nécessaire
    if pourcentage > points[0][1]:
        return points[0][0]
    if pourcentage < points[-1][1]:
        return points[-1][0]
    
    return None

