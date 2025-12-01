"""
Health checks avancés pour monitoring
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Dict, Any
from datetime import datetime
import time

from app.core.database import get_db
from app.core.config import settings

router = APIRouter()


@router.get("/health")
async def health_check() -> Dict[str, Any]:
    """
    Health check basique
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "2.0.0"
    }


@router.get("/health/ready")
async def readiness_check(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Readiness check - vérifie que l'application est prête à recevoir du trafic
    """
    checks = {
        "database": False,
        "status": "ready"
    }
    
    # Vérifier la connexion à la base de données
    try:
        db.execute(text("SELECT 1"))
        checks["database"] = True
    except Exception as e:
        checks["database"] = False
        checks["database_error"] = str(e)
        checks["status"] = "not_ready"
    
    if checks["status"] == "not_ready":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=checks
        )
    
    return checks


@router.get("/health/live")
async def liveness_check() -> Dict[str, Any]:
    """
    Liveness check - vérifie que l'application est toujours en vie
    """
    return {
        "status": "alive",
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/health/detailed")
async def detailed_health_check(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Health check détaillé avec toutes les métriques
    """
    start_time = time.time()
    
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "2.0.0",
        "checks": {}
    }
    
    # Check database
    db_start = time.time()
    try:
        result = db.execute(text("SELECT version()"))
        db_version = result.scalar()
        db_time = (time.time() - db_start) * 1000  # en ms
        
        health_status["checks"]["database"] = {
            "status": "healthy",
            "response_time_ms": round(db_time, 2),
            "version": db_version.split(",")[0] if db_version else "unknown"
        }
    except Exception as e:
        health_status["checks"]["database"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        health_status["status"] = "degraded"
    
    # Check configuration
    health_status["checks"]["configuration"] = {
        "status": "healthy",
        "environment": settings.ENVIRONMENT if hasattr(settings, "ENVIRONMENT") else "development",
        "database_configured": bool(settings.DATABASE_URL)
    }
    
    total_time = (time.time() - start_time) * 1000
    health_status["response_time_ms"] = round(total_time, 2)
    
    # Déterminer le statut global
    if health_status["status"] == "degraded":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=health_status
        )
    
    return health_status
