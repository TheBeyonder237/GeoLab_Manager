"""
Routes pour l'historique des modifications (Audit Trail)
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.models.essai import Essai
from app.models.history import EssaiHistory
from app.models.user import User
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()


class HistoryItem(BaseModel):
    """Schéma pour un élément d'historique"""
    id: int
    essai_id: int
    user_id: int
    user_name: str
    action: str
    field_name: str | None
    old_value: str | None
    new_value: str | None
    changes: dict | None
    comment: str | None
    created_at: datetime

    class Config:
        from_attributes = True


def create_history_entry(
    db: Session,
    essai_id: int,
    user_id: int,
    action: str,
    field_name: str | None = None,
    old_value: str | None = None,
    new_value: str | None = None,
    changes: dict | None = None,
    comment: str | None = None
):
    """Crée une entrée d'historique"""
    history = EssaiHistory(
        essai_id=essai_id,
        user_id=user_id,
        action=action,
        field_name=field_name,
        old_value=str(old_value) if old_value is not None else None,
        new_value=str(new_value) if new_value is not None else None,
        changes=changes,
        comment=comment
    )
    db.add(history)
    db.commit()
    return history


@router.get("/essais/{essai_id}/history", response_model=List[HistoryItem])
async def get_essai_history(
    essai_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Récupère l'historique complet d'un essai"""
    # Vérifier que l'essai existe
    essai = db.query(Essai).filter(Essai.id == essai_id).first()
    if not essai:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Essai non trouvé"
        )
    
    # Récupérer l'historique
    history = db.query(EssaiHistory).filter(
        EssaiHistory.essai_id == essai_id
    ).order_by(EssaiHistory.created_at.desc()).all()
    
    # Enrichir avec les noms d'utilisateurs
    result = []
    for item in history:
        user = db.query(User).filter(User.id == item.user_id).first()
        result.append({
            **item.__dict__,
            "user_name": user.full_name if user and user.full_name else user.username if user else "Inconnu"
        })
    
    return result


@router.get("/history/recent", response_model=List[HistoryItem])
async def get_recent_history(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Récupère l'historique récent de tous les essais"""
    history = db.query(EssaiHistory).order_by(
        EssaiHistory.created_at.desc()
    ).limit(limit).all()
    
    result = []
    for item in history:
        user = db.query(User).filter(User.id == item.user_id).first()
        result.append({
            **item.__dict__,
            "user_name": user.full_name if user and user.full_name else user.username if user else "Inconnu"
        })
    
    return result

