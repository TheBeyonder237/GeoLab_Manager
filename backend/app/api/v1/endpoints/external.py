"""
API externe pour l'intégration avec d'autres systèmes
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.core.security import verify_api_key
from app.models.essai import Essai, TypeEssai
from app.schemas.essai import EssaiExport, EssaiImport
from app.schemas.external import (
    ExternalResponse,
    ExternalError,
    DataExport,
    DataSync
)

router = APIRouter()

@router.get("/essais/", response_model=List[EssaiExport])
async def list_essais(
    type_essai: Optional[TypeEssai] = None,
    date_debut: Optional[str] = None,
    date_fin: Optional[str] = None,
    projet_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    api_key: str = Depends(verify_api_key)
):
    """Liste les essais pour l'intégration externe"""
    query = db.query(Essai)
    
    if type_essai:
        query = query.filter(Essai.type_essai == type_essai)
    if date_debut:
        query = query.filter(Essai.date_essai >= datetime.strptime(date_debut, "%Y-%m-%d"))
    if date_fin:
        query = query.filter(Essai.date_essai <= datetime.strptime(date_fin, "%Y-%m-%d"))
    if projet_id:
        query = query.filter(Essai.projet_id == projet_id)
    
    essais = query.offset(skip).limit(limit).all()
    return essais

@router.post("/essais/import", response_model=ExternalResponse)
async def import_essais(
    essais: List[EssaiImport],
    db: Session = Depends(get_db),
    api_key: str = Depends(verify_api_key)
):
    """Importe des essais depuis un système externe"""
    try:
        imported = []
        errors = []
        
        for essai_data in essais:
            try:
                # Vérifier si l'essai existe déjà
                existing = db.query(Essai).filter(
                    Essai.numero_essai == essai_data.numero_essai
                ).first()
                
                if existing:
                    errors.append(ExternalError(
                        item_id=essai_data.numero_essai,
                        error="Essai déjà existant"
                    ))
                    continue
                
                # Créer le nouvel essai
                essai = Essai(**essai_data.dict())
                db.add(essai)
                db.flush()
                
                # Ajouter les données spécifiques selon le type d'essai
                if essai_data.donnees_specifiques:
                    if essai.type_essai == TypeEssai.ATTERBERG:
                        essai.atterberg = EssaiAtterberg(**essai_data.donnees_specifiques)
                    elif essai.type_essai == TypeEssai.PROCTOR:
                        essai.proctor = EssaiProctor(**essai_data.donnees_specifiques)
                    elif essai.type_essai == TypeEssai.CBR:
                        essai.cbr = EssaiCBR(**essai_data.donnees_specifiques)
                    elif essai.type_essai == TypeEssai.GRANULOMETRIE:
                        essai.granulometrie = EssaiGranulometrie(**essai_data.donnees_specifiques)
                
                imported.append(essai.numero_essai)
                
            except Exception as e:
                errors.append(ExternalError(
                    item_id=essai_data.numero_essai,
                    error=str(e)
                ))
        
        db.commit()
        
        return ExternalResponse(
            success=True,
            imported_count=len(imported),
            imported_items=imported,
            errors=errors
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/export", response_model=DataExport)
async def export_data(
    type_essai: Optional[TypeEssai] = None,
    date_debut: Optional[str] = None,
    date_fin: Optional[str] = None,
    format: str = Query("json", regex="^(json|xml|csv)$"),
    db: Session = Depends(get_db),
    api_key: str = Depends(verify_api_key)
):
    """Exporte les données au format demandé"""
    query = db.query(Essai)
    
    if type_essai:
        query = query.filter(Essai.type_essai == type_essai)
    if date_debut:
        query = query.filter(Essai.date_essai >= datetime.strptime(date_debut, "%Y-%m-%d"))
    if date_fin:
        query = query.filter(Essai.date_essai <= datetime.strptime(date_fin, "%Y-%m-%d"))
    
    essais = query.all()
    
    # Convertir les données au format demandé
    if format == "json":
        data = [essai.to_dict() for essai in essais]
    elif format == "xml":
        data = convert_to_xml([essai.to_dict() for essai in essais])
    else:  # csv
        data = convert_to_csv([essai.to_dict() for essai in essais])
    
    return DataExport(
        format=format,
        data=data,
        count=len(essais),
        generated_at=datetime.now()
    )

@router.post("/sync", response_model=DataSync)
async def sync_data(
    last_sync: datetime,
    db: Session = Depends(get_db),
    api_key: str = Depends(verify_api_key)
):
    """Synchronise les données modifiées depuis la dernière synchronisation"""
    # Récupérer les essais modifiés
    modified_essais = db.query(Essai).filter(
        Essai.updated_at >= last_sync
    ).all()
    
    # Récupérer les essais supprimés (à implémenter avec soft delete)
    deleted_essais = []
    
    return DataSync(
        last_sync=last_sync,
        current_sync=datetime.now(),
        modified_count=len(modified_essais),
        deleted_count=len(deleted_essais),
        modified_items=[essai.to_dict() for essai in modified_essais],
        deleted_items=[essai.numero_essai for essai in deleted_essais]
    )
