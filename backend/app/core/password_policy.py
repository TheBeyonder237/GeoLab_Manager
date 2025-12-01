"""
Politique de mot de passe pour sécurité renforcée
"""
import re
from typing import Tuple, List


class PasswordPolicy:
    """Politique de mot de passe enterprise-grade"""
    
    MIN_LENGTH = 8
    MAX_LENGTH = 128
    REQUIRE_UPPERCASE = True
    REQUIRE_LOWERCASE = True
    REQUIRE_DIGITS = True
    REQUIRE_SPECIAL = True
    SPECIAL_CHARS = "!@#$%^&*()_+-=[]{}|;:,.<>?"
    FORBIDDEN_PATTERNS = [
        r"(.)\1{2,}",  # Pas de 3 caractères identiques consécutifs
        r"(012|123|234|345|456|567|678|789|890)",  # Pas de séquences numériques
        r"(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)",  # Pas de séquences alphabétiques
    ]
    
    @classmethod
    def validate(cls, password: str) -> Tuple[bool, List[str]]:
        """
        Valide un mot de passe selon la politique
        
        Returns:
            (is_valid, list_of_errors)
        """
        errors = []
        
        # Longueur
        if len(password) < cls.MIN_LENGTH:
            errors.append(f"Le mot de passe doit contenir au moins {cls.MIN_LENGTH} caractères")
        
        if len(password) > cls.MAX_LENGTH:
            errors.append(f"Le mot de passe ne doit pas dépasser {cls.MAX_LENGTH} caractères")
        
        # Majuscules
        if cls.REQUIRE_UPPERCASE and not re.search(r"[A-Z]", password):
            errors.append("Le mot de passe doit contenir au moins une majuscule")
        
        # Minuscules
        if cls.REQUIRE_LOWERCASE and not re.search(r"[a-z]", password):
            errors.append("Le mot de passe doit contenir au moins une minuscule")
        
        # Chiffres
        if cls.REQUIRE_DIGITS and not re.search(r"\d", password):
            errors.append("Le mot de passe doit contenir au moins un chiffre")
        
        # Caractères spéciaux
        if cls.REQUIRE_SPECIAL:
            special_pattern = "[" + re.escape(cls.SPECIAL_CHARS) + "]"
            if not re.search(special_pattern, password):
                errors.append(f"Le mot de passe doit contenir au moins un caractère spécial ({cls.SPECIAL_CHARS})")
        
        # Patterns interdits
        for pattern in cls.FORBIDDEN_PATTERNS:
            if re.search(pattern, password, re.IGNORECASE):
                errors.append("Le mot de passe contient des séquences interdites (ex: 123, aaa)")
        
        return len(errors) == 0, errors
    
    @classmethod
    def get_requirements(cls) -> str:
        """Retourne une description des exigences"""
        requirements = [f"Entre {cls.MIN_LENGTH} et {cls.MAX_LENGTH} caractères"]
        
        if cls.REQUIRE_UPPERCASE:
            requirements.append("Au moins une majuscule")
        if cls.REQUIRE_LOWERCASE:
            requirements.append("Au moins une minuscule")
        if cls.REQUIRE_DIGITS:
            requirements.append("Au moins un chiffre")
        if cls.REQUIRE_SPECIAL:
            requirements.append(f"Au moins un caractère spécial ({cls.SPECIAL_CHARS})")
        
        requirements.append("Pas de séquences répétitives ou prévisibles")
        
        return "; ".join(requirements)

