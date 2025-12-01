"""Utilitaire pour la génération de QR codes.

Pour éviter d'ajouter une dépendance obligatoire, ce module essaie d'utiliser
la librairie `qrcode` si elle est installée. Sinon, il renvoie simplement
la donnée brute, ce qui permet à l'API de fonctionner sans erreur.
"""
from typing import Optional
import base64
import io

try:
    import qrcode  # type: ignore
except ImportError:  # pragma: no cover
    qrcode = None


def generate_qr_code(data: str) -> str:
    """Génère un QR code pour la donnée fournie.

    Si la librairie `qrcode` est disponible, renvoie une data URL PNG en base64.
    Sinon, renvoie simplement la chaîne d'entrée (fallback sans QR image).
    """
    if not data:
        return ""

    # Si la lib qrcode n'est pas installée, on renvoie simplement la donnée
    if qrcode is None:
        return data

    # Génération d'une image PNG encodée en base64
    img = qrcode.make(data)
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{encoded}"
