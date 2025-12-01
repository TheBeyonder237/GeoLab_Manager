"""
Rate limiting middleware pour protection DDoS
"""
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from typing import Dict, Tuple
from datetime import datetime, timedelta
import time


class RateLimiter:
    """Rate limiter simple en mémoire (pour production, utiliser Redis)"""
    
    def __init__(self):
        self.requests: Dict[str, list] = {}
        self.cleanup_interval = timedelta(minutes=5)
        self.last_cleanup = datetime.now()
    
    def _cleanup_old_entries(self):
        """Nettoie les entrées anciennes"""
        if datetime.now() - self.last_cleanup < self.cleanup_interval:
            return
        
        current_time = time.time()
        for key in list(self.requests.keys()):
            self.requests[key] = [
                req_time for req_time in self.requests[key]
                if current_time - req_time < 60  # Garder seulement les 60 dernières secondes
            ]
            if not self.requests[key]:
                del self.requests[key]
        
        self.last_cleanup = datetime.now()
    
    def _get_client_identifier(self, request: Request) -> str:
        """Identifie le client (IP ou user ID)"""
        # En production, utiliser l'IP réelle (derrière proxy)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return f"ip_{forwarded_for.split(',')[0].strip()}"
        return f"ip_{request.client.host if request.client else 'unknown'}"
    
    def is_allowed(
        self, 
        identifier: str, 
        max_requests: int = 100, 
        window_seconds: int = 60
    ) -> Tuple[bool, int, int]:
        """
        Vérifie si la requête est autorisée
        
        Returns:
            (is_allowed, remaining, reset_time)
        """
        self._cleanup_old_entries()
        
        current_time = time.time()
        cutoff_time = current_time - window_seconds
        
        # Filtrer les requêtes dans la fenêtre
        if identifier not in self.requests:
            self.requests[identifier] = []
        
        self.requests[identifier] = [
            req_time for req_time in self.requests[identifier]
            if req_time > cutoff_time
        ]
        
        # Compter les requêtes
        request_count = len(self.requests[identifier])
        
        if request_count >= max_requests:
            return False, 0, int(cutoff_time + window_seconds)
        
        # Ajouter la requête actuelle
        self.requests[identifier].append(current_time)
        
        remaining = max_requests - request_count - 1
        reset_time = int(current_time + window_seconds)
        
        return True, remaining, reset_time


# Instance globale
rate_limiter = RateLimiter()


async def rate_limit_middleware(request: Request, call_next):
    """
    Middleware de rate limiting
    
    Limites par défaut:
    - 100 requêtes/minute pour les endpoints généraux
    - 10 requêtes/minute pour l'authentification
    - 20 requêtes/minute pour les exports
    """
    # Ignorer les health checks
    if request.url.path in ["/health", "/", "/docs", "/redoc", "/openapi.json"]:
        return await call_next(request)
    
    identifier = rate_limiter._get_client_identifier(request)
    
    # Limites différentes selon le type d'endpoint
    if request.url.path.startswith("/api/v1/auth"):
        max_requests = 100
        window = 60
    elif request.url.path.startswith("/api/v1/export"):
        max_requests = 200
        window = 60
    else:
        max_requests = 1000
        window = 60
    
    is_allowed, remaining, reset_time = rate_limiter.is_allowed(
        identifier, max_requests, window
    )
    
    if not is_allowed:
        response = Response(
            content='{"detail": "Rate limit exceeded. Please try again later."}',
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            media_type="application/json"
        )
        response.headers["X-RateLimit-Limit"] = str(max_requests)
        response.headers["X-RateLimit-Remaining"] = "0"
        response.headers["X-RateLimit-Reset"] = str(reset_time)
        response.headers["Retry-After"] = str(reset_time - int(time.time()))
        return response
    
    response = await call_next(request)
    
    # Ajouter les headers de rate limit
    response.headers["X-RateLimit-Limit"] = str(max_requests)
    response.headers["X-RateLimit-Remaining"] = str(remaining)
    response.headers["X-RateLimit-Reset"] = str(reset_time)
    
    return response
