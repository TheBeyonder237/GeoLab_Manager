"""
Routes pour les statistiques et analyses
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, case, and_, or_
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from statistics import mean, stdev, median
from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.models.essai import Essai, TypeEssai, StatutEssai, EssaiProctor, EssaiCBR, EssaiAtterberg, EssaiGranulometrie
from app.models.user import User
from app.models.projet import Projet
from app.utils.pdf_generator import generer_rapport_statistiques

router = APIRouter()


@router.get("/dashboard")
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """Récupère les statistiques du tableau de bord"""
    
    # Nombre total d'essais
    total_essais = db.query(func.count(Essai.id)).scalar()
    
    # Essais par type
    essais_par_type = db.query(
        Essai.type_essai,
        func.count(Essai.id).label("count")
    ).group_by(Essai.type_essai).all()
    
    # Essais par statut
    essais_par_statut = db.query(
        Essai.statut,
        func.count(Essai.id).label("count")
    ).group_by(Essai.statut).all()
    
    # Essais par mois (6 derniers mois)
    six_mois_avant = datetime.now() - timedelta(days=180)
    essais_par_mois = db.query(
        extract('year', Essai.created_at).label("annee"),
        extract('month', Essai.created_at).label("mois"),
        func.count(Essai.id).label("count")
    ).filter(
        Essai.created_at >= six_mois_avant
    ).group_by(
        extract('year', Essai.created_at),
        extract('month', Essai.created_at)
    ).order_by(
        extract('year', Essai.created_at).desc(),
        extract('month', Essai.created_at).desc()
    ).all()
    
    # Essais récents (7 derniers jours)
    sept_jours_avant = datetime.now() - timedelta(days=7)
    essais_recents = db.query(func.count(Essai.id)).filter(
        Essai.created_at >= sept_jours_avant
    ).scalar()
    
    return {
        "total_essais": total_essais,
        "essais_recents_7j": essais_recents,
        "par_type": {t.value: c for t, c in essais_par_type},
        "par_statut": {s.value: c for s, c in essais_par_statut},
        "par_mois": [
            {
                "annee": int(a),
                "mois": int(m),
                "count": int(c)
            }
            for a, m, c in essais_par_mois
        ]
    }


@router.get("/par-technicien")
async def get_stats_par_technicien(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """Récupère les statistiques par technicien"""
    
    stats = db.query(
        User.username,
        User.full_name,
        func.count(Essai.id).label("nombre_essais"),
        # SQLAlchemy 2: les whens sont passés en positionnel, sans liste
        func.count(
            case(
                (Essai.statut == StatutEssai.VALIDE, 1),
                else_=None
            )
        ).label("essais_valides"),
        func.avg(
            case(
                (Essai.type_essai == TypeEssai.PROCTOR, EssaiProctor.densite_seche_max),
                else_=None
            )
        ).label("densite_moyenne"),
        func.avg(
            case(
                (Essai.type_essai == TypeEssai.CBR, EssaiCBR.cbr_final),
                else_=None
            )
        ).label("cbr_moyen")
    ).join(
        Essai, Essai.operateur_id == User.id
    ).outerjoin(
        EssaiProctor, EssaiProctor.essai_id == Essai.id
    ).outerjoin(
        EssaiCBR, EssaiCBR.essai_id == Essai.id
    ).group_by(
        User.id, User.username, User.full_name
    ).order_by(
        func.count(Essai.id).desc()
    ).all()
    
    return {
        "techniciens": [
            {
                "username": username,
                "full_name": full_name,
                "nombre_essais": int(nombre),
                "essais_valides": int(valides),
                "densite_moyenne": float(densite) if densite else None,
                "cbr_moyen": float(cbr) if cbr else None
            }
            for username, full_name, nombre, valides, densite, cbr in stats
        ]
    }

@router.get("/{type_essai}")
async def get_stats_par_type(
    type_essai: TypeEssai,
    date_debut: Optional[str] = None,
    date_fin: Optional[str] = None,
    projet_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """Récupère les statistiques détaillées par type d'essai"""
    
    query = db.query(Essai).filter(Essai.type_essai == type_essai)
    
    if date_debut:
        query = query.filter(Essai.date_essai >= datetime.strptime(date_debut, "%Y-%m-%d"))
    if date_fin:
        query = query.filter(Essai.date_essai <= datetime.strptime(date_fin, "%Y-%m-%d"))
    if projet_id:
        query = query.filter(Essai.projet_id == projet_id)
    
    essais = query.all()
    
    if not essais:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucun essai trouvé pour ces critères"
        )
    
    stats = {
        "nombre_total": len(essais),
        "nombre_valides": len([e for e in essais if e.statut == StatutEssai.VALIDE]),
        "distribution": [],
        "tendances": []
    }
    
    if type_essai == TypeEssai.PROCTOR:
        densites = [e.proctor.densite_seche_max for e in essais if e.proctor and e.proctor.densite_seche_max]
        if densites:
            stats.update({
                "densite_min": min(densites),
                "densite_max": max(densites),
                "densite_moyenne": mean(densites),
                "densite_mediane": median(densites),
                "densite_ecart_type": stdev(densites) if len(densites) > 1 else 0
            })
    
    elif type_essai == TypeEssai.CBR:
        cbrs = [e.cbr.cbr_final for e in essais if e.cbr and e.cbr.cbr_final]
        if cbrs:
            stats.update({
                "cbr_min": min(cbrs),
                "cbr_max": max(cbrs),
                "cbr_moyen": mean(cbrs),
                "cbr_median": median(cbrs),
                "cbr_ecart_type": stdev(cbrs) if len(cbrs) > 1 else 0
            })
    
    elif type_essai == TypeEssai.ATTERBERG:
        wls = [e.atterberg.wl for e in essais if e.atterberg and e.atterberg.wl]
        if wls:
            stats.update({
                "wl_min": min(wls),
                "wl_max": max(wls),
                "wl_moyen": mean(wls),
                "wl_median": median(wls),
                "wl_ecart_type": stdev(wls) if len(wls) > 1 else 0
            })
    
    # Calcul des tendances temporelles
    stats["tendances"] = db.query(
        func.date_trunc('month', Essai.date_essai).label("mois"),
        func.count(Essai.id).label("nombre")
    ).filter(
        Essai.type_essai == type_essai
    ).group_by(
        func.date_trunc('month', Essai.date_essai)
    ).order_by(
        func.date_trunc('month', Essai.date_essai)
    ).all()
    
    return stats

@router.get("/{type_essai}/export")
async def export_statistiques(
    type_essai: TypeEssai,
    date_debut: Optional[str] = None,
    date_fin: Optional[str] = None,
    projet_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Exporte les statistiques au format PDF"""
    
    stats = await get_stats_par_type(type_essai, date_debut, date_fin, projet_id, db, current_user)
    
    # Générer le PDF
    pdf_buffer = generer_rapport_statistiques(stats, type_essai)
    
    return pdf_buffer
