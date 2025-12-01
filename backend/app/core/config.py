"""
Configuration de l'application
"""
from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List
from functools import cached_property


class Settings(BaseSettings):
    """Paramètres de l'application"""
    
    # Base de données
    DATABASE_URL: str = "postgresql://geolab_user:geolab_password@localhost:5432/geolab_db"
    
    # Sécurité JWT
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS - stocké comme chaîne dans .env, converti en liste via la propriété
    # Utilise Field avec alias pour mapper CORS_ORIGINS du .env vers CORS_ORIGINS_STR
    CORS_ORIGINS_STR: str = Field(
        default="http://localhost:3000,http://localhost:5173",
        alias="CORS_ORIGINS"
    )
    
    # Application
    PROJECT_NAME: str = "GeoLab Manager"
    API_V1_STR: str = "/api/v1"
    
    @cached_property
    def CORS_ORIGINS(self) -> List[str]:
        """Parse CORS_ORIGINS depuis une chaîne séparée par des virgules"""
        origins = [origin.strip() for origin in self.CORS_ORIGINS_STR.split(',') if origin.strip()]
        return origins if origins else ["http://localhost:3000"]
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        populate_by_name = True  # Permet d'utiliser l'alias ou le nom du champ


settings = Settings()

