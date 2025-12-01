"""
Middleware de logging des requêtes
"""
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import time
import logging
from typing import Callable

logger = logging.getLogger("geolab")


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware pour logger toutes les requêtes"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        
        # Extraire les informations de la requête
        method = request.method
        path = request.url.path
        client_ip = request.client.host if request.client else "unknown"
        
        # Headers utiles
        user_agent = request.headers.get("user-agent", "unknown")
        referer = request.headers.get("referer")
        
        # User ID si authentifié
        user_id = None
        if hasattr(request.state, "user"):
            user_id = getattr(request.state.user, "id", None)
        
        # Logger la requête entrante
        logger.info(
            f"Request: {method} {path}",
            extra={
                "method": method,
                "path": path,
                "client_ip": client_ip,
                "user_agent": user_agent,
                "user_id": user_id,
                "referer": referer
            }
        )
        
        # Exécuter la requête
        try:
            response = await call_next(request)
        except Exception as e:
            # Logger l'erreur
            process_time = time.time() - start_time
            logger.error(
                f"Request failed: {method} {path}",
                extra={
                    "method": method,
                    "path": path,
                    "client_ip": client_ip,
                    "user_id": user_id,
                    "process_time_ms": round(process_time * 1000, 2),
                    "error": str(e)
                },
                exc_info=True
            )
            raise
        
        # Calculer le temps de traitement
        process_time = time.time() - start_time
        
        # Logger la réponse
        logger.info(
            f"Response: {method} {path} - {response.status_code}",
            extra={
                "method": method,
                "path": path,
                "status_code": response.status_code,
                "client_ip": client_ip,
                "user_id": user_id,
                "process_time_ms": round(process_time * 1000, 2)
            }
        )
        
        # Ajouter le temps de traitement dans les headers
        response.headers["X-Process-Time"] = f"{process_time:.4f}"
        
        return response
