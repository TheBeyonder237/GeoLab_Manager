"""
Tests pour l'authentification
"""
import pytest
from fastapi import status


def test_register_user(client, test_user_data):
    """Test d'enregistrement d'un utilisateur"""
    response = client.post("/api/v1/auth/register", json=test_user_data)
    assert response.status_code == status.HTTP_201_CREATED
    assert response.json()["username"] == test_user_data["username"]
    assert "password" not in response.json()


def test_login_user(client, test_user_data):
    """Test de connexion d'un utilisateur"""
    # Créer l'utilisateur d'abord
    client.post("/api/v1/auth/register", json=test_user_data)
    
    # Se connecter
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": test_user_data["username"],
            "password": test_user_data["password"]
        }
    )
    assert response.status_code == status.HTTP_200_OK
    assert "access_token" in response.json()


def test_login_invalid_credentials(client):
    """Test de connexion avec des identifiants invalides"""
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": "invalid",
            "password": "invalid"
        }
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

