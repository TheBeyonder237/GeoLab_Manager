"""
Routes pour la gestion des échantillons
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, File, UploadFile
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.models.user import User
from app.models.echantillon import Echantillon, StatutEchantillon, TypeEchantillon
from app.schemas.echantillon import (
    EchantillonCreate,
    EchantillonUpdate,
    EchantillonRead,
    EchantillonList,
    ManipulationCreate
)
from app.utils.storage import upload_file
from app.utils.qr_generator import generate_qr_code

router = APIRouter()

@router.post("/", response_model=EchantillonRead)
async def create_echantillon(
    echantillon: EchantillonCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Crée un nouvel échantillon"""
    # Générer une référence unique si non fournie
    if not echantillon.reference:
        date_str = datetime.now().strftime("%Y%m%d")
        count = db.query(Echantillon).filter(
            Echantillon.reference.like(f"{date_str}%")
        ).count()
        echantillon.reference = f"{date_str}-{count+1:03d}"
    
    # Créer l'échantillon
    db_echantillon = Echantillon(
        **echantillon.dict(),
        quantite_restante=echantillon.quantite_initiale,
        date_reception=datetime.now(),
        receptionnaire_id=current_user.id
    )
    
    db.add(db_echantillon)
    db.commit()
    db.refresh(db_echantillon)
    
    # Générer et sauvegarder le QR code
    qr_code = generate_qr_code(db_echantillon.reference)
    # TODO: Sauvegarder le QR code
    
    return db_echantillon

@router.get("/", response_model=EchantillonList)
async def list_echantillons(
    skip: int = 0,
    limit: int = 100,
    statut: Optional[StatutEchantillon] = None,
    type: Optional[TypeEchantillon] = None,
    projet_id: Optional[int] = None,
    search: Optional[str] = None,
    date_debut: Optional[str] = None,
    date_fin: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Liste les échantillons avec filtres"""
    query = db.query(Echantillon)
    
    if statut:
        query = query.filter(Echantillon.statut == statut)
    if type:
        query = query.filter(Echantillon.type_echantillon == type)
    if projet_id:
        query = query.filter(Echantillon.projet_id == projet_id)
    if search:
        query = query.filter(
            Echantillon.reference.ilike(f"%{search}%") |
            Echantillon.lieu_prelevement.ilike(f"%{search}%") |
            Echantillon.description.ilike(f"%{search}%")
        )
    if date_debut:
        query = query.filter(Echantillon.date_prelevement >= datetime.strptime(date_debut, "%Y-%m-%d"))
    if date_fin:
        query = query.filter(Echantillon.date_prelevement <= datetime.strptime(date_fin, "%Y-%m-%d"))
    
    total = query.count()
    items = query.order_by(Echantillon.date_prelevement.desc()).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "items": items
    }

@router.get("/{echantillon_id}", response_model=EchantillonRead)
async def get_echantillon(
    echantillon_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Récupère les détails d'un échantillon"""
    echantillon = db.query(Echantillon).filter(Echantillon.id == echantillon_id).first()
    if not echantillon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Échantillon non trouvé"
        )
    return echantillon

@router.put("/{echantillon_id}", response_model=EchantillonRead)
async def update_echantillon(
    echantillon_id: int,
    echantillon_update: EchantillonUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Met à jour un échantillon"""
    db_echantillon = db.query(Echantillon).filter(Echantillon.id == echantillon_id).first()
    if not db_echantillon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Échantillon non trouvé"
        )
    
    # Mise à jour des champs
    for key, value in echantillon_update.dict(exclude_unset=True).items():
        setattr(db_echantillon, key, value)
    
    db.commit()
    db.refresh(db_echantillon)
    return db_echantillon

@router.post("/{echantillon_id}/photos")
async def upload_photos(
    echantillon_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Ajoute des photos à un échantillon"""
    echantillon = db.query(Echantillon).filter(Echantillon.id == echantillon_id).first()
    if not echantillon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Échantillon non trouvé"
        )
    
    photos = echantillon.photos or []
    
    for file in files:
        # Upload du fichier
        url = await upload_file(file, f"echantillons/{echantillon_id}/photos/")
        photos.append(url)
    
    echantillon.photos = photos
    db.commit()
    
    return {"message": f"{len(files)} photo(s) ajoutée(s)", "photos": photos}

@router.post("/{echantillon_id}/manipulations", response_model=EchantillonRead)
async def add_manipulation(
    echantillon_id: int,
    manipulation: ManipulationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Ajoute une manipulation à l'historique d'un échantillon"""
    echantillon = db.query(Echantillon).filter(Echantillon.id == echantillon_id).first()
    if not echantillon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Échantillon non trouvé"
        )
    
    # Vérifier si l'échantillon n'est pas épuisé
    if echantillon.statut == StatutEchantillon.EPUISE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Impossible de manipuler un échantillon épuisé"
        )
    
    # Ajouter la manipulation
    echantillon.ajouter_manipulation(
        action=manipulation.action,
        operateur_id=current_user.id,
        quantite=manipulation.quantite,
        essai_id=manipulation.essai_id
    )
    
    db.commit()
    db.refresh(echantillon)
    return echantillon

@router.get("/{echantillon_id}/qr-code")
async def get_qr_code(
    echantillon_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Génère ou récupère le QR code d'un échantillon"""
    echantillon = db.query(Echantillon).filter(Echantillon.id == echantillon_id).first()
    if not echantillon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Échantillon non trouvé"
        )
    
    qr_code = generate_qr_code(echantillon.reference)
    return {"qr_code": qr_code}
