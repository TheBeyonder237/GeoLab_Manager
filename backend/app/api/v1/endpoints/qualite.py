"""
Routes pour la gestion de la qualité
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from datetime import datetime, timedelta
from typing import List, Optional
from app.core.database import get_db
from app.core.deps import get_current_active_user, get_current_active_superuser
from app.models.qualite import (
    ControleQualite,
    TypeControle,
    StatutControle,
    CalibrationEquipement,
    NonConformite
)
from app.models.notification import Notification, TypeNotification
from app.models.user import User, UserRole
from app.schemas.qualite import (
    ControleQualiteCreate,
    ControleQualiteUpdate,
    ControleQualiteRead,
    CalibrationCreate,
    CalibrationRead,
    NonConformiteCreate,
    NonConformiteRead
)

router = APIRouter()


@router.post("/controles", response_model=ControleQualiteRead)
async def create_controle(
    controle: ControleQualiteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Crée un nouveau contrôle qualité"""
    if not current_user.role in [UserRole.ADMIN, UserRole.CHEF_LAB]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les administrateurs et chefs de laboratoire peuvent créer des contrôles"
        )
    
    db_controle = ControleQualite(**controle.dict())
    db.add(db_controle)
    db.commit()
    db.refresh(db_controle)
    
    # Créer une notification pour le responsable
    if db_controle.responsable_id != current_user.id:
        notification = Notification(
            type=TypeNotification.SYSTEME,
            titre=f"Nouveau contrôle qualité assigné",
            message=f"Vous avez été assigné comme responsable du contrôle : {db_controle.titre}",
            lien=f"/qualite/controles/{db_controle.id}",
            destinataire_id=db_controle.responsable_id,
            emetteur_id=current_user.id
        )
        db.add(notification)
        db.commit()
    
    return db_controle


@router.get("/controles", response_model=List[ControleQualiteRead])
async def list_controles(
    type: Optional[TypeControle] = None,
    statut: Optional[StatutControle] = None,
    responsable_id: Optional[int] = None,
    date_debut: Optional[str] = None,
    date_fin: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Liste les contrôles qualité"""
    query = db.query(ControleQualite)
    
    if type:
        query = query.filter(ControleQualite.type == type)
    if statut:
        query = query.filter(ControleQualite.statut == statut)
    if responsable_id:
        query = query.filter(ControleQualite.responsable_id == responsable_id)
    if date_debut:
        query = query.filter(ControleQualite.date_prevue >= datetime.strptime(date_debut, "%Y-%m-%d"))
    if date_fin:
        query = query.filter(ControleQualite.date_prevue <= datetime.strptime(date_fin, "%Y-%m-%d"))
    
    return query.order_by(ControleQualite.date_prevue).all()


@router.put("/controles/{controle_id}", response_model=ControleQualiteRead)
async def update_controle(
    controle_id: int,
    controle_update: ControleQualiteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Met à jour un contrôle qualité"""
    controle = db.query(ControleQualite).filter(ControleQualite.id == controle_id).first()
    if not controle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contrôle non trouvé"
        )
    
    if not current_user.role in [UserRole.ADMIN, UserRole.CHEF_LAB] and controle.responsable_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'êtes pas autorisé à modifier ce contrôle"
        )
    
    for key, value in controle_update.dict(exclude_unset=True).items():
        setattr(controle, key, value)
    
    if controle_update.statut == StatutControle.TERMINE:
        controle.date_realisation = datetime.now()
    
    db.commit()
    db.refresh(controle)
    return controle


@router.post("/calibrations", response_model=CalibrationRead)
async def create_calibration(
    calibration: CalibrationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Enregistre une nouvelle calibration d'équipement"""
    if not current_user.role in [UserRole.ADMIN, UserRole.CHEF_LAB, UserRole.INGENIEUR]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'êtes pas autorisé à enregistrer des calibrations"
        )
    
    db_calibration = CalibrationEquipement(
        **calibration.dict(),
        technicien_id=current_user.id
    )
    db.add(db_calibration)
    db.commit()
    db.refresh(db_calibration)
    return db_calibration


@router.get("/calibrations", response_model=List[CalibrationRead])
async def list_calibrations(
    equipement: Optional[str] = None,
    date_debut: Optional[str] = None,
    date_fin: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Liste les calibrations d'équipements"""
    query = db.query(CalibrationEquipement)
    
    if equipement:
        query = query.filter(CalibrationEquipement.equipement.ilike(f"%{equipement}%"))
    if date_debut:
        query = query.filter(CalibrationEquipement.date_calibration >= datetime.strptime(date_debut, "%Y-%m-%d"))
    if date_fin:
        query = query.filter(CalibrationEquipement.date_calibration <= datetime.strptime(date_fin, "%Y-%m-%d"))
    
    return query.order_by(CalibrationEquipement.date_calibration.desc()).all()


@router.post("/non-conformites", response_model=NonConformiteRead)
async def create_non_conformite(
    non_conformite: NonConformiteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Enregistre une nouvelle non-conformité"""
    db_nc = NonConformite(
        **non_conformite.dict(),
        detecteur_id=current_user.id
    )
    db.add(db_nc)
    db.commit()
    db.refresh(db_nc)
    
    # Notifier le responsable qualité
    responsables = db.query(User).filter(
        User.role.in_([UserRole.ADMIN, UserRole.CHEF_LAB])
    ).all()
    
    for responsable in responsables:
        notification = Notification(
            type=TypeNotification.SYSTEME,
            titre="Nouvelle non-conformité détectée",
            message=f"Une non-conformité a été signalée : {db_nc.titre}",
            lien=f"/qualite/non-conformites/{db_nc.id}",
            destinataire_id=responsable.id,
            emetteur_id=current_user.id
        )
        db.add(notification)
    
    db.commit()
    return db_nc


@router.get("/non-conformites", response_model=List[NonConformiteRead])
async def list_non_conformites(
    statut: Optional[bool] = Query(None, description="True pour résolues, False pour non résolues"),
    gravite: Optional[int] = None,
    type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Liste les non-conformités"""
    query = db.query(NonConformite)
    
    if statut is not None:
        if statut:
            query = query.filter(NonConformite.date_resolution.isnot(None))
        else:
            query = query.filter(NonConformite.date_resolution.is_(None))
    
    if gravite:
        query = query.filter(NonConformite.gravite == gravite)
    if type:
        query = query.filter(NonConformite.type == type)
    
    return query.order_by(NonConformite.created_at.desc()).all()


@router.put("/non-conformites/{nc_id}", response_model=NonConformiteRead)
async def update_non_conformite(
    nc_id: int,
    action_corrective: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Met à jour une non-conformité avec l'action corrective"""
    if not current_user.role in [UserRole.ADMIN, UserRole.CHEF_LAB]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les administrateurs et chefs de laboratoire peuvent résoudre les non-conformités"
        )
    
    nc = db.query(NonConformite).filter(NonConformite.id == nc_id).first()
    if not nc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Non-conformité non trouvée"
        )
    
    nc.action_corrective = action_corrective
    nc.date_resolution = datetime.now()
    nc.responsable_id = current_user.id
    
    db.commit()
    db.refresh(nc)
    
    # Notifier le détecteur
    notification = Notification(
        type=TypeNotification.SYSTEME,
        titre="Non-conformité résolue",
        message=f"La non-conformité que vous avez signalée a été résolue : {nc.titre}",
        lien=f"/qualite/non-conformites/{nc.id}",
        destinataire_id=nc.detecteur_id,
        emetteur_id=current_user.id
    )
    db.add(notification)
    db.commit()
    
    return nc
