"""
Routes pour la gestion des essais géotechniques
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.models.essai import Essai, TypeEssai, StatutEssai
from app.models.user import User
from app.schemas.essai import (
    Essai as EssaiSchema,
    EssaiCreate,
    EssaiUpdate,
    EssaiAtterberg,
    EssaiAtterbergCreate,
    EssaiAtterbergUpdate,
    EssaiCBR,
    EssaiCBRCreate,
    EssaiCBRUpdate,
    EssaiProctor,
    EssaiProctorCreate,
    EssaiProctorUpdate,
    EssaiGranulometrie,
    EssaiGranulometrieCreate,
    EssaiGranulometrieUpdate
)
from app.services.calculs import (
    calculer_atterberg,
    calculer_cbr,
    calculer_proctor,
    calculer_granulometrie
)
from app.services.validation import validate_essai
from app.api.v1.endpoints.history import create_history_entry

router = APIRouter()


@router.get("/", response_model=List[EssaiSchema])
async def list_essais(
    skip: int = 0,
    limit: int = 100,
    type_essai: Optional[TypeEssai] = None,
    statut: Optional[StatutEssai] = None,
    search: Optional[str] = Query(None, description="Recherche par numéro, projet ou échantillon"),
    operateur_id: Optional[int] = Query(None, description="Filtrer par opérateur"),
    projet_id: Optional[int] = Query(None, description="Filtrer par projet"),
    date_debut: Optional[str] = Query(None, description="Date de début (format: YYYY-MM-DD)"),
    date_fin: Optional[str] = Query(None, description="Date de fin (format: YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Liste tous les essais avec filtres optionnels avancés"""
    from datetime import datetime
    
    query = db.query(Essai)
    
    if type_essai:
        query = query.filter(Essai.type_essai == type_essai)
    
    if statut:
        query = query.filter(Essai.statut == statut)
    
    if operateur_id:
        query = query.filter(Essai.operateur_id == operateur_id)
    
    if projet_id:
        query = query.filter(Essai.projet_id == projet_id)
    
    if date_debut:
        try:
            date_debut_obj = datetime.strptime(date_debut, "%Y-%m-%d")
            query = query.filter(Essai.date_essai >= date_debut_obj)
        except ValueError:
            pass
    
    if date_fin:
        try:
            date_fin_obj = datetime.strptime(date_fin, "%Y-%m-%d")
            query = query.filter(Essai.date_essai <= date_fin_obj)
        except ValueError:
            pass
    
    if search:
        from app.models.projet import Projet
        # Utiliser distinct() pour éviter les doublons lors du join
        query = query.outerjoin(Projet, Essai.projet_id == Projet.id).filter(
            or_(
                Essai.numero_essai.ilike(f"%{search}%"),
                Essai.projet_nom.ilike(f"%{search}%"),
                Projet.nom.ilike(f"%{search}%"),
                Projet.code_projet.ilike(f"%{search}%"),
                Essai.echantillon.ilike(f"%{search}%"),
                Essai.observations.ilike(f"%{search}%")
            )
        ).distinct()
    
    essais = query.order_by(Essai.created_at.desc()).offset(skip).limit(limit).all()
    return essais


@router.get("/{essai_id}", response_model=EssaiSchema)
async def get_essai(
    essai_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Récupère un essai par ID"""
    essai = db.query(Essai).filter(Essai.id == essai_id).first()
    if not essai:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Essai non trouvé"
        )
    
    # S'assurer que projet_nom est défini
    if not essai.projet_nom and essai.projet_id:
        from app.models.projet import Projet
        projet = db.query(Projet).filter(Projet.id == essai.projet_id).first()
        if projet:
            essai.projet_nom = projet.nom
    
    return essai


@router.post("/", response_model=EssaiSchema, status_code=status.HTTP_201_CREATED)
async def create_essai(
    essai_data: EssaiCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Crée un nouvel essai"""
    # Vérifier si le numéro d'essai existe déjà
    existing = db.query(Essai).filter(Essai.numero_essai == essai_data.numero_essai).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ce numéro d'essai existe déjà"
        )
    
    # Gérer projet_id si fourni (depuis query param ou body)
    essai_dict = essai_data.dict()
    projet_id = essai_dict.pop('projet_id', None)
    # Retirer le champ 'projet' (chaîne) car c'est une relationship, pas une colonne
    essai_dict.pop('projet', None)
    
    # Si projet_id est fourni, récupérer le nom du projet
    projet_nom = None
    if projet_id:
        from app.models.projet import Projet
        projet = db.query(Projet).filter(Projet.id == projet_id).first()
        if projet:
            projet_nom = projet.nom
        else:
            # Si le projet n'existe pas, on ignore projet_id
            projet_id = None
    
    essai = Essai(
        **essai_dict,
        operateur_id=current_user.id,
        projet_id=projet_id,
        projet_nom=projet_nom
    )
    
    db.add(essai)
    db.commit()
    db.refresh(essai)
    
    # S'assurer que projet_nom est défini pour la réponse
    if not essai.projet_nom and essai.projet_id:
        from app.models.projet import Projet
        projet = db.query(Projet).filter(Projet.id == essai.projet_id).first()
        if projet:
            essai.projet_nom = projet.nom
            db.commit()
            db.refresh(essai)
    
    # Créer entrée d'historique
    create_history_entry(
        db=db,
        essai_id=essai.id,
        user_id=current_user.id,
        action="create",
        comment=f"Essai créé: {essai.numero_essai}"
    )
    
    return essai


@router.patch("/{essai_id}/statut", response_model=EssaiSchema)
async def update_essai_statut(
    essai_id: int,
    nouveau_statut: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Change le statut d'un essai avec contrôle des permissions"""
    essai = db.query(Essai).filter(Essai.id == essai_id).first()
    if not essai:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Essai non trouvé"
        )
    
    # Valider le statut
    try:
        statut_enum = StatutEssai(nouveau_statut)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Statut invalide: {nouveau_statut}"
        )
    
    # Contrôle des permissions selon le rôle
    # Seuls les admins, chefs de lab et ingénieurs peuvent valider
    if statut_enum == StatutEssai.VALIDE:
        if current_user.role not in ['admin', 'chef_lab', 'ingenieur']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Seuls les administrateurs, chefs de laboratoire et ingénieurs peuvent valider un essai"
            )
    
    # Vérifier que l'essai a des résultats avant de le valider
    if statut_enum == StatutEssai.VALIDE and not essai.resultats:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Impossible de valider un essai sans résultats calculés"
        )
    
    old_statut = essai.statut.value if essai.statut else None
    essai.statut = statut_enum
    db.commit()
    db.refresh(essai)
    
    # Créer entrée d'historique
    create_history_entry(
        db=db,
        essai_id=essai.id,
        user_id=current_user.id,
        action="status_change",
        field_name="statut",
        old_value=old_statut,
        new_value=statut_enum.value,
        comment=f"Statut changé de {old_statut} à {statut_enum.value}"
    )
    
    return essai


@router.put("/{essai_id}", response_model=EssaiSchema)
async def update_essai(
    essai_id: int,
    essai_update: EssaiUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Met à jour un essai"""
    essai = db.query(Essai).filter(Essai.id == essai_id).first()
    if not essai:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Essai non trouvé"
        )
    
    # Vérifier les permissions (seul l'opérateur ou admin peut modifier)
    from app.models.user import UserRole
    if essai.operateur_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'êtes pas autorisé à modifier cet essai"
        )
    
    # Tracker les changements
    changes = {}
    update_data = essai_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        old_value = getattr(essai, field, None)
        if old_value != value:
            changes[field] = {"old": str(old_value) if old_value is not None else None, "new": str(value) if value is not None else None}
            setattr(essai, field, value)
    
    db.commit()
    db.refresh(essai)
    
    # Créer entrée d'historique si des changements ont été faits
    if changes:
        create_history_entry(
            db=db,
            essai_id=essai.id,
            user_id=current_user.id,
            action="update",
            changes=changes,
            comment=f"Essai modifié: {', '.join(changes.keys())}"
        )
    
    return essai


@router.delete("/{essai_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_essai(
    essai_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Supprime un essai"""
    essai = db.query(Essai).filter(Essai.id == essai_id).first()
    if not essai:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Essai non trouvé"
        )
    
    # Vérifier les permissions
    from app.models.user import UserRole
    if essai.operateur_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'êtes pas autorisé à supprimer cet essai"
        )
    
    # Créer entrée d'historique avant suppression
    create_history_entry(
        db=db,
        essai_id=essai.id,
        user_id=current_user.id,
        action="delete",
        comment=f"Essai {essai.numero_essai} supprimé"
    )
    
    db.delete(essai)
    db.commit()
    return None


# Routes spécifiques pour Atterberg
@router.get("/atterberg/", response_model=List[EssaiAtterberg])
async def get_all_atterberg(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Récupère tous les essais Atterberg"""
    from app.models.essai import EssaiAtterberg as EssaiAtterbergModel
    atterbergs = db.query(EssaiAtterbergModel).all()
    return atterbergs


@router.post("/atterberg/", response_model=EssaiAtterberg, status_code=status.HTTP_201_CREATED)
async def create_atterberg(
    atterberg_data: EssaiAtterbergCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Crée un essai Atterberg"""
    from app.models.essai import EssaiAtterberg as EssaiAtterbergModel
    
    # Vérifier que l'essai existe
    essai = db.query(Essai).filter(Essai.id == atterberg_data.essai_id).first()
    if not essai:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Essai non trouvé"
        )
    
    atterberg = EssaiAtterbergModel(**atterberg_data.dict())
    
    # Valider les données
    validation = validate_essai("atterberg", atterberg)
    if not validation["valid"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erreurs de validation: {', '.join(validation['errors'])}"
        )
    
    # Calculer les résultats
    resultats = calculer_atterberg(atterberg)
    for key, value in resultats.items():
        setattr(atterberg, key, value)
    
    # Ajouter les warnings de validation aux résultats
    if validation["warnings"]:
        resultats["_validation_warnings"] = validation["warnings"]
    
    db.add(atterberg)
    db.commit()
    db.refresh(atterberg)
    
    # Mettre à jour les résultats de l'essai
    essai.resultats = resultats
    db.commit()
    
    # Créer entrée d'historique
    create_history_entry(
        db=db,
        essai_id=essai.id,
        user_id=current_user.id,
        action="update",
        comment=f"Données Atterberg ajoutées pour l'essai {essai.numero_essai}"
    )
    
    return atterberg


@router.put("/atterberg/{atterberg_id}", response_model=EssaiAtterberg)
async def update_atterberg(
    atterberg_id: int,
    atterberg_update: EssaiAtterbergUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Met à jour un essai Atterberg"""
    from app.models.essai import EssaiAtterberg as EssaiAtterbergModel
    
    atterberg = db.query(EssaiAtterbergModel).filter(EssaiAtterbergModel.id == atterberg_id).first()
    if not atterberg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Essai Atterberg non trouvé"
        )
    
    update_data = atterberg_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(atterberg, field, value)
    
    # Recalculer les résultats
    resultats = calculer_atterberg(atterberg)
    for key, value in resultats.items():
        setattr(atterberg, key, value)
    
    db.commit()
    db.refresh(atterberg)
    
    # Mettre à jour les résultats de l'essai
    essai = db.query(Essai).filter(Essai.id == atterberg.essai_id).first()
    if essai:
        essai.resultats = resultats
        db.commit()
    
    return atterberg


# Routes similaires pour CBR, Proctor, Granulométrie (structure similaire)
# Pour économiser de l'espace, je vais créer des routes simplifiées

@router.get("/cbr/", response_model=List[EssaiCBR])
async def get_all_cbr(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Récupère tous les essais CBR"""
    from app.models.essai import EssaiCBR as EssaiCBRModel
    cbrs = db.query(EssaiCBRModel).all()
    return cbrs


@router.post("/cbr/", response_model=EssaiCBR, status_code=status.HTTP_201_CREATED)
async def create_cbr(
    cbr_data: EssaiCBRCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Crée un essai CBR"""
    from app.models.essai import EssaiCBR as EssaiCBRModel
    
    essai = db.query(Essai).filter(Essai.id == cbr_data.essai_id).first()
    if not essai:
        raise HTTPException(status_code=404, detail="Essai non trouvé")
    
    cbr = EssaiCBRModel(**cbr_data.dict())
    
    # Valider les données
    validation = validate_essai("cbr", cbr)
    if not validation["valid"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erreurs de validation: {', '.join(validation['errors'])}"
        )
    
    resultats = calculer_cbr(cbr)
    for key, value in resultats.items():
        setattr(cbr, key, value)
    
    # Ajouter les warnings de validation aux résultats
    if validation["warnings"]:
        resultats["_validation_warnings"] = validation["warnings"]
    
    db.add(cbr)
    essai.resultats = resultats
    db.commit()
    db.refresh(cbr)
    
    # Créer entrée d'historique
    create_history_entry(
        db=db,
        essai_id=essai.id,
        user_id=current_user.id,
        action="update",
        comment=f"Données CBR ajoutées pour l'essai {essai.numero_essai}"
    )
    
    return cbr


@router.get("/proctor/", response_model=List[EssaiProctor])
async def get_all_proctor(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Récupère tous les essais Proctor"""
    from app.models.essai import EssaiProctor as EssaiProctorModel
    proctors = db.query(EssaiProctorModel).all()
    return proctors


@router.post("/proctor/", response_model=EssaiProctor, status_code=status.HTTP_201_CREATED)
async def create_proctor(
    proctor_data: EssaiProctorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Crée un essai Proctor"""
    from app.models.essai import EssaiProctor as EssaiProctorModel
    
    essai = db.query(Essai).filter(Essai.id == proctor_data.essai_id).first()
    if not essai:
        raise HTTPException(status_code=404, detail="Essai non trouvé")
    
    # Convertir les points en JSON
    points_dict = [p.dict() if hasattr(p, 'dict') else p for p in proctor_data.points_mesure or []]
    
    proctor = EssaiProctorModel(
        essai_id=proctor_data.essai_id,
        type_proctor=proctor_data.type_proctor,
        points_mesure=points_dict
    )
    
    # Valider les données
    validation = validate_essai("proctor", proctor)
    if not validation["valid"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erreurs de validation: {', '.join(validation['errors'])}"
        )
    
    resultats = calculer_proctor(proctor)
    for key, value in resultats.items():
        setattr(proctor, key, value)
    
    # Ajouter les warnings de validation aux résultats
    if validation["warnings"]:
        resultats["_validation_warnings"] = validation["warnings"]
    
    db.add(proctor)
    essai.resultats = resultats
    db.commit()
    db.refresh(proctor)
    
    # Créer entrée d'historique
    create_history_entry(
        db=db,
        essai_id=essai.id,
        user_id=current_user.id,
        action="update",
        comment=f"Données Proctor ajoutées pour l'essai {essai.numero_essai}"
    )
    
    return proctor


@router.get("/granulometrie/", response_model=List[EssaiGranulometrie])
async def get_all_granulometrie(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Récupère tous les essais de granulométrie"""
    from app.models.essai import EssaiGranulometrie as EssaiGranulometrieModel
    granulometries = db.query(EssaiGranulometrieModel).all()
    return granulometries


@router.post("/granulometrie/", response_model=EssaiGranulometrie, status_code=status.HTTP_201_CREATED)
async def create_granulometrie(
    granulometrie_data: EssaiGranulometrieCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Crée un essai de granulométrie"""
    from app.models.essai import EssaiGranulometrie as EssaiGranulometrieModel
    
    essai = db.query(Essai).filter(Essai.id == granulometrie_data.essai_id).first()
    if not essai:
        raise HTTPException(status_code=404, detail="Essai non trouvé")
    
    # Convertir les points en JSON
    points_dict = [p.dict() if hasattr(p, 'dict') else p for p in granulometrie_data.points_tamisage or []]
    
    granulometrie = EssaiGranulometrieModel(
        essai_id=granulometrie_data.essai_id,
        points_tamisage=points_dict
    )
    
    # Valider les données
    validation = validate_essai("granulometrie", granulometrie)
    if not validation["valid"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erreurs de validation: {', '.join(validation['errors'])}"
        )
    
    resultats = calculer_granulometrie(granulometrie)
    for key, value in resultats.items():
        setattr(granulometrie, key, value)
    
    # Ajouter les warnings de validation aux résultats
    if validation["warnings"]:
        resultats["_validation_warnings"] = validation["warnings"]
    
    db.add(granulometrie)
    essai.resultats = resultats
    db.commit()
    db.refresh(granulometrie)
    
    # Créer entrée d'historique
    create_history_entry(
        db=db,
        essai_id=essai.id,
        user_id=current_user.id,
        action="update",
        comment=f"Données Granulométrie ajoutées pour l'essai {essai.numero_essai}"
    )
    
    return granulometrie

