"""
Application principale FastAPI pour GeoLab Manager
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.logging_config import setup_logging
from app.core.exceptions import (
    GeoLabException,
    exception_handler,
    http_exception_handler,
    general_exception_handler
)
from app.middleware.rate_limit import rate_limit_middleware
from app.middleware.security import security_middleware
from app.middleware.logging import LoggingMiddleware
from app.core.health import router as health_router
from app.api.v1.api import api_router
import logging

# Configuration du logging
setup_logging()
logger = logging.getLogger("geolab")

app = FastAPI(
    title="GeoLab Manager API",
    description="API pour la gestion des essais géotechniques",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Middleware de logging
app.add_middleware(LoggingMiddleware)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset", "X-Process-Time"]
)

# Middleware de rate limiting
@app.middleware("http")
async def rate_limit(request: Request, call_next):
    return await rate_limit_middleware(request, call_next)

# Middleware de sécurité
@app.middleware("http")
async def security(request: Request, call_next):
    return await security_middleware(request, call_next)

# Gestionnaires d'exceptions
app.add_exception_handler(GeoLabException, exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

# Routes de health check
app.include_router(health_router, tags=["health"])

# Inclusion des routes API
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    """Endpoint racine"""
    return {
        "message": "GeoLab Manager API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Vérification de santé de l'API"""
    return {"status": "healthy"}

