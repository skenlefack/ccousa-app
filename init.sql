-- =====================================================
-- CCOUSA-APP - Script d'Initialisation PostgreSQL
-- Version 1.0 - Mai 2025
-- Gestion des événements de santé animale au Cameroun
-- =====================================================

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TABLES DE RÉFÉRENCE
-- =====================================================

-- Table des pays
CREATE TABLE IF NOT EXISTS countries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(3) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des langues
CREATE TABLE IF NOT EXISTS languages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(5) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des fuseaux horaires
CREATE TABLE IF NOT EXISTS timezones (
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
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    level INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- Table des permissions
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    module VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table de liaison rôles-permissions
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, permission_id)
);

-- Table des groupes
CREATE TABLE IF NOT EXISTS groups (
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

-- Table des unités organisationnelles
CREATE TABLE IF NOT EXISTS organizational_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    type VARCHAR(50) NOT NULL,
    parent_id UUID REFERENCES organizational_units(id),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identifier VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    gender VARCHAR(10),
    phone VARCHAR(20),
    photo_url VARCHAR(500),
    role_id UUID NOT NULL REFERENCES roles(id),
    organizational_unit_id UUID REFERENCES organizational_units(id),
    supervisor_id UUID REFERENCES users(id),
    function VARCHAR(150),
    default_language_id UUID REFERENCES languages(id),
    default_timezone_id UUID REFERENCES timezones(id),
    work_hours_per_day INTEGER DEFAULT 8,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    last_login_at TIMESTAMP,
    password_changed_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- Table des groupes utilisateurs
CREATE TABLE IF NOT EXISTS user_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, group_id)
);

-- Table des sessions utilisateurs
CREATE TABLE IF NOT EXISTS user_sessions (
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

CREATE TABLE IF NOT EXISTS system_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) NOT NULL UNIQUE,
    value TEXT,
    value_type VARCHAR(20) DEFAULT 'STRING',
    description TEXT,
    is_editable BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id)
);

-- Table des horaires de travail
CREATE TABLE IF NOT EXISTS work_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
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
CREATE TABLE IF NOT EXISTS work_schedule_days (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_schedule_id UUID NOT NULL REFERENCES work_schedules(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_duration INTEGER DEFAULT 0,
    is_working_day BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PARAMÉTRAGE DES PROCÉDURES
-- =====================================================

-- Table des types de documents
CREATE TABLE IF NOT EXISTS document_types (
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
CREATE TABLE IF NOT EXISTS external_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    organization_name VARCHAR(200),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Table des catégories d'événements
CREATE TABLE IF NOT EXISTS event_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    color VARCHAR(7) DEFAULT '#0066CC',
    icon VARCHAR(50) DEFAULT 'folder',
    language_id UUID REFERENCES languages(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Table des groupes de procédures
CREATE TABLE IF NOT EXISTS procedure_groups (
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
CREATE TABLE IF NOT EXISTS procedures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    group_id UUID REFERENCES procedure_groups(id),
    category_id UUID REFERENCES event_categories(id),
    is_checklist BOOLEAN DEFAULT FALSE,
    keywords TEXT[],
    trigger_type VARCHAR(50),
    trigger_frequency VARCHAR(50),
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
CREATE TABLE IF NOT EXISTS procedure_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    procedure_id UUID NOT NULL REFERENCES procedures(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    step_order INTEGER NOT NULL,
    step_type VARCHAR(50) NOT NULL,
    is_external BOOLEAN DEFAULT FALSE,
    external_step_id UUID REFERENCES external_steps(id),
    send_type VARCHAR(50) DEFAULT 'AUTOMATIC',
    duration_value INTEGER,
    duration_unit VARCHAR(20) DEFAULT 'DAYS',
    form_id UUID,
    is_visible_externally BOOLEAN DEFAULT FALSE,
    is_required BOOLEAN DEFAULT TRUE,
    can_skip BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- FORMULAIRES DYNAMIQUES
-- =====================================================

CREATE TABLE IF NOT EXISTS forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'PARAMETER',
    language_id UUID REFERENCES languages(id),
    layout_columns INTEGER DEFAULT 2,
    is_active BOOLEAN DEFAULT TRUE,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS form_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    section_order INTEGER NOT NULL,
    columns_layout VARCHAR(20) DEFAULT '6+6',
    is_collapsible BOOLEAN DEFAULT FALSE,
    is_collapsed_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS field_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS form_fields (
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
    column_span INTEGER DEFAULT 6,
    is_required BOOLEAN DEFAULT FALSE,
    is_readonly BOOLEAN DEFAULT FALSE,
    is_hidden BOOLEAN DEFAULT FALSE,
    validation_rules JSONB,
    options JSONB,
    conditional_logic JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- GESTION DES ÉVÉNEMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    procedure_id UUID NOT NULL REFERENCES procedures(id),
    category_id UUID REFERENCES event_categories(id),
    status VARCHAR(50) DEFAULT 'OPEN',
    priority VARCHAR(20) DEFAULT 'NORMAL',
    region_id UUID REFERENCES organizational_units(id),
    department_id UUID REFERENCES organizational_units(id),
    district_id UUID REFERENCES organizational_units(id),
    village VARCHAR(200),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    event_date DATE NOT NULL,
    notification_date DATE,
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP,
    closed_date TIMESTAMP,
    animal_species TEXT[],
    affected_count INTEGER,
    dead_count INTEGER,
    suspected_disease VARCHAR(200),
    confirmed_disease VARCHAR(200),
    current_step_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    is_urgent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    assigned_to UUID REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS event_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    procedure_step_id UUID REFERENCES procedure_steps(id),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    task_order INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    start_date TIMESTAMP,
    due_date TIMESTAMP,
    completed_date TIMESTAMP,
    actual_duration INTEGER,
    assigned_to UUID REFERENCES users(id),
    assigned_group UUID REFERENCES groups(id),
    validated_by UUID REFERENCES users(id),
    validated_at TIMESTAMP,
    validation_comment TEXT,
    rejection_reason TEXT,
    form_id UUID REFERENCES forms(id),
    form_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attachments (
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
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS event_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    event_task_id UUID REFERENCES event_tasks(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    comment TEXT,
    performed_by UUID REFERENCES users(id),
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45)
);

CREATE TABLE IF NOT EXISTS event_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    event_task_id UUID REFERENCES event_tasks(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES event_comments(id),
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);

-- =====================================================
-- BASE DE CONNAISSANCE
-- =====================================================

CREATE TABLE IF NOT EXISTS knowledge_categories (
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

CREATE TABLE IF NOT EXISTS publications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(300) NOT NULL,
    summary TEXT,
    content TEXT,
    category_id UUID REFERENCES knowledge_categories(id),
    type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'DRAFT',
    publish_date DATE,
    expiry_date DATE,
    author VARCHAR(200),
    tags TEXT[],
    view_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    thumbnail_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS technical_sheets (
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

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    category VARCHAR(50),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(500),
    reference_type VARCHAR(50),
    reference_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    sent_at TIMESTAMP,
    is_sent BOOLEAN DEFAULT FALSE,
    send_error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_preferences (
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
-- AUDIT LOGS
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_logs (
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

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_identifier ON users(identifier);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

CREATE INDEX IF NOT EXISTS idx_events_code ON events(code);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_procedure ON events(procedure_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);

CREATE INDEX IF NOT EXISTS idx_event_tasks_event ON event_tasks(event_id);
CREATE INDEX IF NOT EXISTS idx_event_tasks_status ON event_tasks(status);

CREATE INDEX IF NOT EXISTS idx_procedures_type ON procedures(type);
CREATE INDEX IF NOT EXISTS idx_procedures_active ON procedures(is_active);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- =====================================================
-- DONNÉES INITIALES
-- =====================================================

-- Langues
INSERT INTO languages (code, name, is_default) VALUES
('fr', 'Français', TRUE),
('en', 'English', FALSE)
ON CONFLICT (code) DO NOTHING;

-- Pays
INSERT INTO countries (code, name) VALUES
('CMR', 'Cameroun')
ON CONFLICT (code) DO NOTHING;

-- Fuseau horaire
INSERT INTO timezones (code, name, offset_hours) VALUES
('Africa/Douala', 'Afrique/Douala (UTC+1)', 1)
ON CONFLICT (code) DO NOTHING;

-- Rôles
INSERT INTO roles (code, name, description, level) VALUES
('USER_SIMPLE', 'Utilisateur simple (Agent de terrain)', 'Collecte de données sur le terrain', 1),
('CONTENT_MANAGER', 'Gestionnaire de contenu', 'Supervision et enrichissement des contenus', 2),
('VALIDATOR', 'Validateur', 'Contrôle qualité et validation des données', 3),
('MANAGER', 'Manager (Responsable régional/départemental)', 'Suivi global et pilotage des activités', 4),
('ADMIN', 'Administrateur', 'Administration fonctionnelle de l''application', 5),
('SUPER_ADMIN', 'Super administrateur', 'Contrôle total de la plateforme', 6)
ON CONFLICT (code) DO NOTHING;

-- Catégories d'événements
INSERT INTO event_categories (code, name, color, icon) VALUES
('ADMIN', 'Aspects administratifs', '#0066CC', 'folder'),
('BIOSECURITY', 'Biosécurité', '#00CC66', 'shield'),
('OUTBREAK', 'Gestion des foyers', '#CC0000', 'alert-triangle'),
('INVESTIGATION', 'Investigation', '#0066CC', 'search'),
('ISV', 'ISV', '#990066', 'clipboard'),
('LABORATORY', 'Laboratoire', '#00CC99', 'flask-conical'),
('VACCINATION', 'Vaccination', '#00CC66', 'syringe'),
('WATCH', 'Veille informationnelle', '#0099CC', 'eye')
ON CONFLICT (code) DO NOTHING;

-- Types de documents
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
('INVESTIGATION_REPORT', 'Rapport d''investigation')
ON CONFLICT (code) DO NOTHING;

-- Étapes externes
INSERT INTO external_steps (code, name, description) VALUES
('MINSANTE', 'MINSANTE', 'Ministère de la santé publique'),
('MINEPDED', 'MINEPDED', 'Ministère de l''Environnement, de la Protection de la Nature et du Développement Durable'),
('MINCOM', 'MINCOM', 'Ministère de la Communication'),
('LANAVET', 'LANAVET', 'Laboratoire d''analyse vétérinaire')
ON CONFLICT (code) DO NOTHING;

-- Types de champs de formulaire
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
('gps', 'Coordonnées GPS', 'LOCATION')
ON CONFLICT (code) DO NOTHING;

-- Configuration système
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
('REQUIRE_DATA_VALIDATION', 'true', 'BOOLEAN', 'Validation des données requise')
ON CONFLICT (key) DO NOTHING;

-- Créer un utilisateur admin par défaut (mot de passe: Admin@123)
-- Le hash correspond à 'Admin@123' avec bcrypt
INSERT INTO users (identifier, email, password_hash, first_name, last_name, role_id, status)
SELECT 
    'ADMIN001',
    'admin@ccousa-app.cm',
    '$2b$10$rQZ5qKz.YNqKz5qKz.YNqKrQZ5qKz.YNqKz5qKz.YNqK',
    'Super',
    'Admin',
    (SELECT id FROM roles WHERE code = 'SUPER_ADMIN'),
    'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@ccousa-app.cm');

-- =====================================================
-- PROCEDURE EXECUTIONS MODULE
-- =====================================================

-- Ajout colonnes manquantes à procedure_groups
ALTER TABLE procedure_groups
  ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#3B82F6',
  ADD COLUMN IF NOT EXISTS icon VARCHAR(50),
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES procedure_groups(id);

-- Ajout colonnes manquantes à procedures
ALTER TABLE procedures
  ADD COLUMN IF NOT EXISTS trigger_config JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS created_by_id UUID REFERENCES users(id);

-- Ajout colonnes manquantes à procedure_steps
ALTER TABLE procedure_steps
  ADD COLUMN IF NOT EXISTS duration_hours DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS is_optional BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS assignee_type VARCHAR(20) DEFAULT 'USER',
  ADD COLUMN IF NOT EXISTS assignee_id UUID,
  ADD COLUMN IF NOT EXISTS required_document_ids UUID[],
  ADD COLUMN IF NOT EXISTS step_number INTEGER;

-- Table des exécutions de procédures
CREATE TABLE IF NOT EXISTS procedure_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    procedure_id UUID NOT NULL REFERENCES procedures(id),
    event_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    current_step_number INTEGER DEFAULT 1,
    started_by_id UUID REFERENCES users(id),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    cancel_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des exécutions d'étapes
CREATE TABLE IF NOT EXISTS step_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_id UUID NOT NULL REFERENCES procedure_executions(id) ON DELETE CASCADE,
    step_id UUID NOT NULL REFERENCES procedure_steps(id),
    step_number INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    assigned_to_id UUID REFERENCES users(id),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    completed_by_id UUID REFERENCES users(id),
    notes TEXT,
    form_submission_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des pièces jointes d'étapes
CREATE TABLE IF NOT EXISTS step_execution_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    step_execution_id UUID NOT NULL REFERENCES step_executions(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    url TEXT NOT NULL,
    uploaded_by_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table timeline des exécutions
CREATE TABLE IF NOT EXISTS procedure_execution_timeline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_id UUID NOT NULL REFERENCES procedure_executions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des templates de procédures
CREATE TABLE IF NOT EXISTS procedure_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    steps JSONB NOT NULL DEFAULT '[]',
    is_public BOOLEAN DEFAULT FALSE,
    created_by_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour les procédures
CREATE INDEX IF NOT EXISTS idx_procedure_executions_procedure ON procedure_executions(procedure_id);
CREATE INDEX IF NOT EXISTS idx_procedure_executions_event ON procedure_executions(event_id);
CREATE INDEX IF NOT EXISTS idx_procedure_executions_status ON procedure_executions(status);
CREATE INDEX IF NOT EXISTS idx_step_executions_execution ON step_executions(execution_id);
CREATE INDEX IF NOT EXISTS idx_step_executions_status ON step_executions(status);
CREATE INDEX IF NOT EXISTS idx_procedures_group ON procedures(group_id);
CREATE INDEX IF NOT EXISTS idx_procedures_category ON procedures(category_id);

-- Groupes de procédures par défaut
INSERT INTO procedure_groups (code, name, description, color, icon) VALUES
('GRP_ADMIN', 'Procédures Administratives', 'Procédures liées aux tâches administratives', '#3B82F6', 'clipboard'),
('GRP_URGENCE', 'Procédures d''Urgence', 'Procédures pour les situations d''urgence', '#EF4444', 'alert-triangle'),
('GRP_SURVEILLANCE', 'Surveillance Sanitaire', 'Procédures de surveillance et monitoring', '#10B981', 'activity'),
('GRP_LAB', 'Procédures Laboratoire', 'Procédures pour analyses et laboratoire', '#8B5CF6', 'flask-conical')
ON CONFLICT (code) DO NOTHING;

-- Message de fin
DO $$
BEGIN
    RAISE NOTICE 'Base de données CCOUSA-APP initialisée avec succès!';
END $$;
