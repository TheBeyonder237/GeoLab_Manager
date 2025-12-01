"""
Routes pour la génération de rapports PDF
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.models.essai import Essai
from app.models.user import User
from app.utils.pdf_generator import generer_rapport_pdf

router = APIRouter()


@router.get("/{essai_id}/pdf")
async def generer_rapport(
    essai_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Génère et télécharge le rapport PDF d'un essai"""
    essai = db.query(Essai).filter(Essai.id == essai_id).first()
    if not essai:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Essai non trouvé"
        )
    
    # Charger les relations nécessaires
    if essai.type_essai.value == "atterberg":
        _ = essai.atterberg
    elif essai.type_essai.value == "cbr":
        _ = essai.cbr
    elif essai.type_essai.value == "proctor":
        _ = essai.proctor
    elif essai.type_essai.value == "granulometrie":
        _ = essai.granulometrie
    
    # Générer le PDF
    pdf_buffer = generer_rapport_pdf(essai)
    
    filename = f"rapport_{essai.numero_essai}_{essai.type_essai.value}.pdf"
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

