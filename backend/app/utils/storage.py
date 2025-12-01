"""
Utilitaire pour la gestion du stockage des fichiers
"""
import os
import shutil
from fastapi import UploadFile
from pathlib import Path
from typing import Optional

# Dossier de base pour le stockage (à adapter selon la config)
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

async def upload_file(file: UploadFile, destination: str) -> str:
    """
    Sauvegarde un fichier uploadé dans le dossier de destination.
    
    Args:
        file: Le fichier uploadé via FastAPI
        destination: Le chemin relatif dans le dossier uploads (ex: "echantillons/123/photos/")
        
    Returns:
        str: Le chemin relatif ou l'URL du fichier sauvegardé
    """
    try:
        # Créer le dossier de destination s'il n'existe pas
        target_dir = UPLOAD_DIR / destination
        target_dir.mkdir(parents=True, exist_ok=True)
        
        # Générer un nom de fichier unique ou garder l'original
        file_path = target_dir / file.filename
        
        # Sauvegarder le fichier
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Retourner le chemin relatif (pour stockage en DB)
        # Dans un vrai cas, on retournerait peut-être une URL S3 ou CDN
        return str(file_path)
        
    except Exception as e:
        # Log l'erreur ici
        print(f"Erreur lors de l'upload: {e}")
        raise e
    finally:
        await file.close()
