const sqlite3 = require('sqlite3').verbose();

// 创建数据库连接
const db = new sqlite3.Database('./database.db');

// 设置数据库编码
db.run("PRAGMA encoding = 'UTF-8'");

console.log('开始初始化数据库...');

// 创建表结构
db.serialize(() => {
    // 先删除旧的项目表
    db.run('DROP TABLE IF EXISTS projects');

    // 用户表
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // 客户表
    db.run(`
        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            contact TEXT,
            company TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // 写手表
    db.run(`
        CREATE TABLE IF NOT EXISTS writers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            specialty TEXT,
            contact TEXT,
            rate INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // 重新创建项目表
    db.run(`
        CREATE TABLE projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            type TEXT,
            customer_name TEXT,
            writer_name TEXT,
            description TEXT,
            deadline DATE,
            client_price REAL DEFAULT 0,
            writer_price REAL DEFAULT 0,
            status TEXT DEFAULT '待接单',
            created_by INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users (id)
        )
    `);

    // 时间线表
    db.run(`
        CREATE TABLE IF NOT EXISTS timeline (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            status TEXT NOT NULL,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects (id)
        )
    `);

    // 项目文件表
    db.run(`
        CREATE TABLE IF NOT EXISTS project_files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            filename TEXT NOT NULL,
            original_name TEXT NOT NULL,
            file_path TEXT NOT NULL,
            file_type TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects (id)
        )
    `);

    // 项目沟通记录表
    db.run(`
        CREATE TABLE IF NOT EXISTS project_notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            created_by INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects (id),
            FOREIGN KEY (created_by) REFERENCES users (id)
        )
    `);

    // 插入一些示例数据
    console.log('插入示例数据...');

    // 示例用户
    db.run(`INSERT OR IGNORE INTO users (username, email, password, role) VALUES
        ('superadmin', 'superadmin@example.com', '123456', 'superadmin'),
        ('admin1', 'admin1@example.com', '123456', 'admin'),
        ('admin2', 'admin2@example.com', '123456', 'admin')`
    );

    // 示例客户
    db.run(`INSERT OR IGNORE INTO customers (name, contact, company) VALUES
        ('张三', '13800138001', 'ABC公司'),
        ('李四', '13800138002', 'XYZ企业'),
        ('王五', '13800138003', '创新科技')`
    );

    // 示例写手
    db.run(`INSERT OR IGNORE INTO writers (name, specialty, contact, rate) VALUES
        ('小明', '科技文章', '18900189001', 50),
        ('小红', '商业策划', '18900189002', 80),
        ('小刚', '设计类', '18900189003', 60)`
    );

    // 示例项目
    db.run(`INSERT OR IGNORE INTO projects (
        title, type, customer_name, writer_name, description,
        deadline, client_price, writer_price, status, created_by
    ) VALUES
        ('AI技术报告', '技术文章', '张三', '小明', '关于人工智能发展趋势的深度报告',
         '2024-12-15', 1500, 800, '写作中', 11),
        ('品牌营销方案', '商业策划', '李四', '小红', '新产品上市营销策略方案',
         '2024-12-20', 2000, 1200, '待接单', 12)`
    );

    console.log('数据库初始化完成！');
});

db.close((err) => {
    if (err) {
        console.error('关闭数据库时出错:', err.message);
    } else {
        console.log('数据库连接已关闭。');
    }
});