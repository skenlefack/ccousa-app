-- ===========================================
-- Procedures Module Database Schema
-- CCOUSA-APP Procedures Service
-- ===========================================

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- Update procedure_groups table (add missing columns)
-- ===========================================

ALTER TABLE procedure_groups
  ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#3B82F6',
  ADD COLUMN IF NOT EXISTS icon VARCHAR(50),
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES procedure_groups(id);

-- ===========================================
-- Update procedures table (add missing columns)
-- ===========================================

ALTER TABLE procedures
  ADD COLUMN IF NOT EXISTS trigger_config JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS created_by_id UUID REFERENCES users(id);

-- Update column names if needed
DO $$
BEGIN
  -- Rename trigger_type if exists with different values
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'procedures' AND column_name = 'trigger_type') THEN
    -- Ensure trigger_type accepts the new values
    EXECUTE 'ALTER TABLE procedures DROP CONSTRAINT IF EXISTS procedures_trigger_type_check';
    EXECUTE 'ALTER TABLE procedures ADD CONSTRAINT procedures_trigger_type_check CHECK (trigger_type IS NULL OR trigger_type IN (''MANUAL'', ''EVENT_CREATED'', ''EVENT_STATUS_CHANGE'', ''SCHEDULED'', ''CONDITION_BASED''))';
  END IF;
END $$;

-- ===========================================
-- Update procedure_steps table (add missing columns)
-- ===========================================

ALTER TABLE procedure_steps
  ADD COLUMN IF NOT EXISTS duration_hours DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS is_optional BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS assignee_type VARCHAR(20) DEFAULT 'USER' CHECK (assignee_type IN ('USER', 'ROLE', 'DEPARTMENT', 'AUTO')),
  ADD COLUMN IF NOT EXISTS assignee_id UUID,
  ADD COLUMN IF NOT EXISTS required_document_ids UUID[];

-- Rename step_order to step_number if needed
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'procedure_steps' AND column_name = 'step_order')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'procedure_steps' AND column_name = 'step_number') THEN
    ALTER TABLE procedure_steps RENAME COLUMN step_order TO step_number;
  END IF;
END $$;

-- ===========================================
-- Procedure Executions Table
-- ===========================================

CREATE TABLE IF NOT EXISTS procedure_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  procedure_id UUID NOT NULL REFERENCES procedures(id),
  event_id UUID NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'FAILED')),
  current_step_number INTEGER DEFAULT 1,
  started_by_id UUID REFERENCES users(id),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancel_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_procedure_executions_procedure ON procedure_executions(procedure_id);
CREATE INDEX IF NOT EXISTS idx_procedure_executions_event ON procedure_executions(event_id);
CREATE INDEX IF NOT EXISTS idx_procedure_executions_status ON procedure_executions(status);
CREATE INDEX IF NOT EXISTS idx_procedure_executions_started_at ON procedure_executions(started_at DESC);

-- ===========================================
-- Step Executions Table
-- ===========================================

CREATE TABLE IF NOT EXISTS step_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  execution_id UUID NOT NULL REFERENCES procedure_executions(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES procedure_steps(id),
  step_number INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'FAILED')),
  assigned_to_id UUID REFERENCES users(id),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by_id UUID REFERENCES users(id),
  notes TEXT,
  form_submission_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_step_executions_execution ON step_executions(execution_id);
CREATE INDEX IF NOT EXISTS idx_step_executions_step ON step_executions(step_id);
CREATE INDEX IF NOT EXISTS idx_step_executions_status ON step_executions(status);

-- ===========================================
-- Step Attachments Table
-- ===========================================

CREATE TABLE IF NOT EXISTS step_execution_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  step_execution_id UUID NOT NULL REFERENCES step_executions(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  uploaded_by_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_step_attachments_step_exec ON step_execution_attachments(step_execution_id);

-- ===========================================
-- Procedure Execution Timeline Table
-- ===========================================

CREATE TABLE IF NOT EXISTS procedure_execution_timeline (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  execution_id UUID NOT NULL REFERENCES procedure_executions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proc_exec_timeline_execution ON procedure_execution_timeline(execution_id);
CREATE INDEX IF NOT EXISTS idx_proc_exec_timeline_created ON procedure_execution_timeline(created_at DESC);

-- ===========================================
-- Procedure Templates Table
-- ===========================================

CREATE TABLE IF NOT EXISTS procedure_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL CHECK (type IN ('STANDARD', 'EMERGENCY', 'ADMINISTRATIVE', 'CLINICAL', 'SAFETY')),
  steps JSONB NOT NULL DEFAULT '[]',
  is_public BOOLEAN DEFAULT FALSE,
  created_by_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_procedure_templates_public ON procedure_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_procedure_templates_created_by ON procedure_templates(created_by_id);

-- ===========================================
-- Triggers for updated_at
-- ===========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_procedure_executions_updated_at ON procedure_executions;
CREATE TRIGGER update_procedure_executions_updated_at
  BEFORE UPDATE ON procedure_executions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_step_executions_updated_at ON step_executions;
CREATE TRIGGER update_step_executions_updated_at
  BEFORE UPDATE ON step_executions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- Sample Procedure Groups
-- ===========================================

INSERT INTO procedure_groups (code, name, description, color, icon) VALUES
  ('GRP_ADMIN', 'Procédures Administratives', 'Procédures liées aux tâches administratives', '#3B82F6', 'clipboard'),
  ('GRP_URGENCE', 'Procédures d''Urgence', 'Procédures pour les situations d''urgence', '#EF4444', 'alert-triangle'),
  ('GRP_SURVEILLANCE', 'Surveillance Sanitaire', 'Procédures de surveillance et monitoring', '#10B981', 'activity'),
  ('GRP_LAB', 'Procédures Laboratoire', 'Procédures pour analyses et laboratoire', '#8B5CF6', 'flask-conical')
ON CONFLICT (code) DO NOTHING;

-- ===========================================
-- Update procedures index
-- ===========================================

CREATE INDEX IF NOT EXISTS idx_procedures_group ON procedures(group_id);
CREATE INDEX IF NOT EXISTS idx_procedures_category ON procedures(category_id);
CREATE INDEX IF NOT EXISTS idx_procedures_trigger_type ON procedures(trigger_type);

-- Notify completion
DO $$
BEGIN
  RAISE NOTICE 'Procedures module tables created successfully!';
END $$;
