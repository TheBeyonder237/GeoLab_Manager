"""
Tests pour la politique de mot de passe
"""
import pytest
from app.core.password_policy import PasswordPolicy


def test_password_too_short():
    """Test: mot de passe trop court"""
    is_valid, errors = PasswordPolicy.validate("Short1!")
    assert not is_valid
    assert any("8 caractères" in error for error in errors)


def test_password_valid():
    """Test: mot de passe valide"""
    is_valid, errors = PasswordPolicy.validate("ValidPass123!")
    assert is_valid
    assert len(errors) == 0


def test_password_missing_uppercase():
    """Test: mot de passe sans majuscule"""
    is_valid, errors = PasswordPolicy.validate("validpass123!")
    assert not is_valid
    assert any("majuscule" in error.lower() for error in errors)


def test_password_missing_lowercase():
    """Test: mot de passe sans minuscule"""
    is_valid, errors = PasswordPolicy.validate("VALIDPASS123!")
    assert not is_valid
    assert any("minuscule" in error.lower() for error in errors)


def test_password_missing_digit():
    """Test: mot de passe sans chiffre"""
    is_valid, errors = PasswordPolicy.validate("ValidPass!")
    assert not is_valid
    assert any("chiffre" in error.lower() for error in errors)


def test_password_missing_special():
    """Test: mot de passe sans caractère spécial"""
    is_valid, errors = PasswordPolicy.validate("ValidPass123")
    assert not is_valid
    assert any("spécial" in error.lower() for error in errors)


def test_password_forbidden_pattern():
    """Test: mot de passe avec pattern interdit"""
    is_valid, errors = PasswordPolicy.validate("ValidPass123!")
    # Tester avec séquence répétitive
    is_valid_repeat, errors_repeat = PasswordPolicy.validate("AAAValid123!")
    assert not is_valid_repeat
    assert any("séquences" in error.lower() for error in errors_repeat)


def test_password_requirements_description():
    """Test: description des exigences"""
    requirements = PasswordPolicy.get_requirements()
    assert "8" in requirements
    assert "majuscule" in requirements.lower()
    assert "minuscule" in requirements.lower()

