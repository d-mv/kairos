-- Kairos: Initial Schema Migration
-- Run in Supabase SQL editor or via CLI

-- Enable UUID extension (usually already enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────────
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'done');
CREATE TYPE task_priority AS ENUM ('1', '2', '3', '4');
CREATE TYPE link_type AS ENUM ('blocks', 'blocked_by', 'related_to');
CREATE TYPE entity_type AS ENUM ('task', 'project');

-- ─────────────────────────────────────────────
-- AREAS
-- ─────────────────────────────────────────────
CREATE TABLE areas (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- PROJECTS
-- ─────────────────────────────────────────────
CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  area_id     UUID REFERENCES areas(id) ON DELETE SET NULL,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- TASKS
-- ─────────────────────────────────────────────
CREATE TABLE tasks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           TEXT NOT NULL,
  description     TEXT,
  status          task_status NOT NULL DEFAULT 'todo',
  priority        task_priority NOT NULL DEFAULT '1',
  parent_task_id  UUID REFERENCES tasks(id) ON DELETE CASCADE,
  project_id      UUID REFERENCES projects(id) ON DELETE SET NULL,
  area_id         UUID REFERENCES areas(id) ON DELETE SET NULL,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  due_date        DATE,
  duration        INTEGER,
  duration_unit   TEXT CHECK (duration_unit IN ('h', 'd', 'w', 'm')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Subtasks cannot themselves have a project or area — ownership is inherited from parent
  CONSTRAINT subtask_no_direct_owner CHECK (
    parent_task_id IS NULL OR (project_id IS NULL AND area_id IS NULL)
  ),

  -- Top-level tasks cannot belong to both a project and an area at the same time
  CONSTRAINT exclusive_owner CHECK (
    NOT (project_id IS NOT NULL AND area_id IS NOT NULL)
  ),

  -- Duration and unit must be set together, duration must be positive
  CONSTRAINT duration_with_unit CHECK (
    (duration IS NULL AND duration_unit IS NULL)
    OR (duration IS NOT NULL AND duration_unit IS NOT NULL AND duration > 0)
  )
);

-- ─────────────────────────────────────────────
-- LINKS
-- ─────────────────────────────────────────────
CREATE TABLE links (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id   UUID NOT NULL,
  source_type entity_type NOT NULL,
  target_id   UUID NOT NULL,
  target_type entity_type NOT NULL,
  link_type   link_type NOT NULL,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- No self-links
  CONSTRAINT no_self_link CHECK (source_id <> target_id)
);

-- ─────────────────────────────────────────────
-- UPDATED_AT TRIGGER
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER areas_updated_at
  BEFORE UPDATE ON areas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────
CREATE INDEX tasks_user_id_idx ON tasks(user_id);
CREATE INDEX tasks_project_id_idx ON tasks(project_id);
CREATE INDEX tasks_area_id_idx ON tasks(area_id);
CREATE INDEX tasks_parent_task_id_idx ON tasks(parent_task_id);
CREATE INDEX projects_user_id_idx ON projects(user_id);
CREATE INDEX projects_area_id_idx ON projects(area_id);
CREATE INDEX areas_user_id_idx ON areas(user_id);
CREATE INDEX links_source_id_idx ON links(source_id);
CREATE INDEX links_target_id_idx ON links(target_id);
CREATE INDEX links_user_id_idx ON links(user_id);

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────
ALTER TABLE areas    ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE links    ENABLE ROW LEVEL SECURITY;

-- Required grants for Supabase API roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE areas, projects, tasks, links TO authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;

-- Areas: users only see their own
CREATE POLICY areas_user_isolation ON areas
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Projects: users only see their own
CREATE POLICY projects_user_isolation ON projects
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Tasks: users only see their own
CREATE POLICY tasks_user_isolation ON tasks
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Links: users only see their own
CREATE POLICY links_user_isolation ON links
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
