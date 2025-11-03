-- Supabase 数据库初始化脚本
-- 请在 Supabase SQL Editor 中执行此脚本

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 客户表
CREATE TABLE IF NOT EXISTS customers (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    contact TEXT,
    company TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 写手表
CREATE TABLE IF NOT EXISTS writers (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    specialty TEXT,
    contact TEXT,
    rate INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 项目表
CREATE TABLE IF NOT EXISTS projects (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT,
    customer_name TEXT,
    writer_name TEXT,
    description TEXT,
    deadline DATE,
    client_price DECIMAL(10, 2) DEFAULT 0,
    writer_price DECIMAL(10, 2) DEFAULT 0,
    status TEXT DEFAULT '待接单',
    created_by BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 时间线表
CREATE TABLE IF NOT EXISTS timeline (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 项目文件表
CREATE TABLE IF NOT EXISTS project_files (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 项目沟通记录表
CREATE TABLE IF NOT EXISTS project_notes (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_by BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_timeline_project_id ON timeline(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_notes_project_id ON project_notes(project_id);

-- 创建更新时间戳的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为 projects 表添加自动更新 updated_at 的触发器
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 插入示例数据
INSERT INTO users (username, email, password, role) VALUES
    ('superadmin', 'superadmin@example.com', '123456', 'superadmin'),
    ('admin1', 'admin1@example.com', '123456', 'admin'),
    ('admin2', 'admin2@example.com', '123456', 'admin')
ON CONFLICT (username) DO NOTHING;

INSERT INTO customers (name, contact, company) VALUES
    ('张三', '13800138001', 'ABC公司'),
    ('李四', '13800138002', 'XYZ企业'),
    ('王五', '13800138003', '创新科技')
ON CONFLICT DO NOTHING;

INSERT INTO writers (name, specialty, contact, rate) VALUES
    ('小明', '科技文章', '18900189001', 50),
    ('小红', '商业策划', '18900189002', 80),
    ('小刚', '设计类', '18900189003', 60)
ON CONFLICT DO NOTHING;

-- 注意：示例项目的插入需要在用户创建后进行
-- 由于 created_by 引用了 users 表的 id，这里使用子查询获取用户 id
INSERT INTO projects (
    title, type, customer_name, writer_name, description,
    deadline, client_price, writer_price, status, created_by
)
SELECT
    'AI技术报告', '技术文章', '张三', '小明', '关于人工智能发展趋势的深度报告',
    '2024-12-15', 1500, 800, '写作中', u.id
FROM users u WHERE u.username = 'admin1'
ON CONFLICT DO NOTHING;

INSERT INTO projects (
    title, type, customer_name, writer_name, description,
    deadline, client_price, writer_price, status, created_by
)
SELECT
    '品牌营销方案', '商业策划', '李四', '小红', '新产品上市营销策略方案',
    '2024-12-20', 2000, 1200, '待接单', u.id
FROM users u WHERE u.username = 'admin2'
ON CONFLICT DO NOTHING;

-- 完成！
