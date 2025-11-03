-- 修复 Supabase RLS (Row Level Security) 权限问题
-- 在 Supabase SQL Editor 中执行此脚本

-- 方案 1: 禁用 RLS（适合开发环境）
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS writers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS timeline DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS project_files DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS project_notes DISABLE ROW LEVEL SECURITY;

-- 如果您想启用 RLS 但允许后端访问，请使用方案 2：
-- 取消注释以下代码并注释掉上面的 DISABLE 语句

/*
-- 方案 2: 启用 RLS 但允许 service_role 完全访问
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE writers ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_notes ENABLE ROW LEVEL SECURITY;

-- 为每个表创建 service_role 策略
DROP POLICY IF EXISTS "service_role_all_users" ON users;
CREATE POLICY "service_role_all_users" ON users
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_customers" ON customers;
CREATE POLICY "service_role_all_customers" ON customers
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_writers" ON writers;
CREATE POLICY "service_role_all_writers" ON writers
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_projects" ON projects;
CREATE POLICY "service_role_all_projects" ON projects
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_timeline" ON timeline;
CREATE POLICY "service_role_all_timeline" ON timeline
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_project_files" ON project_files;
CREATE POLICY "service_role_all_project_files" ON project_files
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_project_notes" ON project_notes;
CREATE POLICY "service_role_all_project_notes" ON project_notes
    FOR ALL TO service_role USING (true) WITH CHECK (true);
*/

-- 完成！
SELECT 'RLS 已禁用，service_role 现在可以访问所有表' AS status;
