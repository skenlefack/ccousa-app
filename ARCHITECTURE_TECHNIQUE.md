# CCOUSA-APP - Architecture Technique Complète

## 📋 Table des Matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture Microservices](#2-architecture-microservices)
3. [Schéma de Base de Données PostgreSQL](#3-schéma-de-base-de-données-postgresql)
4. [Architecture Frontend React](#4-architecture-frontend-react)
5. [Configuration Docker](#5-configuration-docker)
6. [API Gateway et Communication](#6-api-gateway-et-communication)
7. [Sécurité et Authentification](#7-sécurité-et-authentification)
8. [Plan de Développement](#8-plan-de-développement)

---

## 1. Vue d'ensemble

### 1.1 Description du Projet

CCOUSA-APP est une plateforme numérique de gestion des événements de santé animale au Cameroun, basée sur l'approche "Une Seule Santé". L'application centralise les informations sanitaires, facilite les interventions rapides et assure la traçabilité des actions.

### 1.2 Stack Technologique

| Composant | Technologie |
|-----------|-------------|
| Frontend | React 18 + TypeScript + Vite |
| Backend | Node.js + Express (Microservices) |
| Base de données | PostgreSQL 15 |
| Cache | Redis |
| Message Queue | RabbitMQ |
| Conteneurisation | Docker + Docker Compose |
| API Gateway | Kong / Express Gateway |
| Authentification | JWT + OAuth 2.0 |

### 1.3 Modules Fonctionnels Identifiés

D'après le guide utilisateur, voici les modules principaux :

1. **Module Authentification & Utilisateurs**
2. **Module Tableau de Bord (Dashboard)**
3. **Module Gestion des Événements**
4. **Module Gestion des Procédures**
5. **Module Base de Connaissance**
6. **Module Paramétrage**
7. **Module Configuration**
8. **Module Formulaires Dynamiques**
9. **Module Notifications**
10. **Module Rapports & Analytics**

---

## 2. Architecture Microservices

### 2.1 Diagramme d'Architecture

```
                                    ┌─────────────────┐
                                    │   Load Balancer │
                                    │     (Nginx)     │
                                    └────────┬────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    │                        │                        │
            ┌───────▼───────┐       ┌────────▼────────┐      ┌───────▼───────┐
            │  Frontend     │       │   API Gateway   │      │  Static Files │
            │  React App    │       │   (Kong/Express)│      │    (CDN)      │
            │  Port: 3000   │       │   Port: 8000    │      │               │
            └───────────────┘       └────────┬────────┘      └───────────────┘
                                             │
        ┌────────────┬───────────────┬───────┴───────┬───────────────┬────────────┐
        │            │               │               │               │            │
┌───────▼──────┐┌────▼─────┐┌───────▼──────┐┌───────▼──────┐┌───────▼──────┐┌────▼─────┐
│   Auth       ││  Users   ││   Events     ││  Procedures  ││  Knowledge   ││ Notif    │
│   Service    ││  Service ││   Service    ││  Service     ││  Service     ││ Service  │
│   :3001      ││  :3002   ││   :3003      ││  :3004       ││  :3005       ││ :3006    │
└──────┬───────┘└────┬─────┘└──────┬───────┘└──────┬───────┘└──────┬───────┘└────┬─────┘
       │             │             │               │               │             │
       └─────────────┴─────────────┴───────┬───────┴───────────────┴─────────────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
            ┌───────▼───────┐      ┌───────▼───────┐      ┌───────▼───────┐
            │  PostgreSQL   │      │     Redis     │      │   RabbitMQ    │
            │   Database    │      │     Cache     │      │   Message Q   │
            │   Port: 5432  │      │   Port: 6379  │      │   Port: 5672  │
            └───────────────┘      └───────────────┘      └───────────────┘
```

### 2.2 Description des Microservices

#### 2.2.1 Auth Service (Port 3001)
**Responsabilités:**
- Authentification (login/logout)
- Gestion des tokens JWT
- Refresh tokens
- Validation des sessions
- Gestion des rôles et permissions

**Endpoints:**
```
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh-token
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/auth/verify-token
```

#### 2.2.2 Users Service (Port 3002)
**Responsabilités:**
- CRUD utilisateurs
- Gestion des profils (6 types identifiés)
- Gestion des groupes
- Attribution des droits
- Gestion des unités organisationnelles

**Profils utilisateurs (du guide):**
1. Utilisateur simple (Agent de terrain)
2. Gestionnaire de contenu
3. Validateur
4. Manager (Responsable régional/départemental)
5. Administrateur
6. Super administrateur

**Endpoints:**
```
GET    /api/users
POST   /api/users
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id
GET    /api/users/:id/permissions
PUT    /api/users/:id/permissions
GET    /api/groups
POST   /api/groups
GET    /api/roles
POST   /api/roles
```

#### 2.2.3 Events Service (Port 3003)
**Responsabilités:**
- Gestion des événements de santé animale
- Suivi du cycle de vie des événements
- Attribution automatique des tâches
- Gestion des pièces jointes
- Historique et traçabilité

**Endpoints:**
```
GET    /api/events
POST   /api/events
GET    /api/events/:id
PUT    /api/events/:id
DELETE /api/events/:id
POST   /api/events/:id/attachments
GET    /api/events/:id/history
PUT    /api/events/:id/status
GET    /api/events/:id/tasks
POST   /api/events/:id/validate
POST   /api/events/:id/reject
```

#### 2.2.4 Procedures Service (Port 3004)
**Responsabilités:**
- Définition des procédures
- Gestion des étapes
- Configuration des workflows
- Déclencheurs automatiques
- Gestion des formulaires associés

**Endpoints:**
```
GET    /api/procedures
POST   /api/procedures
GET    /api/procedures/:id
PUT    /api/procedures/:id
DELETE /api/procedures/:id
GET    /api/procedures/:id/steps
POST   /api/procedures/:id/steps
PUT    /api/procedures/:id/steps/:stepId
GET    /api/procedure-groups
POST   /api/procedure-groups
GET    /api/categories
POST   /api/categories
```

#### 2.2.5 Knowledge Service (Port 3005)
**Responsabilités:**
- Gestion documentaire
- Base de connaissance
- Publications
- Fiches techniques
- Ressources multimédias

**Endpoints:**
```
GET    /api/documents
POST   /api/documents
GET    /api/documents/:id
PUT    /api/documents/:id
DELETE /api/documents/:id
GET    /api/publications
POST   /api/publications
GET    /api/technical-sheets
POST   /api/technical-sheets
GET    /api/media
POST   /api/media
```

#### 2.2.6 Notification Service (Port 3006)
**Responsabilités:**
- Notifications email
- Notifications in-app
- Alertes et rappels
- Notifications push

**Endpoints:**
```
GET    /api/notifications
POST   /api/notifications
PUT    /api/notifications/:id/read
GET    /api/notifications/unread-count
POST   /api/notifications/send-email
POST   /api/notifications/send-bulk
```

#### 2.2.7 Configuration Service (Port 3007)
**Responsabilités:**
- Configurations générales
- Horaires de travail
- Opérations sur requêtes
- Paramètres système

**Endpoints:**
```
GET    /api/config/general
PUT    /api/config/general
GET    /api/config/work-schedules
POST   /api/config/work-schedules
PUT    /api/config/work-schedules/:id
GET    /api/config/request-operations
POST   /api/config/request-operations
```

#### 2.2.8 Forms Service (Port 3008)
**Responsabilités:**
- Création de formulaires dynamiques
- Gestion des champs
- Validation des données
- Export des réponses

**Endpoints:**
```
GET    /api/forms
POST   /api/forms
GET    /api/forms/:id
PUT    /api/forms/:id
DELETE /api/forms/:id
GET    /api/forms/:id/responses
POST   /api/forms/:id/responses
GET    /api/form-fields
```

#### 2.2.9 Analytics Service (Port 3009)
**Responsabilités:**
- Tableaux de bord
- Statistiques
- Rapports
- Export de données

**Endpoints:**
```
GET    /api/analytics/dashboard
GET    /api/analytics/events-stats
GET    /api/analytics/regional-stats
GET    /api/analytics/reports
POST   /api/analytics/reports/generate
GET    /api/analytics/exports
```

---

## 3. Schéma de Base de Données PostgreSQL

### 3.1 Modèle Entité-Relation

```sql
-- =====================================================
-- CCOUSA-APP - Schéma de Base de Données PostgreSQL
-- Version 1.0 - Mai 2025
-- =====================================================

-- Extension pour UUID et fonctions avancées
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TABLES DE RÉFÉRENCE
-- =====================================================

-- Table des pays
CREATE TABLE countries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(3) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des langues
CREATE TABLE languages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(5) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des fuseaux horaires
CREATE TABLE timezones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    offset_hours INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- GESTION DES UTILISATEURS ET DROITS
-- =====================================================

-- Table des rôles
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    level INTEGER NOT NULL, -- 1: Simple, 2: Gestionnaire, 3: Validateur, 4: Manager, 5: Admin, 6: SuperAdmin
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- Table des permissions
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    module VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table de liaison rôles-permissions
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, permission_id)
);

-- Table des groupes
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES groups(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- Table des unités organisationnelles (régions, départements, arrondissements)
CREATE TABLE organizational_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    type VARCHAR(50) NOT NULL, -- REGION, DEPARTMENT, DISTRICT, CZV
    parent_id UUID REFERENCES organizational_units(id),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des utilisateurs
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identifier VARCHAR(50) NOT NULL UNIQUE, -- Matricule ou identifiant
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    gender VARCHAR(10), -- M, F
    phone VARCHAR(20),
    photo_url VARCHAR(500),
    role_id UUID NOT NULL REFERENCES roles(id),
    organizational_unit_id UUID REFERENCES organizational_units(id),
    supervisor_id UUID REFERENCES users(id),
    function VARCHAR(150),
    default_language_id UUID REFERENCES languages(id),
    default_timezone_id UUID REFERENCES timezones(id),
    work_hours_per_day INTEGER DEFAULT 8,
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, SUSPENDED, ON_LEAVE
    last_login_at TIMESTAMP,
    password_changed_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Table des groupes utilisateurs
CREATE TABLE user_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, group_id)
);

-- Table des sessions utilisateurs
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL UNIQUE,
    refresh_token VARCHAR(500),
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP
);

-- =====================================================
-- CONFIGURATION SYSTÈME
-- =====================================================

-- Table des configurations générales
CREATE TABLE system_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) NOT NULL UNIQUE,
    value TEXT,
    value_type VARCHAR(20) DEFAULT 'STRING', -- STRING, INTEGER, BOOLEAN, JSON, DATE
    description TEXT,
    is_editable BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id)
);

-- Table des horaires de travail
CREATE TABLE work_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- GENERAL, SPECIFIC, HOLIDAY
    timezone_id UUID REFERENCES timezones(id),
    start_date DATE,
    end_date DATE,
    is_period_specific BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Table des jours de travail
CREATE TABLE work_schedule_days (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_schedule_id UUID NOT NULL REFERENCES work_schedules(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL, -- 0: Dimanche, 1: Lundi, ..., 6: Samedi
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_duration INTEGER DEFAULT 0, -- en minutes
    is_working_day BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table de liaison horaires-utilisateurs
CREATE TABLE work_schedule_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_schedule_id UUID NOT NULL REFERENCES work_schedules(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    organizational_unit_id UUID REFERENCES organizational_units(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (user_id IS NOT NULL OR group_id IS NOT NULL OR organizational_unit_id IS NOT NULL)
);

-- =====================================================
-- PARAMÉTRAGE DES PROCÉDURES
-- =====================================================

-- Table des types de documents
CREATE TABLE document_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    language_id UUID REFERENCES languages(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Table des étapes externes
CREATE TABLE external_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    organization_name VARCHAR(200), -- Ex: MINSANTE, LANAVET
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Table des catégories d'événements/tâches
CREATE TABLE event_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    color VARCHAR(7) DEFAULT '#0066CC', -- Format hexadécimal
    icon VARCHAR(50) DEFAULT 'folder',
    language_id UUID REFERENCES languages(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Table des groupes de procédures
CREATE TABLE procedure_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Table des procédures
CREATE TABLE procedures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- INVESTIGATION, VACCINATION, INSPECTION, BIOSECURITY, etc.
    group_id UUID REFERENCES procedure_groups(id),
    category_id UUID REFERENCES event_categories(id),
    is_checklist BOOLEAN DEFAULT FALSE,
    keywords TEXT[], -- Mots-clés pour recherche
    trigger_type VARCHAR(50), -- MANUAL, AUTOMATIC, SCHEDULED
    trigger_frequency VARCHAR(50), -- DAILY, WEEKLY, MONTHLY, YEARLY
    trigger_time TIME,
    trigger_start_date DATE,
    trigger_end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Table des étapes de procédure
CREATE TABLE procedure_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    procedure_id UUID NOT NULL REFERENCES procedures(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    step_order INTEGER NOT NULL,
    step_type VARCHAR(50) NOT NULL, -- INPUT, VALIDATION, SUPERVISION, EXTERNAL
    is_external BOOLEAN DEFAULT FALSE,
    external_step_id UUID REFERENCES external_steps(id),
    send_type VARCHAR(50) DEFAULT 'AUTOMATIC', -- AUTOMATIC, MANUAL
    duration_value INTEGER, -- Durée estimée
    duration_unit VARCHAR(20) DEFAULT 'DAYS', -- HOURS, DAYS, WEEKS
    form_id UUID, -- Référence vers formulaires dynamiques
    is_visible_externally BOOLEAN DEFAULT FALSE,
    is_required BOOLEAN DEFAULT TRUE,
    can_skip BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des responsables d'étapes
CREATE TABLE procedure_step_assignees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    procedure_step_id UUID NOT NULL REFERENCES procedure_steps(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (user_id IS NOT NULL OR role_id IS NOT NULL OR group_id IS NOT NULL)
);

-- Table des documents requis par étape
CREATE TABLE procedure_step_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    procedure_step_id UUID NOT NULL REFERENCES procedure_steps(id) ON DELETE CASCADE,
    document_type_id UUID NOT NULL REFERENCES document_types(id),
    is_required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- FORMULAIRES DYNAMIQUES
-- =====================================================

-- Table des formulaires
CREATE TABLE forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'PARAMETER', -- PARAMETER, EXISTING
    language_id UUID REFERENCES languages(id),
    layout_columns INTEGER DEFAULT 2, -- Nombre de colonnes (ex: 6+6, 4+4+4)
    is_active BOOLEAN DEFAULT TRUE,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Table des sections de formulaire
CREATE TABLE form_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    section_order INTEGER NOT NULL,
    columns_layout VARCHAR(20) DEFAULT '6+6', -- 6+6, 4+4+4, 12, etc.
    is_collapsible BOOLEAN DEFAULT FALSE,
    is_collapsed_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des types de champs
CREATE TABLE field_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50), -- LOCATION, TEXT, SELECTION, DATE, FILE, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des champs de formulaire
CREATE TABLE form_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    section_id UUID REFERENCES form_sections(id) ON DELETE CASCADE,
    field_type_id UUID NOT NULL REFERENCES field_types(id),
    name VARCHAR(100) NOT NULL,
    label VARCHAR(200) NOT NULL,
    placeholder VARCHAR(200),
    help_text TEXT,
    default_value TEXT,
    field_order INTEGER NOT NULL,
    column_span INTEGER DEFAULT 6, -- Sur 12 colonnes
    is_required BOOLEAN DEFAULT FALSE,
    is_readonly BOOLEAN DEFAULT FALSE,
    is_hidden BOOLEAN DEFAULT FALSE,
    validation_rules JSONB, -- Règles de validation JSON
    options JSONB, -- Options pour les listes déroulantes
    conditional_logic JSONB, -- Logique conditionnelle
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des formules de calcul
CREATE TABLE form_formulas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    target_field_id UUID NOT NULL REFERENCES form_fields(id) ON DELETE CASCADE,
    formula_expression TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- GESTION DES ÉVÉNEMENTS
-- =====================================================

-- Table des événements
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE, -- Ex: 2025_05_EVT001
    title VARCHAR(300) NOT NULL,
    description TEXT,
    procedure_id UUID NOT NULL REFERENCES procedures(id),
    category_id UUID REFERENCES event_categories(id),
    status VARCHAR(50) DEFAULT 'OPEN', -- OPEN, IN_PROGRESS, PAUSED, CLOSED, CANCELLED
    priority VARCHAR(20) DEFAULT 'NORMAL', -- LOW, NORMAL, HIGH, URGENT
    
    -- Localisation
    region_id UUID REFERENCES organizational_units(id),
    department_id UUID REFERENCES organizational_units(id),
    district_id UUID REFERENCES organizational_units(id),
    village VARCHAR(200),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Dates
    event_date DATE NOT NULL,
    notification_date DATE,
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP,
    closed_date TIMESTAMP,
    
    -- Informations complémentaires
    animal_species TEXT[],
    affected_count INTEGER,
    dead_count INTEGER,
    suspected_disease VARCHAR(200),
    confirmed_disease VARCHAR(200),
    
    -- Métadonnées
    current_step_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    is_urgent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    assigned_to UUID REFERENCES users(id)
);

-- Table des tâches/étapes d'événement
CREATE TABLE event_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    procedure_step_id UUID REFERENCES procedure_steps(id),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    task_order INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED, REJECTED, SKIPPED
    
    -- Dates
    start_date TIMESTAMP,
    due_date TIMESTAMP,
    completed_date TIMESTAMP,
    actual_duration INTEGER, -- En minutes
    
    -- Affectation
    assigned_to UUID REFERENCES users(id),
    assigned_group UUID REFERENCES groups(id),
    
    -- Validation
    validated_by UUID REFERENCES users(id),
    validated_at TIMESTAMP,
    validation_comment TEXT,
    rejection_reason TEXT,
    
    -- Formulaire associé
    form_id UUID REFERENCES forms(id),
    form_data JSONB, -- Données du formulaire rempli
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des pièces jointes
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    event_task_id UUID REFERENCES event_tasks(id) ON DELETE CASCADE,
    document_type_id UUID REFERENCES document_types(id),
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100),
    description TEXT,
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (event_id IS NOT NULL OR event_task_id IS NOT NULL)
);

-- Table de l'historique des événements
CREATE TABLE event_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    event_task_id UUID REFERENCES event_tasks(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL, -- CREATE, UPDATE, STATUS_CHANGE, VALIDATION, REJECTION, COMMENT, etc.
    old_value TEXT,
    new_value TEXT,
    comment TEXT,
    performed_by UUID REFERENCES users(id),
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45)
);

-- Table des commentaires
CREATE TABLE event_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    event_task_id UUID REFERENCES event_tasks(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES event_comments(id),
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT TRUE, -- Visible uniquement en interne
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);

-- =====================================================
-- BASE DE CONNAISSANCE
-- =====================================================

-- Table des catégories de documents
CREATE TABLE knowledge_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES knowledge_categories(id),
    icon VARCHAR(50),
    color VARCHAR(7),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des publications
CREATE TABLE publications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(300) NOT NULL,
    summary TEXT,
    content TEXT,
    category_id UUID REFERENCES knowledge_categories(id),
    type VARCHAR(50), -- ARTICLE, GUIDE, REPORT, NEWS
    status VARCHAR(20) DEFAULT 'DRAFT', -- DRAFT, PUBLISHED, ARCHIVED
    publish_date DATE,
    expiry_date DATE,
    author VARCHAR(200),
    tags TEXT[],
    view_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE, -- Visible sur le site web public
    thumbnail_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Table des fiches techniques
CREATE TABLE technical_sheets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(300) NOT NULL,
    disease_name VARCHAR(200),
    animal_species TEXT[],
    symptoms TEXT,
    prevention TEXT,
    treatment TEXT,
    category_id UUID REFERENCES knowledge_categories(id),
    status VARCHAR(20) DEFAULT 'DRAFT',
    version VARCHAR(20),
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Table des documents/ressources
CREATE TABLE knowledge_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    publication_id UUID REFERENCES publications(id) ON DELETE CASCADE,
    technical_sheet_id UUID REFERENCES technical_sheets(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100),
    is_main_document BOOLEAN DEFAULT FALSE,
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

-- Table des notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- EMAIL, IN_APP, SMS, PUSH
    category VARCHAR(50), -- EVENT, TASK, SYSTEM, REMINDER
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(500), -- Lien vers la ressource concernée
    reference_type VARCHAR(50), -- EVENT, TASK, DOCUMENT
    reference_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    sent_at TIMESTAMP,
    is_sent BOOLEAN DEFAULT FALSE,
    send_error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des préférences de notification
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    email_enabled BOOLEAN DEFAULT TRUE,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT FALSE,
    push_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, category)
);

-- =====================================================
-- ANALYTICS ET RAPPORTS
-- =====================================================

-- Table des rapports sauvegardés
CREATE TABLE saved_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    parameters JSONB,
    query_definition JSONB,
    is_scheduled BOOLEAN DEFAULT FALSE,
    schedule_frequency VARCHAR(50),
    last_generated_at TIMESTAMP,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des logs d'audit
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEX POUR OPTIMISATION
-- =====================================================

-- Index utilisateurs
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_identifier ON users(identifier);
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_users_org_unit ON users(organizational_unit_id);
CREATE INDEX idx_users_status ON users(status);

-- Index événements
CREATE INDEX idx_events_code ON events(code);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_procedure ON events(procedure_id);
CREATE INDEX idx_events_region ON events(region_id);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_created_by ON events(created_by);
CREATE INDEX idx_events_assigned_to ON events(assigned_to);

-- Index tâches
CREATE INDEX idx_event_tasks_event ON event_tasks(event_id);
CREATE INDEX idx_event_tasks_status ON event_tasks(status);
CREATE INDEX idx_event_tasks_assigned ON event_tasks(assigned_to);

-- Index procédures
CREATE INDEX idx_procedures_type ON procedures(type);
CREATE INDEX idx_procedures_group ON procedures(group_id);
CREATE INDEX idx_procedures_active ON procedures(is_active);

-- Index notifications
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at);

-- Index audit
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- =====================================================
-- DONNÉES INITIALES
-- =====================================================

-- Insertion des langues
INSERT INTO languages (code, name, is_default) VALUES
('fr', 'Français', TRUE),
('en', 'English', FALSE);

-- Insertion du pays
INSERT INTO countries (code, name) VALUES
('CMR', 'Cameroun');

-- Insertion du fuseau horaire
INSERT INTO timezones (code, name, offset_hours) VALUES
('Africa/Douala', 'Afrique/Douala (UTC+1)', 1);

-- Insertion des rôles
INSERT INTO roles (code, name, description, level) VALUES
('USER_SIMPLE', 'Utilisateur simple (Agent de terrain)', 'Collecte de données sur le terrain', 1),
('CONTENT_MANAGER', 'Gestionnaire de contenu', 'Supervision et enrichissement des contenus', 2),
('VALIDATOR', 'Validateur', 'Contrôle qualité et validation des données', 3),
('MANAGER', 'Manager (Responsable régional/départemental)', 'Suivi global et pilotage des activités', 4),
('ADMIN', 'Administrateur', 'Administration fonctionnelle de l''application', 5),
('SUPER_ADMIN', 'Super administrateur', 'Contrôle total de la plateforme', 6);

-- Insertion des catégories d'événements
INSERT INTO event_categories (code, name, color, icon) VALUES
('ADMIN', 'Aspects administratifs', '#0066CC', 'folder'),
('BIOSECURITY', 'Biosécurité', '#00CC66', 'shield'),
('OUTBREAK', 'Gestion des foyers', '#CC0000', 'alert'),
('INVESTIGATION', 'Investigation', '#0066CC', 'search'),
('ISV', 'ISV', '#990066', 'clipboard'),
('LABORATORY', 'Laboratoire', '#00CC99', 'flask'),
('VACCINATION', 'Vaccination', '#00CC66', 'syringe'),
('WATCH', 'Veille informationnelle', '#0099CC', 'eye');

-- Insertion des types de documents
INSERT INTO document_types (code, name) VALUES
('ORDER_FORM', 'Bons de commande'),
('SPECIFICATIONS', 'Cahiers de charges'),
('MEETING_REPORT', 'Comptes-rendus de réunions'),
('AUDIENCE_REPORT', 'Compte rendu audience'),
('SAMPLE_FORM', 'Fiche d''expédition des échantillons'),
('NOTIFICATION_FORM', 'Fiche de notification'),
('SAMPLING_FORM', 'Fiche de prélèvement'),
('SERVICE_NOTES', 'Notes de services'),
('OBSERVATION_REPORT', 'Procès-verbal de constat'),
('INVESTIGATION_REPORT', 'Rapport d''investigation');

-- Insertion des étapes externes
INSERT INTO external_steps (code, name, description) VALUES
('MINSANTE', 'MINSANTE', 'Ministère de la santé public'),
('MINEPDED', 'MINEPDED', 'Ministère de l''Environnement, de la Protection de la Nature et du Développement Durable'),
('MINCOM', 'MINCOM', 'Ministère de la Communication'),
('LANAVET', 'LANAVET', 'Laboratoire d''analyse');

-- Insertion des types de champs de formulaire
INSERT INTO field_types (code, name, category) VALUES
('text', 'Champ texte', 'TEXT'),
('textarea', 'Zone de texte', 'TEXT'),
('number', 'Nombre', 'TEXT'),
('email', 'Email', 'TEXT'),
('phone', 'Téléphone', 'TEXT'),
('select', 'Liste déroulante', 'SELECTION'),
('multiselect', 'Liste à choix multiple', 'SELECTION'),
('radio', 'Boutons radio', 'SELECTION'),
('checkbox', 'Cases à cocher', 'SELECTION'),
('date', 'Date', 'DATE'),
('datetime', 'Date et heure', 'DATE'),
('time', 'Heure', 'DATE'),
('file', 'Fichier', 'FILE'),
('image', 'Image', 'FILE'),
('village', 'Village', 'LOCATION'),
('czv', 'CZV', 'LOCATION'),
('arrond', 'Arrondissement', 'LOCATION'),
('dept', 'Département', 'LOCATION'),
('region', 'Région', 'LOCATION'),
('gps', 'Coordonnées GPS', 'LOCATION');

-- Configuration système initiale
INSERT INTO system_configurations (key, value, value_type, description) VALUES
('SYSTEM_LAUNCH_DATE', '2024-07-01', 'DATE', 'Date officielle de lancement du système'),
('MAX_ATTACHMENT_SIZE_MB', '100', 'INTEGER', 'Taille maximale des fichiers (Mo)'),
('DEFAULT_COUNTRY', 'CMR', 'STRING', 'Pays par défaut'),
('DEFAULT_LANGUAGE', 'fr', 'STRING', 'Langue par défaut'),
('DEFAULT_TIMEZONE', 'Africa/Douala', 'STRING', 'Fuseau horaire par défaut'),
('DEFAULT_WORK_HOURS', '8', 'INTEGER', 'Heures de travail par défaut'),
('EMAIL_NOTIFICATIONS_ENABLED', 'true', 'BOOLEAN', 'Activer les notifications email'),
('PRIVATE_BOTTLENECKS', 'true', 'BOOLEAN', 'Goulets d''étranglement privés'),
('SHOW_EXTERNAL_COMMENTS', 'false', 'BOOLEAN', 'Afficher commentaires externes'),
('REQUIRE_DATA_VALIDATION', 'true', 'BOOLEAN', 'Validation des données requise'),
('SHOW_EXTERNAL_DURATIONS', 'false', 'BOOLEAN', 'Afficher durées externes');
```

---

## 4. Architecture Frontend React

### 4.1 Structure du Projet Frontend

```
ccousa-app-frontend/
├── public/
│   ├── favicon.ico
│   ├── logo.svg
│   └── assets/
├── src/
│   ├── api/                          # Services API
│   │   ├── axios.config.ts
│   │   ├── auth.api.ts
│   │   ├── users.api.ts
│   │   ├── events.api.ts
│   │   ├── procedures.api.ts
│   │   ├── knowledge.api.ts
│   │   ├── notifications.api.ts
│   │   └── config.api.ts
│   │
│   ├── assets/                       # Ressources statiques
│   │   ├── images/
│   │   ├── icons/
│   │   └── styles/
│   │       ├── global.css
│   │       ├── variables.css
│   │       └── themes/
│   │
│   ├── components/                   # Composants réutilisables
│   │   ├── common/
│   │   │   ├── Button/
│   │   │   ├── Input/
│   │   │   ├── Select/
│   │   │   ├── Modal/
│   │   │   ├── Table/
│   │   │   ├── Card/
│   │   │   ├── Loader/
│   │   │   ├── Alert/
│   │   │   ├── Badge/
│   │   │   ├── Pagination/
│   │   │   └── FileUpload/
│   │   │
│   │   ├── layout/
│   │   │   ├── Header/
│   │   │   ├── Sidebar/
│   │   │   ├── Footer/
│   │   │   ├── MainLayout/
│   │   │   └── AuthLayout/
│   │   │
│   │   ├── forms/
│   │   │   ├── DynamicForm/
│   │   │   ├── FormField/
│   │   │   ├── FormSection/
│   │   │   └── FormBuilder/
│   │   │
│   │   ├── charts/
│   │   │   ├── BarChart/
│   │   │   ├── LineChart/
│   │   │   ├── PieChart/
│   │   │   └── MapChart/
│   │   │
│   │   └── specific/
│   │       ├── EventCard/
│   │       ├── ProcedureTimeline/
│   │       ├── UserAvatar/
│   │       └── NotificationBell/
│   │
│   ├── contexts/                     # Contextes React
│   │   ├── AuthContext.tsx
│   │   ├── ThemeContext.tsx
│   │   ├── NotificationContext.tsx
│   │   └── LanguageContext.tsx
│   │
│   ├── hooks/                        # Hooks personnalisés
│   │   ├── useAuth.ts
│   │   ├── useApi.ts
│   │   ├── useDebounce.ts
│   │   ├── useLocalStorage.ts
│   │   ├── usePagination.ts
│   │   └── usePermissions.ts
│   │
│   ├── pages/                        # Pages de l'application
│   │   ├── auth/
│   │   │   ├── Login/
│   │   │   ├── ForgotPassword/
│   │   │   └── ResetPassword/
│   │   │
│   │   ├── dashboard/
│   │   │   ├── Dashboard.tsx
│   │   │   └── components/
│   │   │
│   │   ├── events/
│   │   │   ├── EventsList/
│   │   │   ├── EventDetail/
│   │   │   ├── CreateEvent/
│   │   │   └── components/
│   │   │
│   │   ├── procedures/
│   │   │   ├── ProceduresList/
│   │   │   ├── ProcedureDetail/
│   │   │   ├── CreateProcedure/
│   │   │   └── components/
│   │   │
│   │   ├── users/
│   │   │   ├── UsersList/
│   │   │   ├── UserDetail/
│   │   │   ├── CreateUser/
│   │   │   ├── Groups/
│   │   │   └── components/
│   │   │
│   │   ├── knowledge/
│   │   │   ├── Publications/
│   │   │   ├── Documents/
│   │   │   ├── TechnicalSheets/
│   │   │   └── components/
│   │   │
│   │   ├── settings/
│   │   │   ├── GeneralConfig/
│   │   │   ├── WorkSchedules/
│   │   │   ├── DocumentTypes/
│   │   │   ├── ExternalSteps/
│   │   │   ├── Categories/
│   │   │   └── components/
│   │   │
│   │   ├── forms/
│   │   │   ├── FormsList/
│   │   │   ├── FormBuilder/
│   │   │   └── components/
│   │   │
│   │   ├── analytics/
│   │   │   ├── Reports/
│   │   │   ├── Statistics/
│   │   │   └── components/
│   │   │
│   │   └── profile/
│   │       ├── MyProfile/
│   │       └── Settings/
│   │
│   ├── routes/                       # Configuration des routes
│   │   ├── index.tsx
│   │   ├── PrivateRoute.tsx
│   │   └── routes.config.ts
│   │
│   ├── store/                        # État global (Redux/Zustand)
│   │   ├── index.ts
│   │   ├── slices/
│   │   │   ├── authSlice.ts
│   │   │   ├── eventsSlice.ts
│   │   │   ├── proceduresSlice.ts
│   │   │   └── notificationsSlice.ts
│   │   └── middleware/
│   │
│   ├── types/                        # Types TypeScript
│   │   ├── auth.types.ts
│   │   ├── user.types.ts
│   │   ├── event.types.ts
│   │   ├── procedure.types.ts
│   │   ├── form.types.ts
│   │   └── api.types.ts
│   │
│   ├── utils/                        # Utilitaires
│   │   ├── constants.ts
│   │   ├── helpers.ts
│   │   ├── validators.ts
│   │   ├── formatters.ts
│   │   └── permissions.ts
│   │
│   ├── i18n/                         # Internationalisation
│   │   ├── index.ts
│   │   ├── fr.json
│   │   └── en.json
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
│
├── .env
├── .env.development
├── .env.production
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

### 4.2 Principales Dépendances Frontend

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@reduxjs/toolkit": "^2.0.0",
    "react-redux": "^9.0.0",
    "axios": "^1.6.0",
    "react-hook-form": "^7.48.0",
    "@hookform/resolvers": "^3.3.0",
    "zod": "^3.22.0",
    "react-query": "^5.0.0",
    "recharts": "^2.10.0",
    "leaflet": "^1.9.0",
    "react-leaflet": "^4.2.0",
    "date-fns": "^2.30.0",
    "react-datepicker": "^4.24.0",
    "react-select": "^5.8.0",
    "react-table": "^7.8.0",
    "react-toastify": "^9.1.0",
    "framer-motion": "^10.16.0",
    "lucide-react": "^0.294.0",
    "tailwindcss": "^3.3.0",
    "i18next": "^23.7.0",
    "react-i18next": "^13.5.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "eslint": "^8.54.0",
    "prettier": "^3.1.0",
    "@testing-library/react": "^14.1.0",
    "vitest": "^1.0.0"
  }
}
```

---

## 5. Configuration Docker

### 5.1 Structure Docker

```
ccousa-app/
├── docker/
│   ├── frontend/
│   │   └── Dockerfile
│   ├── services/
│   │   ├── auth/
│   │   │   └── Dockerfile
│   │   ├── users/
│   │   │   └── Dockerfile
│   │   ├── events/
│   │   │   └── Dockerfile
│   │   ├── procedures/
│   │   │   └── Dockerfile
│   │   ├── knowledge/
│   │   │   └── Dockerfile
│   │   ├── notifications/
│   │   │   └── Dockerfile
│   │   ├── config/
│   │   │   └── Dockerfile
│   │   ├── forms/
│   │   │   └── Dockerfile
│   │   └── analytics/
│   │       └── Dockerfile
│   ├── nginx/
│   │   ├── Dockerfile
│   │   └── nginx.conf
│   └── postgres/
│       └── init.sql
├── docker-compose.yml
├── docker-compose.dev.yml
└── docker-compose.prod.yml
```

### 5.2 Docker Compose Principal

```yaml
# docker-compose.yml
version: '3.8'

services:
  # ============================================
  # BASE DE DONNÉES
  # ============================================
  postgres:
    image: postgres:15-alpine
    container_name: ccousa_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ccousa_db
      POSTGRES_USER: ${DB_USER:-ccousa_user}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-ccousa_password}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    networks:
      - ccousa_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-ccousa_user}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ============================================
  # CACHE REDIS
  # ============================================
  redis:
    image: redis:7-alpine
    container_name: ccousa_redis
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    networks:
      - ccousa_network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ============================================
  # MESSAGE QUEUE
  # ============================================
  rabbitmq:
    image: rabbitmq:3-management-alpine
    container_name: ccousa_rabbitmq
    restart: unless-stopped
    environment:
      RABBITMQ_DEFAULT_USER: ${RABBITMQ_USER:-admin}
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD:-admin123}
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    ports:
      - "5672:5672"
      - "15672:15672"
    networks:
      - ccousa_network
    healthcheck:
      test: rabbitmq-diagnostics -q ping
      interval: 30s
      timeout: 10s
      retries: 5

  # ============================================
  # API GATEWAY
  # ============================================
  api-gateway:
    build:
      context: ./services/api-gateway
      dockerfile: Dockerfile
    container_name: ccousa_api_gateway
    restart: unless-stopped
    environment:
      NODE_ENV: ${NODE_ENV:-development}
      PORT: 8000
      JWT_SECRET: ${JWT_SECRET}
      REDIS_URL: redis://redis:6379
    ports:
      - "8000:8000"
    depends_on:
      - redis
      - auth-service
    networks:
      - ccousa_network

  # ============================================
  # MICROSERVICES
  # ============================================
  
  # Auth Service
  auth-service:
    build:
      context: ./services/auth-service
      dockerfile: Dockerfile
    container_name: ccousa_auth_service
    restart: unless-stopped
    environment:
      NODE_ENV: ${NODE_ENV:-development}
      PORT: 3001
      DATABASE_URL: postgresql://${DB_USER:-ccousa_user}:${DB_PASSWORD:-ccousa_password}@postgres:5432/ccousa_db
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: ${JWT_EXPIRES_IN:-24h}
      RABBITMQ_URL: amqp://${RABBITMQ_USER:-admin}:${RABBITMQ_PASSWORD:-admin123}@rabbitmq:5672
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - ccousa_network

  # Users Service
  users-service:
    build:
      context: ./services/users-service
      dockerfile: Dockerfile
    container_name: ccousa_users_service
    restart: unless-stopped
    environment:
      NODE_ENV: ${NODE_ENV:-development}
      PORT: 3002
      DATABASE_URL: postgresql://${DB_USER:-ccousa_user}:${DB_PASSWORD:-ccousa_password}@postgres:5432/ccousa_db
      REDIS_URL: redis://redis:6379
      RABBITMQ_URL: amqp://${RABBITMQ_USER:-admin}:${RABBITMQ_PASSWORD:-admin123}@rabbitmq:5672
    ports:
      - "3002:3002"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - ccousa_network

  # Events Service
  events-service:
    build:
      context: ./services/events-service
      dockerfile: Dockerfile
    container_name: ccousa_events_service
    restart: unless-stopped
    environment:
      NODE_ENV: ${NODE_ENV:-development}
      PORT: 3003
      DATABASE_URL: postgresql://${DB_USER:-ccousa_user}:${DB_PASSWORD:-ccousa_password}@postgres:5432/ccousa_db
      REDIS_URL: redis://redis:6379
      RABBITMQ_URL: amqp://${RABBITMQ_USER:-admin}:${RABBITMQ_PASSWORD:-admin123}@rabbitmq:5672
    ports:
      - "3003:3003"
    volumes:
      - uploads_data:/app/uploads
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - ccousa_network

  # Procedures Service
  procedures-service:
    build:
      context: ./services/procedures-service
      dockerfile: Dockerfile
    container_name: ccousa_procedures_service
    restart: unless-stopped
    environment:
      NODE_ENV: ${NODE_ENV:-development}
      PORT: 3004
      DATABASE_URL: postgresql://${DB_USER:-ccousa_user}:${DB_PASSWORD:-ccousa_password}@postgres:5432/ccousa_db
      REDIS_URL: redis://redis:6379
      RABBITMQ_URL: amqp://${RABBITMQ_USER:-admin}:${RABBITMQ_PASSWORD:-admin123}@rabbitmq:5672
    ports:
      - "3004:3004"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - ccousa_network

  # Knowledge Service
  knowledge-service:
    build:
      context: ./services/knowledge-service
      dockerfile: Dockerfile
    container_name: ccousa_knowledge_service
    restart: unless-stopped
    environment:
      NODE_ENV: ${NODE_ENV:-development}
      PORT: 3005
      DATABASE_URL: postgresql://${DB_USER:-ccousa_user}:${DB_PASSWORD:-ccousa_password}@postgres:5432/ccousa_db
      REDIS_URL: redis://redis:6379
    ports:
      - "3005:3005"
    volumes:
      - documents_data:/app/documents
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - ccousa_network

  # Notifications Service
  notifications-service:
    build:
      context: ./services/notifications-service
      dockerfile: Dockerfile
    container_name: ccousa_notifications_service
    restart: unless-stopped
    environment:
      NODE_ENV: ${NODE_ENV:-development}
      PORT: 3006
      DATABASE_URL: postgresql://${DB_USER:-ccousa_user}:${DB_PASSWORD:-ccousa_password}@postgres:5432/ccousa_db
      REDIS_URL: redis://redis:6379
      RABBITMQ_URL: amqp://${RABBITMQ_USER:-admin}:${RABBITMQ_PASSWORD:-admin123}@rabbitmq:5672
      SMTP_HOST: ${SMTP_HOST}
      SMTP_PORT: ${SMTP_PORT:-587}
      SMTP_USER: ${SMTP_USER}
      SMTP_PASSWORD: ${SMTP_PASSWORD}
    ports:
      - "3006:3006"
    depends_on:
      postgres:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    networks:
      - ccousa_network

  # Config Service
  config-service:
    build:
      context: ./services/config-service
      dockerfile: Dockerfile
    container_name: ccousa_config_service
    restart: unless-stopped
    environment:
      NODE_ENV: ${NODE_ENV:-development}
      PORT: 3007
      DATABASE_URL: postgresql://${DB_USER:-ccousa_user}:${DB_PASSWORD:-ccousa_password}@postgres:5432/ccousa_db
      REDIS_URL: redis://redis:6379
    ports:
      - "3007:3007"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - ccousa_network

  # Forms Service
  forms-service:
    build:
      context: ./services/forms-service
      dockerfile: Dockerfile
    container_name: ccousa_forms_service
    restart: unless-stopped
    environment:
      NODE_ENV: ${NODE_ENV:-development}
      PORT: 3008
      DATABASE_URL: postgresql://${DB_USER:-ccousa_user}:${DB_PASSWORD:-ccousa_password}@postgres:5432/ccousa_db
      REDIS_URL: redis://redis:6379
    ports:
      - "3008:3008"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - ccousa_network

  # Analytics Service
  analytics-service:
    build:
      context: ./services/analytics-service
      dockerfile: Dockerfile
    container_name: ccousa_analytics_service
    restart: unless-stopped
    environment:
      NODE_ENV: ${NODE_ENV:-development}
      PORT: 3009
      DATABASE_URL: postgresql://${DB_USER:-ccousa_user}:${DB_PASSWORD:-ccousa_password}@postgres:5432/ccousa_db
      REDIS_URL: redis://redis:6379
    ports:
      - "3009:3009"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - ccousa_network

  # ============================================
  # FRONTEND
  # ============================================
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_API_URL: ${VITE_API_URL:-http://localhost:8000}
    container_name: ccousa_frontend
    restart: unless-stopped
    ports:
      - "3000:80"
    depends_on:
      - api-gateway
    networks:
      - ccousa_network

  # ============================================
  # NGINX (Load Balancer / Reverse Proxy)
  # ============================================
  nginx:
    image: nginx:alpine
    container_name: ccousa_nginx
    restart: unless-stopped
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./docker/nginx/ssl:/etc/nginx/ssl:ro
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - frontend
      - api-gateway
    networks:
      - ccousa_network

# ============================================
# VOLUMES
# ============================================
volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  rabbitmq_data:
    driver: local
  uploads_data:
    driver: local
  documents_data:
    driver: local

# ============================================
# NETWORKS
# ============================================
networks:
  ccousa_network:
    driver: bridge
```

### 5.3 Dockerfile Microservice Type

```dockerfile
# services/auth-service/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le code source
COPY . .

# Build TypeScript
RUN npm run build

# ============================================
# Production Stage
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001

# Copier les dépendances et le build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Changer les permissions
RUN chown -R nodeuser:nodejs /app

USER nodeuser

EXPOSE 3001

CMD ["node", "dist/index.js"]
```

### 5.4 Dockerfile Frontend

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Arguments de build
ARG VITE_API_URL

# Variables d'environnement pour le build
ENV VITE_API_URL=$VITE_API_URL

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci

# Copier le code source
COPY . .

# Build de production
RUN npm run build

# ============================================
# Production Stage avec Nginx
# ============================================
FROM nginx:alpine AS production

# Copier la configuration nginx
COPY docker/nginx/frontend.conf /etc/nginx/conf.d/default.conf

# Copier les fichiers buildés
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

## 6. API Gateway et Communication

### 6.1 Configuration API Gateway

```typescript
// services/api-gateway/src/config/routes.ts
export const serviceRoutes = {
  auth: {
    target: 'http://auth-service:3001',
    pathRewrite: { '^/api/auth': '/api/auth' }
  },
  users: {
    target: 'http://users-service:3002',
    pathRewrite: { '^/api/users': '/api/users' }
  },
  events: {
    target: 'http://events-service:3003',
    pathRewrite: { '^/api/events': '/api/events' }
  },
  procedures: {
    target: 'http://procedures-service:3004',
    pathRewrite: { '^/api/procedures': '/api/procedures' }
  },
  knowledge: {
    target: 'http://knowledge-service:3005',
    pathRewrite: { '^/api/knowledge': '/api/knowledge' }
  },
  notifications: {
    target: 'http://notifications-service:3006',
    pathRewrite: { '^/api/notifications': '/api/notifications' }
  },
  config: {
    target: 'http://config-service:3007',
    pathRewrite: { '^/api/config': '/api/config' }
  },
  forms: {
    target: 'http://forms-service:3008',
    pathRewrite: { '^/api/forms': '/api/forms' }
  },
  analytics: {
    target: 'http://analytics-service:3009',
    pathRewrite: { '^/api/analytics': '/api/analytics' }
  }
};
```

### 6.2 Communication Inter-Services (RabbitMQ)

```typescript
// shared/messaging/events.ts
export const QUEUE_NAMES = {
  EVENTS: 'events_queue',
  NOTIFICATIONS: 'notifications_queue',
  ANALYTICS: 'analytics_queue',
  AUDIT: 'audit_queue'
};

export const EVENT_TYPES = {
  // Événements utilisateurs
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  
  // Événements sanitaires
  EVENT_CREATED: 'event.created',
  EVENT_UPDATED: 'event.updated',
  EVENT_STATUS_CHANGED: 'event.status_changed',
  EVENT_VALIDATED: 'event.validated',
  EVENT_REJECTED: 'event.rejected',
  EVENT_CLOSED: 'event.closed',
  
  // Tâches
  TASK_ASSIGNED: 'task.assigned',
  TASK_COMPLETED: 'task.completed',
  TASK_OVERDUE: 'task.overdue',
  
  // Notifications
  NOTIFICATION_SEND: 'notification.send',
  EMAIL_SEND: 'email.send'
};
```

---

## 7. Sécurité et Authentification

### 7.1 JWT et Refresh Tokens

```typescript
// services/auth-service/src/utils/jwt.ts
import jwt from 'jsonwebtoken';

interface TokenPayload {
  userId: string;
  email: string;
  roleId: string;
  roleLevel: number;
  permissions: string[];
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: '7d'
  });
};
```

### 7.2 Middleware d'Authentification

```typescript
// services/api-gateway/src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Redis } from 'ioredis';

export const authMiddleware = (redis: Redis) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ message: 'Token manquant' });
      }
      
      // Vérifier si le token est blacklisté
      const isBlacklisted = await redis.get(`blacklist:${token}`);
      if (isBlacklisted) {
        return res.status(401).json({ message: 'Token invalide' });
      }
      
      // Vérifier le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      req.user = decoded;
      
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Token invalide' });
    }
  };
};
```

### 7.3 Contrôle des Permissions

```typescript
// shared/middleware/permissions.middleware.ts
import { Request, Response, NextFunction } from 'express';

export const requirePermission = (...permissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userPermissions = req.user?.permissions || [];
    
    const hasPermission = permissions.some(p => 
      userPermissions.includes(p) || userPermissions.includes('*')
    );
    
    if (!hasPermission) {
      return res.status(403).json({ 
        message: 'Vous n\'avez pas les permissions nécessaires' 
      });
    }
    
    next();
  };
};

// Utilisation
router.delete('/events/:id', 
  requirePermission('events.delete', 'events.admin'),
  eventController.delete
);
```

---

## 8. Plan de Développement

### 8.1 Phases de Développement

#### Phase 1 : Infrastructure (2-3 semaines)
- [ ] Configuration Docker et Docker Compose
- [ ] Mise en place de PostgreSQL avec le schéma initial
- [ ] Configuration Redis et RabbitMQ
- [ ] API Gateway basique
- [ ] CI/CD pipeline

#### Phase 2 : Authentification et Utilisateurs (2-3 semaines)
- [ ] Auth Service complet
- [ ] Users Service complet
- [ ] Frontend : Pages de connexion
- [ ] Gestion des rôles et permissions
- [ ] Tests unitaires et d'intégration

#### Phase 3 : Configuration et Paramétrage (2 semaines)
- [ ] Config Service
- [ ] Frontend : Module Configuration
- [ ] Types de documents, catégories, étapes externes
- [ ] Horaires de travail

#### Phase 4 : Procédures (3-4 semaines)
- [ ] Procedures Service
- [ ] Frontend : Création et gestion des procédures
- [ ] Système d'étapes et workflow
- [ ] Déclencheurs automatiques

#### Phase 5 : Formulaires Dynamiques (2-3 semaines)
- [ ] Forms Service
- [ ] Frontend : Form Builder
- [ ] Rendu dynamique des formulaires
- [ ] Validation et calculs

#### Phase 6 : Gestion des Événements (4-5 semaines)
- [ ] Events Service
- [ ] Frontend : Module complet des événements
- [ ] Attribution des tâches
- [ ] Suivi et validation
- [ ] Pièces jointes

#### Phase 7 : Tableau de Bord et Analytics (2-3 semaines)
- [ ] Analytics Service
- [ ] Frontend : Dashboard
- [ ] Graphiques et statistiques
- [ ] Rapports exportables

#### Phase 8 : Base de Connaissance (2 semaines)
- [ ] Knowledge Service
- [ ] Frontend : Publications et documents
- [ ] Fiches techniques

#### Phase 9 : Notifications (1-2 semaines)
- [ ] Notifications Service
- [ ] Intégration email
- [ ] Notifications in-app temps réel

#### Phase 10 : Tests et Optimisation (2-3 semaines)
- [ ] Tests end-to-end
- [ ] Optimisation des performances
- [ ] Documentation
- [ ] Formation utilisateurs

### 8.2 Estimation Totale

| Phase | Durée Estimée |
|-------|---------------|
| Phase 1 : Infrastructure | 2-3 semaines |
| Phase 2 : Auth & Users | 2-3 semaines |
| Phase 3 : Configuration | 2 semaines |
| Phase 4 : Procédures | 3-4 semaines |
| Phase 5 : Formulaires | 2-3 semaines |
| Phase 6 : Événements | 4-5 semaines |
| Phase 7 : Dashboard | 2-3 semaines |
| Phase 8 : Knowledge | 2 semaines |
| Phase 9 : Notifications | 1-2 semaines |
| Phase 10 : Tests | 2-3 semaines |
| **TOTAL** | **22-31 semaines** |

---

## Annexes

### A. Variables d'Environnement (.env)

```env
# Application
NODE_ENV=development
APP_NAME=CCOUSA-APP

# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=ccousa_db
DB_USER=ccousa_user
DB_PASSWORD=your_secure_password

# Redis
REDIS_URL=redis://redis:6379

# RabbitMQ
RABBITMQ_USER=admin
RABBITMQ_PASSWORD=admin123

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_EXPIRES_IN=24h

# SMTP
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@ccousa-app.cm
SMTP_PASSWORD=smtp_password

# Frontend
VITE_API_URL=http://localhost:8000
```

### B. Scripts de Déploiement

```bash
#!/bin/bash
# deploy.sh

# Build des images
docker-compose build

# Démarrage des services
docker-compose up -d

# Vérification des services
docker-compose ps

# Logs
docker-compose logs -f
```

---

**Document préparé pour CCOUSA-APP**
**Version 1.0 - Janvier 2026**
