-- ===========================================
-- Hive: COMPLETE Setup + Seed Data
-- Run this in your NEW Supabase Dashboard > SQL Editor
-- Creates tables, views, functions, RLS, grants, AND seed data
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
  (SELECT COUNT(DISTINCT r.resource_group) FROM resources r WHERE r.application_id = a.id) AS resource_group_count,
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

-- =============================================
-- 7. SEED DATA (from last known state)
-- =============================================

-- Application 1: AI Chat Platform
INSERT INTO applications (name, description) VALUES ('AI Chat Platform', 'Customer-facing AI chatbot powered by Azure OpenAI');

-- Application 2: Data Pipeline
INSERT INTO applications (name, description) VALUES ('Data Pipeline', 'ETL pipeline for data warehouse ingestion and transformation');

-- Application 3: Document Intelligence
INSERT INTO applications (name, description) VALUES ('Document Intelligence', 'AI-powered document processing and classification service');

-- Git Repos (app 1)
INSERT INTO git_repos (application_id, repo_name, owner, link, branch) VALUES
  ((SELECT id FROM applications WHERE name='AI Chat Platform'), 'ai-chat-api', 'Platform Team', 'https://dev.azure.com/org/ai-chat-api', ''),
  ((SELECT id FROM applications WHERE name='AI Chat Platform'), 'ai-chat-frontend', 'Frontend Team', 'https://dev.azure.com/org/ai-chat-frontend', '');

-- Git Repos (app 2)
INSERT INTO git_repos (application_id, repo_name, owner, link, branch) VALUES
  ((SELECT id FROM applications WHERE name='Data Pipeline'), 'data-pipeline-core', 'Data Engineering', 'https://dev.azure.com/org/data-pipeline-core', ''),
  ((SELECT id FROM applications WHERE name='Data Pipeline'), 'data-pipeline-configs', 'Data Engineering', 'https://dev.azure.com/org/data-pipeline-configs', '');

-- Git Repos (app 3)
INSERT INTO git_repos (application_id, repo_name, owner, link, branch) VALUES
  ((SELECT id FROM applications WHERE name='Document Intelligence'), 'docintel-service', 'AI Team', 'https://dev.azure.com/org/docintel-service', '');

-- Resources (app 1)
INSERT INTO resources (application_id, resource_group, resource_name, type, tier_sku) VALUES
  ((SELECT id FROM applications WHERE name='AI Chat Platform'), 'rg-ai-prod', 'oai-chat-prod', 'Microsoft.CognitiveServices/accounts', 'S0'),
  ((SELECT id FROM applications WHERE name='AI Chat Platform'), 'rg-ai-prod', 'app-chat-prod', 'Microsoft.Web/sites', 'P1v3'),
  ((SELECT id FROM applications WHERE name='AI Chat Platform'), 'rg-ai-prod', 'kv-ai-prod', 'Microsoft.KeyVault/vaults', 'Standard'),
  ((SELECT id FROM applications WHERE name='AI Chat Platform'), 'rg-ai-prod', 'cosmos-chat-prod', 'Microsoft.DocumentDB/databaseAccounts', 'Standard');

-- Resources (app 2)
INSERT INTO resources (application_id, resource_group, resource_name, type, tier_sku) VALUES
  ((SELECT id FROM applications WHERE name='Data Pipeline'), 'rg-data-prod', 'adf-etl-prod', 'Microsoft.DataFactory/factories', 'Standard'),
  ((SELECT id FROM applications WHERE name='Data Pipeline'), 'rg-data-prod', 'sql-warehouse-prod', 'Microsoft.Sql/servers', 'S2'),
  ((SELECT id FROM applications WHERE name='Data Pipeline'), 'rg-data-prod', 'st-datalake-prod', 'Microsoft.Storage/storageAccounts', 'Standard_LRS');

-- Resources (app 3)
INSERT INTO resources (application_id, resource_group, resource_name, type, tier_sku) VALUES
  ((SELECT id FROM applications WHERE name='Document Intelligence'), 'rg-docintel-prod', 'form-recognizer-prod', 'Microsoft.CognitiveServices/accounts', 'S0'),
  ((SELECT id FROM applications WHERE name='Document Intelligence'), 'rg-docintel-prod', 'func-docintel-prod', 'Microsoft.Web/sites', 'Y1'),
  ((SELECT id FROM applications WHERE name='Document Intelligence'), 'rg-docintel-prod', 'st-docintel-prod', 'Microsoft.Storage/storageAccounts', 'Standard_LRS');

-- Role Assignments (app 1)
INSERT INTO role_assignments (application_id, role, assigned_to, scope) VALUES
  ((SELECT id FROM applications WHERE name='AI Chat Platform'), 'Cognitive Services Contributor', 'oai-chat-prod', 'rg-ai-prod'),
  ((SELECT id FROM applications WHERE name='AI Chat Platform'), 'Key Vault Secrets User', 'kv-ai-prod', 'rg-ai-prod'),
  ((SELECT id FROM applications WHERE name='AI Chat Platform'), 'Cosmos DB Account Reader', 'cosmos-chat-prod', 'rg-ai-prod');

-- Role Assignments (app 2)
INSERT INTO role_assignments (application_id, role, assigned_to, scope) VALUES
  ((SELECT id FROM applications WHERE name='Data Pipeline'), 'Data Factory Contributor', 'adf-etl-prod', 'rg-data-prod'),
  ((SELECT id FROM applications WHERE name='Data Pipeline'), 'Storage Blob Data Contributor', 'st-datalake-prod', 'rg-data-prod');

-- Role Assignments (app 3)
INSERT INTO role_assignments (application_id, role, assigned_to, scope) VALUES
  ((SELECT id FROM applications WHERE name='Document Intelligence'), 'Cognitive Services User', 'form-recognizer-prod', 'rg-docintel-prod'),
  ((SELECT id FROM applications WHERE name='Document Intelligence'), 'Storage Blob Data Reader', 'st-docintel-prod', 'rg-docintel-prod');

-- People (app 1)
INSERT INTO people (application_id, name, applications_involved, resource_groups_involved, permissions) VALUES
  ((SELECT id FROM applications WHERE name='AI Chat Platform'), 'Sarah Chen', 'AI Chat Platform, Data Pipeline', 'rg-ai-prod', 'Contributor on oai-chat-prod, Reader on kv-ai-prod'),
  ((SELECT id FROM applications WHERE name='AI Chat Platform'), 'James Wilson', 'AI Chat Platform', 'rg-ai-prod', 'Owner on rg-ai-prod');

-- People (app 2)
INSERT INTO people (application_id, name, applications_involved, resource_groups_involved, permissions) VALUES
  ((SELECT id FROM applications WHERE name='Data Pipeline'), 'Marcus Johnson', 'Data Pipeline, Document Intelligence', 'rg-data-prod, rg-docintel-prod', 'Contributor on adf-etl-prod, Reader on st-datalake-prod'),
  ((SELECT id FROM applications WHERE name='Data Pipeline'), 'Emily Davis', 'Data Pipeline', 'rg-data-prod', 'SQL Server Contributor on sql-warehouse-prod');

-- People (app 3)
INSERT INTO people (application_id, name, applications_involved, resource_groups_involved, permissions) VALUES
  ((SELECT id FROM applications WHERE name='Document Intelligence'), 'Alex Kim', 'Document Intelligence', 'rg-docintel-prod', 'Contributor on form-recognizer-prod');

-- Tasks (app 1)
INSERT INTO tasks (application_id, title, description, status, severity, assigned_to, assigned_on) VALUES
  ((SELECT id FROM applications WHERE name='AI Chat Platform'), 'Upgrade OpenAI model to GPT-4o', 'Migrate from GPT-4 to GPT-4o for faster responses', 'in-progress', 'high', 'Sarah Chen', CURRENT_DATE),
  ((SELECT id FROM applications WHERE name='AI Chat Platform'), 'Set up staging environment', 'Create rg-ai-staging with same resources', 'not-started', 'medium', 'James Wilson', CURRENT_DATE);

-- Tasks (app 2)
INSERT INTO tasks (application_id, title, description, status, severity, assigned_to, assigned_on) VALUES
  ((SELECT id FROM applications WHERE name='Data Pipeline'), 'Fix data ingestion timeout', 'Pipeline fails on large CSV files >2GB', 'in-progress', 'critical', 'Marcus Johnson', CURRENT_DATE),
  ((SELECT id FROM applications WHERE name='Data Pipeline'), 'Add monitoring alerts', 'Set up alerts for pipeline failures', 'not-started', 'medium', 'Emily Davis', CURRENT_DATE);

-- Tasks (app 3)
INSERT INTO tasks (application_id, title, description, status, severity, assigned_to, assigned_on) VALUES
  ((SELECT id FROM applications WHERE name='Document Intelligence'), 'Integrate new document classifier', 'Add support for invoice classification', 'completed', 'high', 'Alex Kim', CURRENT_DATE);

-- =============================================
-- DONE! Your Hive database is fully set up.
-- 
-- NEXT STEPS:
-- 1. Go to Authentication > Users in your new Supabase dashboard
-- 2. Create a user (email + password) to log into the app
-- 3. Update your .env files:
--    frontend/.env:
--      VITE_SUPABASE_URL=https://YOUR-NEW-PROJECT-REF.supabase.co
--      VITE_SUPABASE_ANON_KEY=YOUR-NEW-ANON-KEY
--    backend/.env:
--      DATABASE_URL=postgresql+asyncpg://postgres:YOUR-DB-PASSWORD@db.YOUR-NEW-PROJECT-REF.supabase.co:5432/postgres
-- =============================================
