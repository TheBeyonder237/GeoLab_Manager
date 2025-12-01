from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    essais,
    users,
    rapports,
    statistiques,
    export,
    history,
    templates,
    metrics,
    projets,
    qualite,
    echantillons,
    notifications,
    external,
    workflow
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentification"])
api_router.include_router(users.router, prefix="/users", tags=["utilisateurs"])
api_router.include_router(projets.router, prefix="/projets", tags=["projets"])
api_router.include_router(essais.router, prefix="/essais", tags=["essais"])
api_router.include_router(rapports.router, prefix="/rapports", tags=["rapports"])
api_router.include_router(statistiques.router, prefix="/statistiques", tags=["statistiques"])
api_router.include_router(export.router, prefix="/export", tags=["export"])
api_router.include_router(history.router, prefix="", tags=["historique"])
api_router.include_router(templates.router, prefix="/templates", tags=["templates"])
api_router.include_router(metrics.router, prefix="", tags=["metrics"])
api_router.include_router(qualite.router, prefix="/qualite", tags=["qualite"])
api_router.include_router(echantillons.router, prefix="/echantillons", tags=["echantillons"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(external.router, prefix="/external", tags=["external"])
api_router.include_router(workflow.router, prefix="/workflow", tags=["workflow"])