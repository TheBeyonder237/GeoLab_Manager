# 🔬 GeoLab Manager

**Application web complète pour la gestion et la numérisation des essais géotechniques en laboratoire.**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=flat-square)](LICENSE)

---

## 📋 Table des matières

- [Présentation](#-présentation)
- [Fonctionnalités](#-fonctionnalités)
- [Architecture technique](#-architecture-technique)
- [Structure du projet](#-structure-du-projet)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Démarrage](#-démarrage)
- [Documentation API](#-documentation-api)
- [Types d'essais supportés](#-types-dessais-supportés)
- [Gestion des utilisateurs](#-gestion-des-utilisateurs)
- [Module Qualité](#-module-qualité)
- [Génération de rapports PDF](#-génération-de-rapports-pdf)
- [Base de données](#-base-de-données)
- [Tests](#-tests)
- [Déploiement Docker](#-déploiement-docker)
- [Contribution](#-contribution)
- [Licence](#-licence)

---

## 🎯 Présentation

**GeoLab Manager** est une plateforme moderne conçue pour remplacer les méthodes traditionnelles sur papier par une solution numérique automatisée, rapide et fiable pour la gestion des essais géotechniques.

### Objectifs principaux

- **Numérisation complète** des processus de laboratoire géotechnique
- **Calculs automatiques** selon les normes françaises (NF P94-xxx)
- **Traçabilité intégrale** des essais et modifications
- **Génération automatique** de rapports PDF professionnels
- **Gestion de la qualité** (calibrations, contrôles, non-conformités)
- **Collaboration en temps réel** entre techniciens, ingénieurs et chefs de laboratoire

---

## ✨ Fonctionnalités

### 🧪 Gestion des essais géotechniques

- **Création et suivi** des essais (Atterberg, CBR, Proctor, Granulométrie)
- **Calculs automatiques** conformes aux normes NF P94-051, NF P94-078, NF P94-093, NF P94-056
- **Workflow de validation** (Brouillon → En cours → Terminé → Validé)
- **Historique complet** des modifications avec traçabilité utilisateur

### 📊 Visualisation et analyse

- **Dashboard** avec statistiques en temps réel
- **Graphiques interactifs** (courbes Proctor, granulométriques, Atterberg, CBR)
- **Comparaison d'essais** multi-critères
- **Statistiques avancées** par type d'essai et par projet

### 📁 Gestion de projets

- **Organisation par projet** avec code unique
- **Gestion des clients** et sites
- **Affectation de responsables**
- **Archivage automatique**

### 🧬 Gestion des échantillons

- **Traçabilité complète** des échantillons
- **Informations de prélèvement** (lieu, profondeur, méthode, coordonnées GPS)
- **Suivi des quantités** et conditions de stockage
- **Historique des manipulations**

### 📄 Génération de rapports PDF

- **Rapports professionnels** conformes aux standards de laboratoire
- **En-tête personnalisé** avec informations projet/client
- **Références normatives** automatiques
- **Synthèse des résultats** + tableaux détaillés + graphiques
- **Bloc de signatures** (Rédigé / Vérifié / Approuvé)
- **Conditions d'utilisation** des résultats

### 🔔 Notifications et alertes

- **Notifications en temps réel** (WebSocket)
- **Alertes de calibration** d'équipements
- **Rappels de workflow**

### 🔐 Sécurité et authentification

- **Authentification JWT** sécurisée
- **Gestion des rôles** (Admin, Ingénieur, Chef de labo, Technicien)
- **Rate limiting** pour prévenir les abus
- **Logging** et audit complets

### 📈 Module Qualité (SMQ)

- **Contrôles qualité** planifiés et suivis
- **Calibrations d'équipements** avec alertes
- **Gestion des non-conformités** avec actions correctives
- **Tableaux de bord qualité**

### 📅 Planification

- **Calendrier du laboratoire** avec vue des essais
- **Templates d'essais** réutilisables

### 🔌 API externe

- **API REST complète** pour intégration tierce
- **Authentification par clé API**
- **Import/Export de données** (Excel, JSON)

---

## 🏗️ Architecture technique

### Stack technologique

| Composant | Technologie | Version |
|-----------|-------------|---------|
| **Backend** | FastAPI (Python) | 0.104.1 |
| **Frontend** | React.js + Vite | 18.2 |
| **Base de données** | PostgreSQL | 14+ |
| **ORM** | SQLAlchemy | 2.0.23 |
| **Authentification** | JWT (python-jose) | 3.3.0 |
| **Validation** | Pydantic | 2.5.0 |
| **PDF** | ReportLab | 4.0.7 |
| **State Management** | Redux Toolkit | 2.0.1 |
| **UI** | TailwindCSS | 3.3.6 |
| **Graphiques** | Recharts | 2.10.3 |
| **Icônes** | Lucide React | 0.294 |
| **HTTP Client** | Axios | 1.6.2 |
| **Animations** | Framer Motion | 12.x |

### Architecture applicative

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│                    React + Vite + Redux                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │  Pages  │ │Components│ │ Services│ │  Store  │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP/REST + WebSocket
┌─────────────────────────▼───────────────────────────────────┐
│                        Backend                               │
│                    FastAPI + SQLAlchemy                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │   API   │ │ Services│ │ Models  │ │  Utils  │           │
│  │ Routes  │ │ Calculs │ │SQLAlchemy│ │  PDF   │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
└─────────────────────────┬───────────────────────────────────┘
                          │ SQL
┌─────────────────────────▼───────────────────────────────────┐
│                      PostgreSQL                              │
│           Données persistantes + Migrations Alembic          │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Structure du projet

```
GeoLab_Manager/
├── 📁 backend/                    # API FastAPI
│   ├── 📁 alembic/               # Migrations de base de données
│   │   ├── versions/             # Fichiers de migration
│   │   └── env.py
│   ├── 📁 app/
│   │   ├── 📁 api/
│   │   │   └── v1/
│   │   │       ├── api.py        # Router principal
│   │   │       └── endpoints/    # Tous les endpoints REST
│   │   │           ├── auth.py           # Authentification
│   │   │           ├── essais.py         # CRUD essais
│   │   │           ├── projets.py        # CRUD projets
│   │   │           ├── echantillons.py   # CRUD échantillons
│   │   │           ├── users.py          # Gestion utilisateurs
│   │   │           ├── rapports.py       # Génération PDF
│   │   │           ├── statistiques.py   # Statistiques
│   │   │           ├── qualite.py        # Module qualité
│   │   │           ├── workflow.py       # Workflow validation
│   │   │           ├── templates.py      # Templates d'essais
│   │   │           ├── notifications.py  # Notifications
│   │   │           ├── history.py        # Historique
│   │   │           ├── export.py         # Export données
│   │   │           └── external.py       # API externe
│   │   ├── 📁 core/              # Configuration et sécurité
│   │   │   ├── config.py         # Settings Pydantic
│   │   │   ├── database.py       # Connexion DB
│   │   │   ├── security.py       # JWT, hashing
│   │   │   ├── deps.py           # Dépendances FastAPI
│   │   │   ├── exceptions.py     # Exceptions personnalisées
│   │   │   └── health.py         # Health checks
│   │   ├── 📁 middleware/        # Middlewares
│   │   │   ├── rate_limit.py     # Rate limiting
│   │   │   ├── security.py       # Headers sécurité
│   │   │   └── logging.py        # Logging requêtes
│   │   ├── 📁 models/            # Modèles SQLAlchemy
│   │   │   ├── user.py           # Utilisateurs
│   │   │   ├── essai.py          # Essais + sous-types
│   │   │   ├── projet.py         # Projets
│   │   │   ├── echantillon.py    # Échantillons
│   │   │   ├── qualite.py        # Contrôles qualité
│   │   │   ├── template.py       # Templates
│   │   │   ├── notification.py   # Notifications
│   │   │   ├── history.py        # Historique
│   │   │   ├── workflow.py       # Workflow
│   │   │   └── api_key.py        # Clés API
│   │   ├── 📁 schemas/           # Schémas Pydantic
│   │   │   ├── user.py
│   │   │   ├── essai.py
│   │   │   ├── projet.py
│   │   │   ├── echantillon.py
│   │   │   └── qualite.py
│   │   ├── 📁 services/          # Logique métier
│   │   │   └── calculs.py        # Calculs géotechniques
│   │   ├── 📁 utils/             # Utilitaires
│   │   │   └── pdf_generator.py  # Génération rapports PDF
│   │   ├── 📁 websockets/        # WebSocket handlers
│   │   └── main.py               # Point d'entrée FastAPI
│   ├── 📁 tests/                 # Tests unitaires
│   ├── requirements.txt          # Dépendances Python
│   ├── requirements-dev.txt      # Dépendances dev
│   ├── Dockerfile
│   └── alembic.ini
│
├── 📁 frontend/                   # Application React
│   ├── 📁 src/
│   │   ├── 📁 components/        # Composants réutilisables
│   │   │   ├── 📁 auth/          # Composants authentification
│   │   │   ├── 📁 charts/        # Graphiques
│   │   │   ├── 📁 forms/         # Formulaires d'essais
│   │   │   │   ├── AtterbergForm.jsx
│   │   │   │   ├── CBRForm.jsx
│   │   │   │   ├── ProctorForm.jsx
│   │   │   │   └── GranulometrieForm.jsx
│   │   │   ├── 📁 graphs/        # Visualisations graphiques
│   │   │   │   ├── AtterbergGraph.jsx
│   │   │   │   ├── CBRGraph.jsx
│   │   │   │   ├── ProctorGraph.jsx
│   │   │   │   └── GranulometrieGraph.jsx
│   │   │   ├── 📁 qualite/       # Composants module qualité
│   │   │   ├── 📁 reports/       # Composants rapports
│   │   │   ├── 📁 notifications/ # Composants notifications
│   │   │   ├── Sidebar.jsx       # Menu latéral
│   │   │   └── Layout.jsx        # Layout principal
│   │   ├── 📁 pages/             # Pages de l'application
│   │   │   ├── Dashboard.jsx           # Tableau de bord
│   │   │   ├── LoginPage.jsx           # Connexion
│   │   │   ├── RegisterPage.jsx        # Inscription
│   │   │   ├── EssaisList.jsx          # Liste des essais
│   │   │   ├── EssaiForm.jsx           # Création/édition essai
│   │   │   ├── EssaiDetail.jsx         # Détail d'un essai
│   │   │   ├── ProjetsPage.jsx         # Liste des projets
│   │   │   ├── ProjetForm.jsx          # Création/édition projet
│   │   │   ├── ProjetDetailPage.jsx    # Détail d'un projet
│   │   │   ├── EchantillonsList.jsx    # Liste échantillons
│   │   │   ├── EchantillonForm.jsx     # Création échantillon
│   │   │   ├── Statistics.jsx          # Statistiques
│   │   │   ├── ComparisonPage.jsx      # Comparaison d'essais
│   │   │   ├── HistoryPage.jsx         # Historique
│   │   │   ├── LabCalendar.jsx         # Calendrier
│   │   │   ├── TemplatesPage.jsx       # Templates
│   │   │   ├── ReportBuilder.jsx       # Constructeur rapports
│   │   │   ├── QualityDashboard.jsx    # Dashboard qualité
│   │   │   ├── QualityControles.jsx    # Contrôles qualité
│   │   │   ├── QualityCalibrations.jsx # Calibrations
│   │   │   ├── QualityNonConformites.jsx # Non-conformités
│   │   │   ├── UsersList.jsx           # Liste utilisateurs
│   │   │   └── SettingsPage.jsx        # Paramètres
│   │   ├── 📁 services/          # Services API
│   │   │   └── api.js            # Client Axios
│   │   ├── 📁 store/             # Redux store
│   │   │   ├── index.js
│   │   │   ├── authSlice.js
│   │   │   ├── essaisSlice.js
│   │   │   └── projetsSlice.js
│   │   ├── 📁 hooks/             # Custom React hooks
│   │   ├── App.jsx               # Composant racine + Routes
│   │   ├── main.jsx              # Point d'entrée React
│   │   └── index.css             # Styles globaux
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── Dockerfile
│
├── docker-compose.yml             # Orchestration Docker
├── .gitignore
└── README.md
```

---

## 📋 Prérequis

### Développement local

| Outil | Version minimale |
|-------|------------------|
| Python | 3.10+ |
| Node.js | 18+ |
| PostgreSQL | 14+ |
| npm ou yarn | Dernière version |

### Déploiement Docker

| Outil | Version minimale |
|-------|------------------|
| Docker | 20.10+ |
| Docker Compose | 2.0+ |

---

## 🚀 Installation

### 1. Cloner le projet

```bash
git clone https://github.com/TheBeyonder237/GeoLab_Manager.git
cd GeoLab_Manager
```

### 2. Installation du Backend

```bash
cd backend

# Créer l'environnement virtuel
python -m venv venv

# Activer l'environnement virtuel
# Windows (PowerShell)
.\venv\Scripts\Activate.ps1
# Windows (CMD)
venv\Scripts\activate.bat
# Linux/macOS
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Pour le développement (tests, linting)
pip install -r requirements-dev.txt
```

### 3. Installation du Frontend

```bash
cd frontend

# Installer les dépendances
npm install
```

---

## ⚙️ Configuration

### Backend

Créer un fichier `.env` dans le dossier `backend/` :

```env
# Base de données
DATABASE_URL=postgresql://geolab_user:geolab_password@localhost:5432/geolab_db

# Sécurité JWT
SECRET_KEY=votre-cle-secrete-ultra-securisee-minimum-32-caracteres
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS (URLs du frontend autorisées)
CORS_ORIGINS=["http://localhost:3000","http://localhost:5173"]

# Logging
LOG_LEVEL=INFO

# Rate limiting
RATE_LIMIT_PER_MINUTE=60
```

### Frontend

Créer un fichier `.env` dans le dossier `frontend/` (optionnel) :

```env
VITE_API_URL=http://localhost:8000
```

### Base de données

1. **Créer la base de données PostgreSQL** :

```sql
CREATE DATABASE geolab_db;
CREATE USER geolab_user WITH PASSWORD 'geolab_password';
GRANT ALL PRIVILEGES ON DATABASE geolab_db TO geolab_user;
```

2. **Appliquer les migrations** :

```bash
cd backend
alembic upgrade head
```

3. **Créer un utilisateur administrateur** (première utilisation) :

Lancez l'application et créez un compte via `/register`, puis modifiez son rôle en `admin` dans la base de données si nécessaire.

---

## ▶️ Démarrage

### Mode développement

**Terminal 1 - Backend :**

```bash
cd backend
# Activer l'environnement virtuel si nécessaire
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend :**

```bash
cd frontend
npm run dev
```

### Accès aux applications

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:5173 (ou 3000) |
| **Backend API** | http://localhost:8000 |
| **Swagger UI** | http://localhost:8000/docs |
| **ReDoc** | http://localhost:8000/redoc |
| **Health Check** | http://localhost:8000/health |

---

## 📚 Documentation API

### Endpoints principaux

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| **Auth** |||
| `POST` | `/api/v1/auth/login` | Connexion utilisateur |
| `POST` | `/api/v1/auth/register` | Inscription |
| `POST` | `/api/v1/auth/refresh` | Rafraîchir le token |
| **Essais** |||
| `GET` | `/api/v1/essais` | Liste des essais |
| `POST` | `/api/v1/essais` | Créer un essai |
| `GET` | `/api/v1/essais/{id}` | Détail d'un essai |
| `PUT` | `/api/v1/essais/{id}` | Modifier un essai |
| `DELETE` | `/api/v1/essais/{id}` | Supprimer un essai |
| `POST` | `/api/v1/essais/{id}/atterberg` | Ajouter données Atterberg |
| `POST` | `/api/v1/essais/{id}/cbr` | Ajouter données CBR |
| `POST` | `/api/v1/essais/{id}/proctor` | Ajouter données Proctor |
| `POST` | `/api/v1/essais/{id}/granulometrie` | Ajouter données Granulo |
| **Projets** |||
| `GET` | `/api/v1/projets` | Liste des projets |
| `POST` | `/api/v1/projets` | Créer un projet |
| `GET` | `/api/v1/projets/{id}` | Détail d'un projet |
| `PUT` | `/api/v1/projets/{id}` | Modifier un projet |
| `DELETE` | `/api/v1/projets/{id}` | Supprimer un projet |
| **Rapports** |||
| `GET` | `/api/v1/rapports/{essai_id}/pdf` | Générer PDF d'un essai |
| **Statistiques** |||
| `GET` | `/api/v1/statistiques/dashboard` | Statistiques globales |
| `GET` | `/api/v1/statistiques/{type_essai}` | Stats par type d'essai |
| **Qualité** |||
| `GET` | `/api/v1/qualite/controles` | Liste contrôles qualité |
| `GET` | `/api/v1/qualite/calibrations` | Liste calibrations |
| `GET` | `/api/v1/qualite/non-conformites` | Liste non-conformités |
| **Workflow** |||
| `POST` | `/api/v1/workflow/{essai_id}/transition` | Changer statut essai |
| **Export** |||
| `GET` | `/api/v1/export/essais` | Export Excel des essais |

### Documentation interactive

Une fois le backend démarré, accédez à :

- **Swagger UI** : http://localhost:8000/docs
- **ReDoc** : http://localhost:8000/redoc

---

## 🧪 Types d'essais supportés

### 1. Limites d'Atterberg (NF P94-051)

**Paramètres mesurés :**
- Limite de liquidité (WL) - Méthode Casagrande
- Limite de plasticité (WP)
- Limite de retrait (WR) - Optionnel

**Résultats calculés :**
- WL (%), WP (%), IP (Indice de plasticité)
- IC (Indice de consistance)
- IR (Indice de retrait)
- IA (Indice d'activité)
- Classification GTR/USCS

### 2. Essai CBR (NF P94-078)

**Paramètres mesurés :**
- Points de pénétration (force/déplacement)
- Conditions de préparation (teneur en eau, densité)
- Gonflement après immersion

**Résultats calculés :**
- CBR à 2,5 mm et 5,0 mm
- CBR final retenu
- Classe de portance
- Module EV2

### 3. Essai Proctor (NF P94-093)

**Paramètres mesurés :**
- Points de mesure (teneur en eau, masses, densités)
- Caractéristiques du moule
- Énergie de compactage

**Résultats calculés :**
- OPM (Optimum Proctor Modifié)
- Densité sèche maximale (γd max)
- Densité humide maximale
- Saturation optimale

### 4. Granulométrie (NF P94-056)

**Paramètres mesurés :**
- Points de tamisage (tamis, masse retenue)
- Points de sédimentométrie (optionnel)
- Masse initiale et après lavage

**Résultats calculés :**
- D10, D16, D30, D50, D60, D84
- CU (Coefficient d'uniformité)
- CC (Coefficient de courbure)
- Pourcentages gravier/sable/limon/argile
- Classification granulométrique

---

## 👥 Gestion des utilisateurs

### Rôles et permissions

| Rôle | Code | Permissions |
|------|------|-------------|
| **Administrateur** | `admin` | Accès complet à toutes les fonctionnalités |
| **Ingénieur** | `ingenieur` | Consultation, validation, rapports |
| **Chef de laboratoire** | `chef_lab` | Gestion des essais, équipe, qualité |
| **Technicien** | `technicien` | Saisie des données, création d'essais |

### Workflow de validation

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ BROUILLON│───▶│ EN_COURS │───▶│ TERMINE  │───▶│ VALIDE   │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
   (Technicien)  (Technicien)  (Chef de labo)  (Ingénieur)
```

---

## 🔍 Module Qualité

### Contrôles Qualité

- Planification de contrôles périodiques
- Types : vérification données, calibration, maintenance, audit, formation
- Suivi des résultats et conformité
- Actions correctives

### Calibrations d'équipements

- Suivi des équipements de mesure
- Enregistrement des mesures de calibration
- Alertes de calibration à échéance
- Calcul de précision

### Non-conformités

- Détection et enregistrement
- Classification par gravité (1-5)
- Actions immédiates et correctives
- Suivi jusqu'à résolution

---

## 📄 Génération de rapports PDF

Les rapports PDF générés comprennent :

### Structure du rapport

1. **En-tête**
   - Titre du rapport avec type d'essai
   - Logo du laboratoire (optionnel)

2. **Informations générales**
   - Numéro d'essai
   - Référence normative
   - Projet / Client / Site
   - Dates (essai, réception)
   - Opérateur et responsable

3. **Synthèse des résultats**
   - Tableau des paramètres clés

4. **Résultats détaillés**
   - Tableaux complets des mesures
   - Paramètres calculés

5. **Graphiques**
   - Courbes spécifiques à chaque type d'essai

6. **Observations**
   - Notes et remarques

7. **Conditions d'utilisation**
   - Mentions légales standard

8. **Bloc de validation**
   - Signatures : Rédigé / Vérifié / Approuvé

---

## 🗄️ Base de données

### Schéma principal

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    users    │     │   projets   │     │ echantillons│
├─────────────┤     ├─────────────┤     ├─────────────┤
│ id          │◀───┐│ id          │◀───┐│ id          │
│ email       │    ││ nom         │    ││ reference   │
│ username    │    ││ code_projet │    ││ projet_id   │──┐
│ role        │    ││ client      │    ││ date_prelev │  │
│ is_active   │    ││ site        │    ││ lieu        │  │
└─────────────┘    ││ responsable │────┘│ profondeur  │  │
                   │└─────────────┘     └─────────────┘  │
                   │       │                             │
                   │       │                             │
┌─────────────┐    │       ▼                             │
│   essais    │    │ ┌─────────────┐                     │
├─────────────┤    │ │   essais    │                     │
│ id          │    │ │ projet_id   │─────────────────────┘
│ numero_essai│    │ │             │
│ type_essai  │    │ └─────────────┘
│ statut      │    │
│ projet_id   │────┘
│ operateur_id│────┐
└─────────────┘    │
       │           │
       ▼           │
┌──────────────────┴────────────────────────────────────┐
│                    Essais spécifiques                  │
├─────────────┬─────────────┬─────────────┬─────────────┤
│essais_      │essais_cbr   │essais_      │essais_      │
│atterberg   │             │proctor      │granulometrie│
└─────────────┴─────────────┴─────────────┴─────────────┘
```

### Migrations

Les migrations sont gérées avec Alembic :

```bash
# Créer une nouvelle migration
alembic revision --autogenerate -m "Description"

# Appliquer les migrations
alembic upgrade head

# Voir l'historique
alembic history

# Revenir en arrière
alembic downgrade -1
```

---

## 🧪 Tests

### Backend

```bash
cd backend

# Lancer tous les tests
pytest

# Avec couverture
pytest --cov=app tests/

# Tests spécifiques
pytest tests/test_essais.py -v
```

### Frontend

```bash
cd frontend

# Linter
npm run lint

# Build de production (vérification)
npm run build
```

---

## 🐳 Déploiement Docker

### Démarrage complet

```bash
# Construire et démarrer tous les services
docker-compose up -d --build

# Voir les logs
docker-compose logs -f

# Arrêter les services
docker-compose down
```

### Services Docker

| Service | Port | Description |
|---------|------|-------------|
| `db` | 5432 | PostgreSQL 14 |
| `backend` | 8000 | API FastAPI |
| `frontend` | 3000 | React (Vite) |

### Variables d'environnement (production)

```bash
# Définir la clé secrète
export SECRET_KEY="votre-cle-production-tres-securisee"

# Démarrer
docker-compose up -d
```

---

## 🤝 Contribution

### Workflow Git

1. Créer une branche feature : `git checkout -b feature/nouvelle-fonctionnalite`
2. Commiter les changements : `git commit -m "feat: description"`
3. Pousser la branche : `git push origin feature/nouvelle-fonctionnalite`
4. Créer une Pull Request

### Convention de commits

- `feat:` Nouvelle fonctionnalité
- `fix:` Correction de bug
- `docs:` Documentation
- `style:` Formatage (pas de changement de code)
- `refactor:` Refactoring
- `test:` Ajout de tests
- `chore:` Maintenance

### Standards de code

- **Backend** : PEP 8, Black formatter
- **Frontend** : ESLint, Prettier

---

## 📞 Support

Pour toute question ou problème :

- Créer une issue sur le dépôt GitHub
- Consulter la documentation API : `/docs`

---

## 📄 Licence

**Propriétaire - Tous droits réservés**

Ce logiciel est la propriété exclusive de son auteur. Toute reproduction, distribution ou utilisation non autorisée est strictement interdite.

---

<p align="center">
  <strong>GeoLab Manager</strong> - Gestion moderne des essais géotechniques<br>
</p>
