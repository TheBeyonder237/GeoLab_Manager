"""
Configuration du logging structuré
"""
import logging
import sys
import os
from datetime import datetime
from typing import Any, Dict
import json


class JSONFormatter(logging.Formatter):
    """Formateur JSON pour les logs structurés"""
    
    def format(self, record: logging.LogRecord) -> str:
        log_data: Dict[str, Any] = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # Ajouter les données supplémentaires
        if hasattr(record, "user_id"):
            log_data["user_id"] = record.user_id
        if hasattr(record, "essai_id"):
            log_data["essai_id"] = record.essai_id
        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id
        
        # Ajouter l'exception si présente
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        return json.dumps(log_data)


def setup_logging():
    """Configure le système de logging"""
    # Créer le logger principal
    logger = logging.getLogger("geolab")
    logger.setLevel(logging.INFO)
    
    # Handler pour la console
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    
    # Utiliser le formateur JSON en production, simple en développement
    if os.getenv("ENVIRONMENT") == "production":
        formatter = JSONFormatter()
    else:
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
    
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # Handler pour les fichiers (optionnel)
    # file_handler = logging.FileHandler('geolab.log')
    # file_handler.setLevel(logging.ERROR)
    # file_handler.setFormatter(formatter)
    # logger.addHandler(file_handler)
    
    return logger


# Logger global
logger = setup_logging()

