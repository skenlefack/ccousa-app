# 🏥 CCOUSA-APP

## Plateforme de Gestion des Événements de Santé Animale au Cameroun

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/ccousa-app)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/react-18.2-blue.svg)](https://reactjs.org)
[![PostgreSQL](https://img.shields.io/badge/postgresql-15-blue.svg)](https://www.postgresql.org)

---

## 📋 Description

**CCOUSA-APP** est une application web moderne conçue pour la gestion intégrée des événements de santé animale au Cameroun, dans le cadre de l'approche **« Une Seule Santé »** (One Health). 

Cette plateforme numérique vise à renforcer la coordination entre les secteurs de la santé animale, humaine et environnementale, afin d'améliorer la détection, la notification, le suivi et la réponse rapide aux incidents sanitaires d'origine animale.

### 🎯 Objectifs Principaux

- **Centraliser** toutes les informations relatives aux événements sanitaires
- **Accélérer** les interventions grâce à des workflows automatisés
- **Coordonner** les actions entre les différents acteurs (DSV, laboratoires, ministères)
- **Tracer** l'ensemble des actions menées sur le terrain
- **Analyser** les données pour une meilleure prise de décision

---

## 🏗️ Architecture

L'application est construite sur une architecture **microservices** moderne :

```
┌─────────────────────────────────────────────────────────────┐
│                        NGINX                                 │
│                    (Load Balancer)                           │
└─────────────────────────┬───────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
    ┌────▼────┐    ┌──────▼──────┐   ┌─────▼─────┐
    │ Frontend │    │ API Gateway │   │   CDN     │
    │  React   │    │   Express   │   │  Static   │
    └──────────┘    └──────┬──────┘   └───────────┘
                           │
    ┌──────────────────────┼──────────────────────┐
    │                      │                      │
┌───▼───┐ ┌───▼───┐ ┌───▼───┐ ┌───▼───┐ ┌───▼───┐
│ Auth  │ │ Users │ │Events │ │Proced.│ │Notif. │
│Service│ │Service│ │Service│ │Service│ │Service│
└───┬───┘ └───┬───┘ └───┬───┘ └───┬───┘ └───┬───┘
    └─────────┴─────────┴────┬────┴─────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼────┐        ┌─────▼─────┐       ┌─────▼─────┐
    │PostgreSQL│        │   Redis   │       │ RabbitMQ  │
    │    DB    │        │   Cache   │       │  Queue    │
    └──────────┘        └───────────┘       └───────────┘
```

### 📦 Stack Technologique

| Composant | Technologie |
|-----------|-------------|
| Frontend | React 18 + TypeScript + Vite |
| Backend | Node.js + Express (Microservices) |
| Base de données | PostgreSQL 15 |
| Cache | Redis 7 |
| Message Queue | RabbitMQ 3 |
| Conteneurisation | Docker + Docker Compose |
| Styling | Tailwind CSS |
| State Management | Redux Toolkit + React Query |

---

## 🚀 Démarrage Rapide

### Prérequis

- **Docker** >= 24.0
- **Docker Compose** >= 2.20
- **Node.js** >= 20.0 (pour le développement local)
- **Git**

### Installation

1. **Cloner le repository**
   ```bash
   git clone https://github.com/your-org/ccousa-app.git
   cd ccousa-app
   ```

2. **Configurer les variables d'environnement**
   ```bash
   cp .env.example .env
   # Modifier les valeurs dans .env selon votre environnement
   ```

3. **Démarrer avec Docker Compose**
   ```bash
   # Mode développement
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

   # Mode production
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

4. **Vérifier que les services sont opérationnels**
   ```bash
   docker-compose ps
   ```

5. **Accéder à l'application**
   - Frontend : http://localhost:3000
   - API Gateway : http://localhost:8000
   - RabbitMQ Management : http://localhost:15672

### Identifiants par défaut

| Service | Utilisateur | Mot de passe |
|---------|-------------|--------------|
| Application | admin@ccousa-app.cm | Admin@123 |
| RabbitMQ | admin | admin123 |
| PostgreSQL | ccousa_user | (voir .env) |

---

## 📁 Structure du Projet

```
ccousa-app/
├── docker/                    # Configuration Docker
│   ├── nginx/                 # Config Nginx
│   └── postgres/              # Scripts SQL init
├── services/                  # Microservices Backend
│   ├── api-gateway/           # API Gateway
│   ├── auth-service/          # Authentification
│   ├── users-service/         # Gestion utilisateurs
│   ├── events-service/        # Gestion événements
│   ├── procedures-service/    # Gestion procédures
│   ├── knowledge-service/     # Base de connaissance
│   ├── notifications-service/ # Notifications
│   ├── config-service/        # Configuration
│   ├── forms-service/         # Formulaires dynamiques
│   └── analytics-service/     # Analytics & Rapports
├── frontend/                  # Application React
│   ├── src/
│   │   ├── api/               # Services API
│   │   ├── components/        # Composants React
│   │   ├── pages/             # Pages
│   │   ├── hooks/             # Hooks personnalisés
│   │   ├── store/             # État Redux
│   │   ├── types/             # Types TypeScript
│   │   └── utils/             # Utilitaires
│   └── public/                # Fichiers statiques
├── docs/                      # Documentation
├── docker-compose.yml         # Config Docker principal
├── docker-compose.dev.yml     # Config développement
├── docker-compose.prod.yml    # Config production
└── README.md
```

---

## 🔧 Développement

### Développement Frontend

```bash
cd frontend
npm install
npm run dev
```

### Développement Backend (Service individuel)

```bash
cd services/auth-service
npm install
npm run dev
```

### Exécuter les tests

```bash
# Frontend
cd frontend && npm run test

# Backend
cd services/auth-service && npm run test
```

### Linting et formatage

```bash
npm run lint
npm run format
```

---

## 📚 Documentation API

La documentation API est disponible via Swagger UI une fois l'application démarrée :

- **API Gateway** : http://localhost:8000/api-docs
- **Auth Service** : http://localhost:3001/api-docs

### Exemples d'endpoints

```bash
# Authentification
POST /api/auth/login
POST /api/auth/refresh-token
POST /api/auth/logout

# Utilisateurs
GET  /api/users
POST /api/users
GET  /api/users/:id

# Événements
GET  /api/events
POST /api/events
GET  /api/events/:id
PUT  /api/events/:id/status

# Procédures
GET  /api/procedures
POST /api/procedures
GET  /api/procedures/:id/steps
```

---

## 👥 Profils Utilisateurs

| Profil | Niveau | Description |
|--------|--------|-------------|
| Utilisateur simple | 1 | Agent de terrain - Collecte de données |
| Gestionnaire de contenu | 2 | Supervision et enrichissement des contenus |
| Validateur | 3 | Contrôle qualité et validation |
| Manager | 4 | Responsable régional/départemental |
| Administrateur | 5 | Administration fonctionnelle |
| Super administrateur | 6 | Contrôle total de la plateforme |

---

## 🔐 Sécurité

- **Authentification** : JWT avec refresh tokens
- **Autorisation** : RBAC (Role-Based Access Control)
- **Chiffrement** : HTTPS en production
- **Rate Limiting** : Protection contre les abus
- **Validation** : Validation des entrées avec Zod
- **Headers** : Protection avec Helmet.js

---

## 📊 Monitoring

### Logs

Les logs sont disponibles via Docker :

```bash
# Tous les services
docker-compose logs -f

# Service spécifique
docker-compose logs -f auth-service
```

### Health Checks

Chaque service expose un endpoint `/health` :

```bash
curl http://localhost:3001/health
```

---

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push sur la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 📞 Support

- **Email** : support@ccousa-app.cm
- **Documentation** : https://docs.ccousa-app.cm
- **Site web** : https://www.ccousa-app.cm

---

## 🙏 Remerciements

- **MINEPIA** - Ministère de l'Élevage, des Pêches et des Industries Animales
- **PATNUC** - Programme d'Appui Technique
- **Banque Mondiale** - Soutien financier

---

<p align="center">
  <strong>CCOUSA-APP</strong> - Gestion des Événements de Santé Animale selon l'approche « Une Seule Santé »
  <br>
  <em>Version 1.0 - Mai 2025</em>
</p>
