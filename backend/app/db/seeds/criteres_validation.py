"""
Données initiales pour les critères de validation
"""
from app.models.workflow import CritereValidation, NiveauValidation

CRITERES_VALIDATION = [
    # Critères pour les essais Atterberg
    {
        "type_essai": "atterberg",
        "niveau_validation": NiveauValidation.TECHNICIEN,
        "criteres": [
            "Vérifier que les points de mesure WL sont bien répartis",
            "Vérifier que les teneurs en eau sont cohérentes",
            "Vérifier que les nombres de coups sont dans la plage 15-35",
            "S'assurer que la température est entre 18°C et 22°C"
        ]
    },
    {
        "type_essai": "atterberg",
        "niveau_validation": NiveauValidation.CHEF_LABO,
        "criteres": [
            "Vérifier la cohérence des résultats avec le type de sol",
            "Vérifier la qualité de la droite de coulabilité",
            "Valider la classification du sol",
            "Vérifier la conformité avec la norme NF P94-051"
        ]
    },

    # Critères pour les essais Proctor
    {
        "type_essai": "proctor",
        "niveau_validation": NiveauValidation.TECHNICIEN,
        "criteres": [
            "Vérifier que les points encadrent bien l'optimum",
            "Vérifier la cohérence des densités sèches",
            "S'assurer que les teneurs en eau sont bien réparties",
            "Vérifier le nombre de couches et de coups"
        ]
    },
    {
        "type_essai": "proctor",
        "niveau_validation": NiveauValidation.CHEF_LABO,
        "criteres": [
            "Valider la courbe Proctor",
            "Vérifier la cohérence de l'OPM",
            "Vérifier la conformité avec la norme NF P94-093",
            "Valider les calculs de densité"
        ]
    },

    # Critères pour les essais CBR
    {
        "type_essai": "cbr",
        "niveau_validation": NiveauValidation.TECHNICIEN,
        "criteres": [
            "Vérifier les conditions de préparation",
            "Vérifier la conformité du compactage",
            "S'assurer de la bonne mesure des forces",
            "Vérifier le temps d'immersion"
        ]
    },
    {
        "type_essai": "cbr",
        "niveau_validation": NiveauValidation.CHEF_LABO,
        "criteres": [
            "Valider la courbe force/pénétration",
            "Vérifier la cohérence du CBR avec le type de sol",
            "Vérifier la conformité avec la norme NF P94-078",
            "Valider les mesures de gonflement"
        ]
    },

    # Critères pour les essais Granulométrie
    {
        "type_essai": "granulometrie",
        "niveau_validation": NiveauValidation.TECHNICIEN,
        "criteres": [
            "Vérifier la propreté des tamis utilisés",
            "S'assurer de la bonne pesée des refus",
            "Vérifier la cohérence des passants cumulés",
            "Vérifier le temps de tamisage"
        ]
    },
    {
        "type_essai": "granulometrie",
        "niveau_validation": NiveauValidation.CHEF_LABO,
        "criteres": [
            "Valider la courbe granulométrique",
            "Vérifier la cohérence des coefficients",
            "Vérifier la conformité avec la norme NF P94-056",
            "Valider la classification granulométrique"
        ]
    },

    # Critères généraux pour les ingénieurs
    {
        "type_essai": "atterberg",
        "niveau_validation": NiveauValidation.INGENIEUR,
        "criteres": [
            "Valider la cohérence avec les autres essais",
            "Vérifier l'impact sur le projet",
            "Valider les conclusions techniques"
        ]
    },
    {
        "type_essai": "proctor",
        "niveau_validation": NiveauValidation.INGENIEUR,
        "criteres": [
            "Valider les spécifications techniques",
            "Vérifier la pertinence pour le projet",
            "Valider les recommandations de mise en œuvre"
        ]
    },
    {
        "type_essai": "cbr",
        "niveau_validation": NiveauValidation.INGENIEUR,
        "criteres": [
            "Valider la classe de portance",
            "Vérifier l'adéquation avec le projet",
            "Valider les recommandations techniques"
        ]
    },
    {
        "type_essai": "granulometrie",
        "niveau_validation": NiveauValidation.INGENIEUR,
        "criteres": [
            "Valider la classification du sol",
            "Vérifier la conformité aux spécifications",
            "Valider les recommandations d'utilisation"
        ]
    }
]

def seed_criteres_validation(db):
    """Ajoute les critères de validation initiaux dans la base de données"""
    for critere_data in CRITERES_VALIDATION:
        critere = CritereValidation(**critere_data)
        db.add(critere)
    db.commit()
