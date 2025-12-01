#!/bin/bash
# Script d'initialisation de la base de données

echo "Initialisation de la base de données GeoLab Manager..."

# Activer l'environnement virtuel si présent
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Exécuter les migrations Alembic
echo "Exécution des migrations..."
alembic upgrade head

# Initialiser la base de données avec les données par défaut
echo "Création des utilisateurs par défaut..."
python -m app.core.init_db

echo "✅ Initialisation terminée!"

