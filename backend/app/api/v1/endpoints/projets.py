"""
Routes pour la gestion des projets
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.models.projet import Projet
from app.models.essai import Essai
from app.models.user import User
from app.schemas.projet import Projet as ProjetSchema, ProjetCreate, ProjetUpdate, ProjetWithEssais
# Note: L'historique des projets pourrait être implémenté séparément si nécessaire

router = APIRouter()


@router.get("/", response_model=List[ProjetSchema])
async def list_projets(
    skip: int = 0,
    limit: int = 100,
    statut: Optional[str] = None,
    search: Optional[str] = Query(None, description="Recherche par nom, code, client"),
    archive: Optional[bool] = Query(None, description="Filtrer par statut d'archive"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Liste tous les projets avec filtres optionnels"""
    query = db.query(Projet)
    
    if statut:
        query = query.filter(Projet.statut == statut)
    
    if archive is not None:
        query = query.filter(Projet.est_archive == archive)
    
    if search:
        query = query.filter(
            or_(
                Projet.nom.ilike(f"%{search}%"),
                Projet.code_projet.ilike(f"%{search}%"),
                Projet.client.ilike(f"%{search}%"),
                Projet.site.ilike(f"%{search}%")
            )
        )
    
    projets = query.order_by(Projet.created_at.desc()).offset(skip).limit(limit).all()
    
    # Enrichir avec les informations supplémentaires
    result = []
    for projet in projets:
        # Compter les essais
        nombre_essais = db.query(func.count(Essai.id)).filter(Essai.projet_id == projet.id).scalar()
        
        # Informations du responsable
        responsable_nom = None
        if projet.responsable:
            responsable_nom = projet.responsable.full_name or projet.responsable.username
        
        # Informations du créateur
        created_by_nom = None
        if projet.created_by:
            created_by_nom = projet.created_by.full_name or projet.created_by.username
        
        projet_dict = {
            **projet.__dict__,
            "responsable_nom": responsable_nom,
            "created_by_nom": created_by_nom,
            "nombre_essais": nombre_essais
        }
        result.append(ProjetSchema(**projet_dict))
    
    return result


@router.get("/{projet_id}", response_model=ProjetWithEssais)
async def get_projet(
    projet_id: int,
    include_essais: bool = Query(False, description="Inclure la liste des essais"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Récupère un projet par ID"""
    projet = db.query(Projet).filter(Projet.id == projet_id).first()
    if not projet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projet non trouvé"
        )
    
    # Compter les essais
    nombre_essais = db.query(func.count(Essai.id)).filter(Essai.projet_id == projet.id).scalar()
    
    # Informations du responsable
    responsable_nom = None
    if projet.responsable:
        responsable_nom = projet.responsable.full_name or projet.responsable.username
    
    # Informations du créateur
    created_by_nom = None
    if projet.created_by:
        created_by_nom = projet.created_by.full_name or projet.created_by.username
    
    projet_dict = {
        **projet.__dict__,
        "responsable_nom": responsable_nom,
        "created_by_nom": created_by_nom,
        "nombre_essais": nombre_essais,
        "essais": []
    }
    
    # Inclure les essais si demandé
    if include_essais:
        essais = db.query(Essai).filter(Essai.projet_id == projet_id).order_by(Essai.created_at.desc()).all()
        projet_dict["essais"] = [
            {
                "id": essai.id,
                "numero_essai": essai.numero_essai,
                "type_essai": essai.type_essai.value,
                "statut": essai.statut.value,
                "date_essai": essai.date_essai.isoformat() if essai.date_essai else None,
                "operateur": essai.operateur.full_name if essai.operateur else None
            }
            for essai in essais
        ]
    
    return ProjetWithEssais(**projet_dict)


@router.post("/", response_model=ProjetSchema, status_code=status.HTTP_201_CREATED)
async def create_projet(
    projet_data: ProjetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Crée un nouveau projet"""
    # Vérifier si le code_projet existe déjà
    existing = db.query(Projet).filter(Projet.code_projet == projet_data.code_projet).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Un projet avec le code '{projet_data.code_projet}' existe déjà"
        )
    
    projet = Projet(
        **projet_data.dict(),
        created_by_id=current_user.id
    )
    
    db.add(projet)
    db.commit()
    db.refresh(projet)
    
    # Note: create_history_entry nécessite un essai_id, donc on ne l'utilise pas pour les projets
    # Pour les projets, on pourrait créer une table d'historique séparée si nécessaire
    
    # Enrichir avec les informations supplémentaires
    responsable_nom = None
    if projet.responsable:
        responsable_nom = projet.responsable.full_name or projet.responsable.username
    
    created_by_nom = current_user.full_name or current_user.username
    
    projet_dict = {
        **projet.__dict__,
        "responsable_nom": responsable_nom,
        "created_by_nom": created_by_nom,
        "nombre_essais": 0
    }
    
    return ProjetSchema(**projet_dict)


@router.put("/{projet_id}", response_model=ProjetSchema)
async def update_projet(
    projet_id: int,
    projet_update: ProjetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Met à jour un projet"""
    projet = db.query(Projet).filter(Projet.id == projet_id).first()
    if not projet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projet non trouvé"
        )
    
    # Vérifier les permissions (seul le créateur ou admin peut modifier)
    if projet.created_by_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'êtes pas autorisé à modifier ce projet"
        )
    
    # Vérifier si le code_projet change et s'il existe déjà
    update_data = projet_update.dict(exclude_unset=True)
    if "code_projet" in update_data and update_data["code_projet"] != projet.code_projet:
        existing = db.query(Projet).filter(
            Projet.code_projet == update_data["code_projet"],
            Projet.id != projet_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Un projet avec le code '{update_data['code_projet']}' existe déjà"
            )
    
    # Tracker les changements
    changes = {}
    for field, value in update_data.items():
        old_value = getattr(projet, field, None)
        if old_value != value:
            changes[field] = {
                "old": str(old_value) if old_value is not None else None,
                "new": str(value) if value is not None else None
            }
            setattr(projet, field, value)
    
    db.commit()
    db.refresh(projet)
    
    # Note: create_history_entry nécessite un essai_id, donc on ne l'utilise pas pour les projets
    
    # Enrichir avec les informations supplémentaires
    nombre_essais = db.query(func.count(Essai.id)).filter(Essai.projet_id == projet.id).scalar()
    responsable_nom = projet.responsable.full_name if projet.responsable else None
    created_by_nom = projet.created_by.full_name if projet.created_by else None
    
    projet_dict = {
        **projet.__dict__,
        "responsable_nom": responsable_nom,
        "created_by_nom": created_by_nom,
        "nombre_essais": nombre_essais
    }
    
    return ProjetSchema(**projet_dict)


@router.delete("/{projet_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_projet(
    projet_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Supprime un projet (seulement si vide ou admin)"""
    projet = db.query(Projet).filter(Projet.id == projet_id).first()
    if not projet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projet non trouvé"
        )
    
    # Vérifier les permissions
    if projet.created_by_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'êtes pas autorisé à supprimer ce projet"
        )
    
    # Vérifier s'il y a des essais
    nombre_essais = db.query(func.count(Essai.id)).filter(Essai.projet_id == projet_id).scalar()
    if nombre_essais > 0 and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Impossible de supprimer un projet contenant {nombre_essais} essai(s). Archivez-le à la place."
        )
    
    # Note: create_history_entry nécessite un essai_id, donc on ne l'utilise pas pour les projets
    
    db.delete(projet)
    db.commit()
    return None


@router.post("/{projet_id}/archive", response_model=ProjetSchema)
async def archive_projet(
    projet_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Archive un projet"""
    projet = db.query(Projet).filter(Projet.id == projet_id).first()
    if not projet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projet non trouvé"
        )
    
    projet.est_archive = True
    projet.statut = "archive"
    db.commit()
    db.refresh(projet)
    
    # Enrichir avec les informations supplémentaires
    nombre_essais = db.query(func.count(Essai.id)).filter(Essai.projet_id == projet.id).scalar()
    responsable_nom = projet.responsable.full_name if projet.responsable else None
    created_by_nom = projet.created_by.full_name if projet.created_by else None
    
    projet_dict = {
        **projet.__dict__,
        "responsable_nom": responsable_nom,
        "created_by_nom": created_by_nom,
        "nombre_essais": nombre_essais
    }
    
    return ProjetSchema(**projet_dict)

