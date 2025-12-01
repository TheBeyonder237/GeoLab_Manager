"""
Routes pour la gestion du workflow de validation
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import datetime
from typing import List, Optional
from app.core.database import get_db
from app.core.deps import get_current_active_user, get_current_active_superuser
from app.models.workflow import (
    WorkflowValidation,
    StatutValidation,
    NiveauValidation,
    CritereValidation
)
from app.models.notification import Notification, TypeNotification
from app.models.user import User, UserRole
from app.models.essai import Essai, StatutEssai
from app.schemas.workflow import (
    WorkflowCreate,
    WorkflowUpdate,
    WorkflowRead,
    CritereValidationCreate,
    CritereValidationRead
)

router = APIRouter()


def verifier_autorisation_validation(user: User, niveau: NiveauValidation) -> bool:
    """Vérifie si l'utilisateur a le droit de valider pour un niveau donné"""
    mapping_roles = {
        NiveauValidation.TECHNICIEN: [UserRole.TECHNICIEN, UserRole.CHEF_LAB, UserRole.INGENIEUR, UserRole.ADMIN],
        NiveauValidation.CHEF_LABO: [UserRole.CHEF_LAB, UserRole.INGENIEUR, UserRole.ADMIN],
        NiveauValidation.INGENIEUR: [UserRole.INGENIEUR, UserRole.ADMIN],
        NiveauValidation.ADMIN: [UserRole.ADMIN]
    }
    return user.role in mapping_roles.get(niveau, [])


@router.post("/validation", response_model=WorkflowRead)
async def demarrer_workflow(
    workflow: WorkflowCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Démarre un nouveau workflow de validation"""
    # Vérifier que l'essai existe
    essai = db.query(Essai).filter(Essai.id == workflow.essai_id).first()
    if not essai:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Essai non trouvé"
        )
    
    # Vérifier qu'il n'y a pas déjà un workflow en cours
    existing_workflow = db.query(WorkflowValidation).filter(
        WorkflowValidation.essai_id == workflow.essai_id,
        WorkflowValidation.statut.in_([
            StatutValidation.EN_ATTENTE,
            StatutValidation.REVISION_DEMANDEE
        ])
    ).first()
    
    if existing_workflow:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un workflow de validation est déjà en cours pour cet essai"
        )
    
    # Créer le workflow
    workflow_db = WorkflowValidation(
        essai_id=workflow.essai_id,
        niveau_actuel=workflow.workflow_config[0],
        workflow_config=workflow.workflow_config,
        historique_validations=[],
        commentaire=workflow.commentaire
    )
    
    db.add(workflow_db)
    db.commit()
    db.refresh(workflow_db)
    
    # Créer une notification pour le prochain validateur
    notification = Notification(
        type=TypeNotification.VALIDATION_REQUISE,
        titre=f"Validation requise - Essai {essai.numero_essai}",
        message=f"Une validation de niveau {workflow.workflow_config[0]} est requise pour l'essai {essai.numero_essai}",
        lien=f"/essais/{essai.id}",
        destinataire_id=workflow.validateur_id,
        emetteur_id=current_user.id,
        essai_id=essai.id
    )
    
    db.add(notification)
    db.commit()
    
    return workflow_db


@router.put("/validation/{workflow_id}", response_model=WorkflowRead)
async def valider_etape(
    workflow_id: int,
    statut: StatutValidation,
    commentaire: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Valide ou rejette une étape du workflow"""
    workflow = db.query(WorkflowValidation).filter(WorkflowValidation.id == workflow_id).first()
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow non trouvé"
        )
    
    # Vérifier les autorisations
    if not verifier_autorisation_validation(current_user, workflow.niveau_actuel):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas les droits pour cette validation"
        )
    
    # Mettre à jour l'historique
    historique = workflow.historique_validations or []
    historique.append({
        "niveau": workflow.niveau_actuel,
        "validateur_id": current_user.id,
        "date": datetime.now().isoformat(),
        "statut": statut,
        "commentaire": commentaire
    })
    
    # Mettre à jour le workflow selon le statut
    if statut == StatutValidation.APPROUVE:
        # Passer au niveau suivant
        current_index = workflow.workflow_config.index(workflow.niveau_actuel)
        if current_index + 1 < len(workflow.workflow_config):
            # Il reste des niveaux à valider
            workflow.niveau_actuel = workflow.workflow_config[current_index + 1]
            workflow.statut = StatutValidation.EN_ATTENTE
        else:
            # Workflow terminé avec succès
            workflow.statut = StatutValidation.APPROUVE
            workflow.completed_at = datetime.now()
            
            # Mettre à jour le statut de l'essai
            essai = db.query(Essai).filter(Essai.id == workflow.essai_id).first()
            if essai:
                essai.statut = StatutEssai.VALIDE
    
    elif statut == StatutValidation.REJETE:
        workflow.statut = StatutValidation.REJETE
        workflow.completed_at = datetime.now()
        
        # Mettre à jour le statut de l'essai
        essai = db.query(Essai).filter(Essai.id == workflow.essai_id).first()
        if essai:
            essai.statut = StatutEssai.BROUILLON
    
    else:  # REVISION_DEMANDEE
        workflow.statut = StatutValidation.REVISION_DEMANDEE
    
    workflow.historique_validations = historique
    workflow.commentaire = commentaire
    
    db.commit()
    db.refresh(workflow)
    
    # Créer les notifications appropriées
    essai = db.query(Essai).filter(Essai.id == workflow.essai_id).first()
    
    if statut == StatutValidation.APPROUVE and workflow.statut == StatutValidation.EN_ATTENTE:
        # Notifier le prochain validateur
        notification = Notification(
            type=TypeNotification.VALIDATION_REQUISE,
            titre=f"Validation requise - Essai {essai.numero_essai}",
            message=f"Une validation de niveau {workflow.niveau_actuel} est requise pour l'essai {essai.numero_essai}",
            lien=f"/essais/{essai.id}",
            destinataire_id=essai.operateur_id,  # À adapter selon votre logique de routing
            emetteur_id=current_user.id,
            essai_id=essai.id
        )
        db.add(notification)
    
    elif workflow.statut in [StatutValidation.APPROUVE, StatutValidation.REJETE]:
        # Notifier le créateur de l'essai
        notification = Notification(
            type=TypeNotification.ESSAI_VALIDE if workflow.statut == StatutValidation.APPROUVE else TypeNotification.ESSAI_REJETE,
            titre=f"Essai {essai.numero_essai} - {workflow.statut.value}",
            message=f"Votre essai a été {workflow.statut.value}. {commentaire or ''}",
            lien=f"/essais/{essai.id}",
            destinataire_id=essai.operateur_id,
            emetteur_id=current_user.id,
            essai_id=essai.id
        )
        db.add(notification)
    
    db.commit()
    
    return workflow


@router.get("/validation/en-attente", response_model=List[WorkflowRead])
async def list_validations_en_attente(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Liste les validations en attente pour l'utilisateur"""
    # Déterminer les niveaux de validation autorisés pour l'utilisateur
    niveaux_autorises = []
    for niveau in NiveauValidation:
        if verifier_autorisation_validation(current_user, niveau):
            niveaux_autorises.append(niveau)
    
    workflows = db.query(WorkflowValidation).filter(
        WorkflowValidation.statut == StatutValidation.EN_ATTENTE,
        WorkflowValidation.niveau_actuel.in_(niveaux_autorises)
    ).all()
    
    return workflows


@router.get("/criteres", response_model=List[CritereValidationRead])
async def list_criteres_validation(
    type_essai: Optional[str] = None,
    niveau: Optional[NiveauValidation] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Liste les critères de validation"""
    query = db.query(CritereValidation)
    
    if type_essai:
        query = query.filter(CritereValidation.type_essai == type_essai)
    if niveau:
        query = query.filter(CritereValidation.niveau_validation == niveau)
    
    return query.all()


@router.post("/criteres", response_model=CritereValidationRead)
async def create_critere_validation(
    critere: CritereValidationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    """Crée un nouveau critère de validation"""
    db_critere = CritereValidation(**critere.dict())
    db.add(db_critere)
    db.commit()
    db.refresh(db_critere)
    return db_critere
