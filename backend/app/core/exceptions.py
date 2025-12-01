"""
Gestion avancée des exceptions
"""
from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from typing import Any, Dict
import logging
import traceback

logger = logging.getLogger("geolab")


class GeoLabException(Exception):
    """Exception de base pour GeoLab"""
    def __init__(self, message: str, status_code: int = 500, details: Dict[str, Any] = None):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class ValidationException(GeoLabException):
    """Exception pour les erreurs de validation"""
    def __init__(self, message: str, errors: Dict[str, Any] = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details={"errors": errors or {}}
        )


class NotFoundException(GeoLabException):
    """Exception pour les ressources non trouvées"""
    def __init__(self, resource: str, identifier: Any = None):
        message = f"{resource} not found"
        if identifier:
            message += f" (id: {identifier})"
        super().__init__(
            message=message,
            status_code=status.HTTP_404_NOT_FOUND
        )


class UnauthorizedException(GeoLabException):
    """Exception pour les erreurs d'autorisation"""
    def __init__(self, message: str = "Unauthorized"):
        super().__init__(
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED
        )


class ForbiddenException(GeoLabException):
    """Exception pour les accès interdits"""
    def __init__(self, message: str = "Forbidden"):
        super().__init__(
            message=message,
            status_code=status.HTTP_403_FORBIDDEN
        )


class ConflictException(GeoLabException):
    """Exception pour les conflits (ex: doublon)"""
    def __init__(self, message: str, details: Dict[str, Any] = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_409_CONFLICT,
            details=details
        )


async def exception_handler(request: Request, exc: GeoLabException) -> JSONResponse:
    """Gestionnaire pour GeoLabException"""
    logger.error(
        f"GeoLabException: {exc.message}",
        extra={
            "status_code": exc.status_code,
            "details": exc.details,
            "path": request.url.path,
            "method": request.method
        }
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.message,
            "details": exc.details,
            "path": request.url.path
        }
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Gestionnaire pour HTTPException"""
    logger.warning(
        f"HTTPException: {exc.detail}",
        extra={
            "status_code": exc.status_code,
            "path": request.url.path,
            "method": request.method
        }
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "path": request.url.path
        }
    )


async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Gestionnaire pour toutes les autres exceptions"""
    error_traceback = traceback.format_exc()
    
    logger.error(
        f"Unhandled exception: {str(exc)}",
        extra={
            "exception_type": type(exc).__name__,
            "traceback": error_traceback,
            "path": request.url.path,
            "method": request.method
        },
        exc_info=True
    )
    
    # En production, ne pas exposer le traceback
    is_production = getattr(request.app.state, "environment", "development") == "production"
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal server error",
            "path": request.url.path,
            "traceback": error_traceback if not is_production else None
        }
    )
