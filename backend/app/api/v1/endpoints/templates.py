"""
Routes pour la gestion des templates d'essais
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Dict, Any

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.models.template import EssaiTemplate
from app.models.user import User

router = APIRouter()


class TemplateBase(BaseModel):
    nom: str
    description: Optional[str] = None
    type_essai: str
    donnees_generales: Optional[Dict[str, Any]] = None
    donnees_specifiques: Optional[Dict[str, Any]] = None
    est_public: bool = False


class TemplateCreate(TemplateBase):
    pass


class TemplateUpdate(BaseModel):
    nom: Optional[str] = None
    description: Optional[str] = None
    donnees_generales: Optional[Dict[str, Any]] = None
    donnees_specifiques: Optional[Dict[str, Any]] = None
    est_public: Optional[bool] = None


class Template(TemplateBase):
    id: int
    createur_id: int
    createur_nom: str
    usage_count: int
    created_at: str

    class Config:
        from_attributes = True


@router.get("/", response_model=List[Template])
async def list_templates(
    type_essai: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Liste les templates disponibles"""
    query = db.query(EssaiTemplate)
    
    # Filtrer par type si spécifié
    if type_essai:
        query = query.filter(EssaiTemplate.type_essai == type_essai)
    
    # Afficher les templates publics ou ceux créés par l'utilisateur
    query = query.filter(
        (EssaiTemplate.est_public == True) | (EssaiTemplate.createur_id == current_user.id)
    )
    
    templates = query.order_by(EssaiTemplate.usage_count.desc(), EssaiTemplate.created_at.desc()).all()
    
    result = []
    for template in templates:
        createur = db.query(User).filter(User.id == template.createur_id).first()
        result.append({
            **template.__dict__,
            "createur_nom": createur.full_name if createur and createur.full_name else createur.username if createur else "Inconnu"
        })
    
    return result


@router.post("/", response_model=Template, status_code=status.HTTP_201_CREATED)
async def create_template(
    template_data: TemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Crée un nouveau template"""
    template = EssaiTemplate(
        **template_data.dict(),
        createur_id=current_user.id
    )
    
    db.add(template)
    db.commit()
    db.refresh(template)
    
    createur = db.query(User).filter(User.id == template.createur_id).first()
    return {
        **template.__dict__,
        "createur_nom": createur.full_name if createur and createur.full_name else createur.username if createur else "Inconnu"
    }


@router.get("/{template_id}", response_model=Template)
async def get_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Récupère un template par ID"""
    template = db.query(EssaiTemplate).filter(EssaiTemplate.id == template_id).first()
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template non trouvé"
        )
    
    # Vérifier les permissions
    if not template.est_public and template.createur_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas accès à ce template"
        )
    
    createur = db.query(User).filter(User.id == template.createur_id).first()
    return {
        **template.__dict__,
        "createur_nom": createur.full_name if createur and createur.full_name else createur.username if createur else "Inconnu"
    }


@router.put("/{template_id}", response_model=Template)
async def update_template(
    template_id: int,
    template_update: TemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Met à jour un template"""
    template = db.query(EssaiTemplate).filter(EssaiTemplate.id == template_id).first()
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template non trouvé"
        )
    
    # Seul le créateur peut modifier
    if template.createur_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'êtes pas autorisé à modifier ce template"
        )
    
    for field, value in template_update.dict(exclude_unset=True).items():
        setattr(template, field, value)
    
    db.commit()
    db.refresh(template)
    
    createur = db.query(User).filter(User.id == template.createur_id).first()
    return {
        **template.__dict__,
        "createur_nom": createur.full_name if createur and createur.full_name else createur.username if createur else "Inconnu"
    }


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Supprime un template"""
    template = db.query(EssaiTemplate).filter(EssaiTemplate.id == template_id).first()
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template non trouvé"
        )
    
    # Seul le créateur peut supprimer
    if template.createur_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'êtes pas autorisé à supprimer ce template"
        )
    
    db.delete(template)
    db.commit()


@router.post("/{template_id}/use", response_model=Dict[str, Any])
async def use_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Utilise un template et incrémente le compteur d'usage"""
    template = db.query(EssaiTemplate).filter(EssaiTemplate.id == template_id).first()
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template non trouvé"
        )
    
    # Vérifier les permissions
    if not template.est_public and template.createur_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas accès à ce template"
        )
    
    # Incrémenter le compteur
    template.usage_count += 1
    db.commit()
    
    return {
        "donnees_generales": template.donnees_generales or {},
        "donnees_specifiques": template.donnees_specifiques or {}
    }

