"""
Routes pour la gestion des notifications
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import datetime
from typing import List, Optional
from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.models.notification import Notification, TypeNotification
from app.models.user import User
from app.schemas.notification import (
    NotificationCreate,
    NotificationUpdate,
    NotificationRead,
    NotificationList
)

router = APIRouter()


@router.get("/", response_model=NotificationList)
async def list_notifications(
    non_lues: Optional[bool] = Query(None, description="Filtrer les notifications non lues"),
    type: Optional[TypeNotification] = Query(None, description="Filtrer par type de notification"),
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Liste les notifications de l'utilisateur"""
    query = db.query(Notification).filter(
        Notification.destinataire_id == current_user.id,
        Notification.archive == False
    )
    
    if non_lues is not None:
        query = query.filter(Notification.lu == (not non_lues))
    
    if type:
        query = query.filter(Notification.type == type)
    
    total = query.count()
    notifications = query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "notifications": notifications,
        "non_lues": db.query(Notification).filter(
            Notification.destinataire_id == current_user.id,
            Notification.lu == False,
            Notification.archive == False
        ).count()
    }


@router.post("/", response_model=NotificationRead)
async def create_notification(
    notification: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Crée une nouvelle notification"""
    db_notification = Notification(
        **notification.dict(),
        emetteur_id=current_user.id
    )
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    return db_notification


@router.put("/{notification_id}/lue", response_model=NotificationRead)
async def marquer_comme_lue(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Marque une notification comme lue"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.destinataire_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification non trouvée"
        )
    
    notification.lu = True
    notification.date_lecture = datetime.now()
    db.commit()
    db.refresh(notification)
    return notification


@router.put("/{notification_id}/non-lue", response_model=NotificationRead)
async def marquer_comme_non_lue(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Marque une notification comme non lue"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.destinataire_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification non trouvée"
        )
    
    notification.lu = False
    notification.date_lecture = None
    db.commit()
    db.refresh(notification)
    return notification


@router.put("/{notification_id}/archive", response_model=NotificationRead)
async def archiver_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Archive une notification"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.destinataire_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification non trouvée"
        )
    
    notification.archive = True
    db.commit()
    db.refresh(notification)
    return notification


@router.put("/lire-tout")
async def marquer_tout_comme_lu(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Marque toutes les notifications non lues comme lues"""
    db.query(Notification).filter(
        Notification.destinataire_id == current_user.id,
        Notification.lu == False,
        Notification.archive == False
    ).update({
        "lu": True,
        "date_lecture": datetime.now()
    })
    
    db.commit()
    return {"message": "Toutes les notifications ont été marquées comme lues"}
