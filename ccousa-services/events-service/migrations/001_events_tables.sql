-- ===========================================
-- Events Module Database Schema
-- CCOUSA-APP Events Service
-- ===========================================

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- Main Events Table (if not exists)
-- ===========================================

CREATE TABLE IF NOT EXISTS health_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(20) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category_id UUID REFERENCES event_categories(id),
  status VARCHAR(20) NOT NULL DEFAULT 'REPORTED' CHECK (status IN ('REPORTED', 'INVESTIGATING', 'CONFIRMED', 'RESOLVED', 'CLOSED')),
  severity VARCHAR(10) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  location VARCHAR(200) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  organizational_unit_id UUID REFERENCES organizational_units(id),
  reported_by_id UUID REFERENCES users(id),
  assigned_to_id UUID REFERENCES users(id),
  reported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for health_events
CREATE INDEX IF NOT EXISTS idx_health_events_status ON health_events(status);
CREATE INDEX IF NOT EXISTS idx_health_events_severity ON health_events(severity);
CREATE INDEX IF NOT EXISTS idx_health_events_category ON health_events(category_id);
CREATE INDEX IF NOT EXISTS idx_health_events_org_unit ON health_events(organizational_unit_id);
CREATE INDEX IF NOT EXISTS idx_health_events_reported_at ON health_events(reported_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_events_assigned_to ON health_events(assigned_to_id);

-- ===========================================
-- Event Comments Table
-- ===========================================

CREATE TABLE IF NOT EXISTS event_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES health_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_comments_event ON event_comments(event_id);
CREATE INDEX IF NOT EXISTS idx_event_comments_created ON event_comments(created_at DESC);

-- ===========================================
-- Event Attachments Table
-- ===========================================

CREATE TABLE IF NOT EXISTS event_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES health_events(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  document_type_id UUID REFERENCES document_types(id),
  uploaded_by_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_attachments_event ON event_attachments(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attachments_created ON event_attachments(created_at DESC);

-- ===========================================
-- Event Tasks Table
-- ===========================================

CREATE TABLE IF NOT EXISTS event_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES health_events(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  priority VARCHAR(10) NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
  assigned_to_id UUID REFERENCES users(id),
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_tasks_event ON event_tasks(event_id);
CREATE INDEX IF NOT EXISTS idx_event_tasks_status ON event_tasks(status);
CREATE INDEX IF NOT EXISTS idx_event_tasks_assigned ON event_tasks(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_event_tasks_due_date ON event_tasks(due_date);

-- ===========================================
-- Event Timeline Table
-- ===========================================

CREATE TABLE IF NOT EXISTS event_timeline (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES health_events(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL CHECK (action IN ('CREATED', 'UPDATED', 'STATUS_CHANGED', 'ASSIGNED', 'COMMENT_ADDED', 'ATTACHMENT_ADDED', 'TASK_ADDED', 'TASK_COMPLETED')),
  description TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_timeline_event ON event_timeline(event_id);
CREATE INDEX IF NOT EXISTS idx_event_timeline_created ON event_timeline(created_at DESC);

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

DROP TRIGGER IF EXISTS update_health_events_updated_at ON health_events;
CREATE TRIGGER update_health_events_updated_at
  BEFORE UPDATE ON health_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_event_comments_updated_at ON event_comments;
CREATE TRIGGER update_event_comments_updated_at
  BEFORE UPDATE ON event_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_event_tasks_updated_at ON event_tasks;
CREATE TRIGGER update_event_tasks_updated_at
  BEFORE UPDATE ON event_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- Sample Data for Testing
-- ===========================================

-- Insert sample events if table is empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM health_events LIMIT 1) THEN
    -- We would insert sample data here, but need valid foreign key references
    RAISE NOTICE 'No sample data inserted - please add event categories and users first';
  END IF;
END
$$;
