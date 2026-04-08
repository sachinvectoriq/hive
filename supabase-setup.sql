-- ===========================================
-- Hive: Supabase Setup SQL
-- Run this in Supabase Dashboard > SQL Editor
-- ===========================================

-- 1. Grant API access to authenticated role on all tables
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;

-- 2. Enable Row Level Security on all tables
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE git_repos ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies - authenticated users can do everything
CREATE POLICY "Authenticated users full access" ON applications
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON git_repos
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON resources
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON role_assignments
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON people
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON tasks
  FOR ALL USING (auth.role() = 'authenticated');

-- 4. Create view: application summaries with counts
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

-- 5. Create view: git repos with application name
CREATE OR REPLACE VIEW git_repos_with_app AS
SELECT
  gr.id,
  gr.application_id,
  gr.repo_name,
  gr.owner,
  gr.link,
  a.name AS application
FROM git_repos gr
JOIN applications a ON a.id = gr.application_id
ORDER BY gr.repo_name;

-- 6. Create view: people with application name
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

-- 7. Create view: tasks with application name
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

-- 8. Create RPC function: dashboard stats
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

-- 9. Create RPC function: resource groups aggregate
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
          'role_name', ra.role_name,
          'resource_name', ra.resource_name,
          'application', a.name
        ))
        FROM role_assignments ra
        JOIN applications a ON a.id = ra.application_id
        WHERE ra.resource_group = rg_name
      ), '[]'::json) AS role_assignments,
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
        SELECT resource_group FROM role_assignments
      ) combined
    ) rg_names
    ORDER BY rg_name
  ) rg_data;
  RETURN result;
END;
$$;

-- 10. Grant access to views for authenticated users
GRANT SELECT ON application_summaries TO authenticated;
GRANT SELECT ON git_repos_with_app TO authenticated;
GRANT SELECT ON people_with_app TO authenticated;
GRANT SELECT ON tasks_with_app TO authenticated;
