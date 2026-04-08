-- ===========================================
-- Hive: Supabase Setup SQL (Fresh Start)
-- Run this in Supabase Dashboard > SQL Editor
-- Safe to re-run: uses DROP IF EXISTS / CREATE OR REPLACE
-- ===========================================

-- =====================
-- 1. CREATE TABLES
-- =====================

CREATE TABLE IF NOT EXISTS applications (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS git_repos (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  application_id BIGINT REFERENCES applications(id) ON DELETE CASCADE,
  repo_name TEXT NOT NULL,
  owner TEXT DEFAULT '',
  link TEXT DEFAULT '',
  branch TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS resources (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  application_id BIGINT REFERENCES applications(id) ON DELETE CASCADE,
  resource_group TEXT NOT NULL,
  resource_name TEXT NOT NULL,
  type TEXT DEFAULT '',
  tier_sku TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS role_assignments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  application_id BIGINT REFERENCES applications(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  assigned_to TEXT DEFAULT '',
  scope TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS alerts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  application_id BIGINT REFERENCES applications(id) ON DELETE CASCADE,
  resource_group TEXT NOT NULL,
  alert_name TEXT NOT NULL,
  purpose TEXT DEFAULT '',
  resource_applied_to TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS people (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  application_id BIGINT REFERENCES applications(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  applications_involved TEXT DEFAULT '',
  resource_groups_involved TEXT DEFAULT '',
  permissions TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS tasks (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  application_id BIGINT REFERENCES applications(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'not-started',
  severity TEXT DEFAULT 'medium',
  assigned_to TEXT DEFAULT '',
  assigned_on DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add branch column if table already existed without it
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='git_repos' AND column_name='branch') THEN
    ALTER TABLE git_repos ADD COLUMN branch TEXT DEFAULT '';
  END IF;
END $$;

-- Migrate role_assignments if old columns exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='role_assignments' AND column_name='role') THEN
    ALTER TABLE role_assignments ADD COLUMN role TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='role_assignments' AND column_name='assigned_to') THEN
    ALTER TABLE role_assignments ADD COLUMN assigned_to TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='role_assignments' AND column_name='scope') THEN
    ALTER TABLE role_assignments ADD COLUMN scope TEXT DEFAULT '';
  END IF;
END $$;

-- =====================
-- 2. GRANTS
-- =====================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;

-- =====================
-- 3. ROW LEVEL SECURITY
-- =====================

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE git_repos ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Drop then create policies (safe to re-run)
DROP POLICY IF EXISTS "Authenticated users full access" ON applications;
CREATE POLICY "Authenticated users full access" ON applications
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users full access" ON git_repos;
CREATE POLICY "Authenticated users full access" ON git_repos
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users full access" ON resources;
CREATE POLICY "Authenticated users full access" ON resources
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users full access" ON role_assignments;
CREATE POLICY "Authenticated users full access" ON role_assignments
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users full access" ON alerts;
CREATE POLICY "Authenticated users full access" ON alerts
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users full access" ON people;
CREATE POLICY "Authenticated users full access" ON people
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users full access" ON tasks;
CREATE POLICY "Authenticated users full access" ON tasks
  FOR ALL USING (auth.role() = 'authenticated');

-- =====================
-- 4. VIEWS
-- =====================

CREATE OR REPLACE VIEW application_summaries AS
SELECT
  a.id,
  a.name,
  a.description,
  a.created_at,
  (SELECT COUNT(*) FROM git_repos gr WHERE gr.application_id = a.id) AS git_repo_count,
  (SELECT COUNT(*) FROM resources r WHERE r.application_id = a.id) AS resource_count,
  (SELECT COUNT(*) FROM people p WHERE p.application_id = a.id) AS people_count,
  (SELECT COUNT(*) FROM tasks t WHERE t.application_id = a.id) AS task_count
FROM applications a
ORDER BY a.name;

CREATE OR REPLACE VIEW git_repos_with_app AS
SELECT
  gr.id,
  gr.application_id,
  gr.repo_name,
  gr.owner,
  gr.link,
  gr.branch,
  a.name AS application
FROM git_repos gr
JOIN applications a ON a.id = gr.application_id
ORDER BY gr.repo_name;

CREATE OR REPLACE VIEW people_with_app AS
SELECT
  p.id,
  p.application_id,
  p.name,
  p.applications_involved,
  p.resource_groups_involved,
  p.permissions,
  a.name AS application
FROM people p
JOIN applications a ON a.id = p.application_id
ORDER BY p.name;

CREATE OR REPLACE VIEW tasks_with_app AS
SELECT
  t.id,
  t.application_id,
  t.title,
  t.description,
  t.status,
  t.severity,
  t.assigned_to,
  t.assigned_on,
  t.created_at,
  a.name AS application
FROM tasks t
JOIN applications a ON a.id = t.application_id
ORDER BY t.created_at DESC;

-- =====================
-- 5. RPC FUNCTIONS
-- =====================

-- Dashboard stats
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_applications', (SELECT COUNT(*) FROM applications),
    'total_repos', (SELECT COUNT(*) FROM git_repos),
    'total_resource_groups', (SELECT COUNT(DISTINCT resource_group) FROM resources),
    'total_people', (SELECT COUNT(*) FROM people),
    'total_tasks', (SELECT COUNT(*) FROM tasks),
    'tasks_not_started', (SELECT COUNT(*) FROM tasks WHERE status = 'not-started'),
    'tasks_in_progress', (SELECT COUNT(*) FROM tasks WHERE status = 'in-progress'),
    'tasks_completed', (SELECT COUNT(*) FROM tasks WHERE status = 'completed'),
    'recent_applications', (
      SELECT COALESCE(json_agg(sub), '[]'::json)
      FROM (
        SELECT
          a.id, a.name, a.description, a.created_at,
          (SELECT COUNT(*) FROM git_repos gr WHERE gr.application_id = a.id) AS git_repo_count,
          (SELECT COUNT(*) FROM resources r WHERE r.application_id = a.id) AS resource_count,
          (SELECT COUNT(*) FROM people p WHERE p.application_id = a.id) AS people_count
        FROM applications a
        ORDER BY a.created_at DESC
        LIMIT 5
      ) sub
    )
  ) INTO result;
  RETURN result;
END;
$$;

-- Resource groups aggregate (includes role_assignments + alerts)
CREATE OR REPLACE FUNCTION get_resource_groups()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT COALESCE(json_agg(rg_data), '[]'::json)
  INTO result
  FROM (
    SELECT
      rg_name AS name,
      COALESCE((
        SELECT json_agg(json_build_object(
          'id', r.id,
          'application_id', r.application_id,
          'resource_name', r.resource_name,
          'type', r.type,
          'tier_sku', r.tier_sku,
          'application', a.name
        ))
        FROM resources r
        JOIN applications a ON a.id = r.application_id
        WHERE r.resource_group = rg_name
      ), '[]'::json) AS resources,
      COALESCE((
        SELECT json_agg(json_build_object(
          'id', ra.id,
          'application_id', ra.application_id,
          'role', ra.role,
          'assigned_to', ra.assigned_to,
          'scope', ra.scope,
          'application', a.name
        ))
        FROM role_assignments ra
        JOIN applications a ON a.id = ra.application_id
        WHERE ra.scope = rg_name
      ), '[]'::json) AS role_assignments,
      COALESCE((
        SELECT json_agg(json_build_object(
          'id', al.id,
          'application_id', al.application_id,
          'alert_name', al.alert_name,
          'purpose', al.purpose,
          'resource_applied_to', al.resource_applied_to,
          'application', a.name
        ))
        FROM alerts al
        JOIN applications a ON a.id = al.application_id
        WHERE al.resource_group = rg_name
      ), '[]'::json) AS alerts,
      COALESCE((
        SELECT json_agg(DISTINCT a.name)
        FROM resources r
        JOIN applications a ON a.id = r.application_id
        WHERE r.resource_group = rg_name
      ), '[]'::json) AS applications
    FROM (
      SELECT DISTINCT resource_group AS rg_name
      FROM (
        SELECT resource_group FROM resources
        UNION
        SELECT resource_group FROM alerts
      ) combined
    ) rg_names
    ORDER BY rg_name
  ) rg_data;
  RETURN result;
END;
$$;

-- =====================
-- 6. GRANT VIEW ACCESS
-- =====================

GRANT SELECT ON application_summaries TO authenticated;
GRANT SELECT ON git_repos_with_app TO authenticated;
GRANT SELECT ON people_with_app TO authenticated;
GRANT SELECT ON tasks_with_app TO authenticated;
