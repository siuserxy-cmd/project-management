const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const app = express();
const PORT = 3001;

// 确保上传目录存在
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置文件上传
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = uuidv4();
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB 限制
    },
    fileFilter: function (req, file, cb) {
        // 允许的文件类型
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('只允许上传图片和文档文件！'));
        }
    }
});

// 中间件
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));
app.use('/uploads', express.static(uploadDir));

// 数据库连接
const db = new sqlite3.Database('./database.db');

// 设置数据库编码
db.run("PRAGMA encoding = 'UTF-8'");

// 首页路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 用户注册
app.post('/api/register', (req, res) => {
    const { username, password, role } = req.body;

    // 简单验证
    if (!username || !password || !role) {
        return res.status(400).json({ error: '所有字段都是必填的' });
    }

    // 生成默认邮箱
    const email = `${username}@example.com`;

    const sql = 'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)';

    db.run(sql, [username, email, password, role], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: '用户名或邮箱已存在' });
            }
            return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID, message: '注册成功' });
    });
});

// 用户登录
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const sql = 'SELECT * FROM users WHERE username = ? AND password = ?';

    db.get(sql, [username, password], (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (!user) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }

        // 返回用户信息（不包含密码）
        const { password: _, ...userInfo } = user;
        res.json({ user: userInfo, message: '登录成功' });
    });
});

// 获取项目列表
app.get('/api/projects', (req, res) => {
    const userId = req.query.userId; // 查询特定用户的项目
    const viewAll = req.query.viewAll === 'true'; // 是否查看所有项目

    let sql = `
        SELECT p.*, u.username as creator_name
        FROM projects p
        LEFT JOIN users u ON p.created_by = u.id
    `;
    let params = [];

    if (userId && !viewAll) {
        sql += ' WHERE p.created_by = ?';
        params = [userId];
    }

    sql += ' ORDER BY p.created_at DESC';

    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// 创建新项目
app.post('/api/projects', (req, res) => {
    console.log('收到创建项目请求:', req.body);

    const {
        title, type, customer_name, writer_name, description,
        deadline, client_price, writer_price, created_by
    } = req.body;

    // 验证必填字段
    if (!title || title.trim() === '') {
        return res.status(400).json({ error: '项目标题不能为空' });
    }

    if (!created_by) {
        return res.status(400).json({ error: '创建者ID不能为空' });
    }

    const sql = `
        INSERT INTO projects (
            title, type, customer_name, writer_name, description,
            deadline, client_price, writer_price, status, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `;

    const params = [
        title.trim(),
        type || '其他',
        customer_name ? customer_name.trim() : null,
        writer_name ? writer_name.trim() : null,
        description ? description.trim() : null,
        deadline || null,
        client_price || 0,
        writer_price || 0,
        '待接单',
        created_by
    ];

    console.log('SQL参数:', params);

    db.run(sql, params, function(err) {
        if (err) {
            console.error('数据库错误:', err);
            return res.status(500).json({ error: '数据库错误: ' + err.message });
        }
        console.log('项目创建成功，ID:', this.lastID);
        res.json({ id: this.lastID, message: '项目创建成功' });
    });
});

// 更新项目状态
app.put('/api/projects/:id/status', (req, res) => {
    const { status } = req.body;
    const projectId = req.params.id;

    const sql = 'UPDATE projects SET status = ?, updated_at = datetime("now") WHERE id = ?';

    db.run(sql, [status, projectId], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        // 记录状态变更到时间线
        const timelineSql = `
            INSERT INTO timeline (project_id, status, created_at)
            VALUES (?, ?, datetime('now'))
        `;

        db.run(timelineSql, [projectId, status], (err) => {
            if (err) {
                console.error('Timeline update failed:', err);
            }
        });

        res.json({ message: '状态更新成功' });
    });
});

// 获取项目时间线
app.get('/api/projects/:id/timeline', (req, res) => {
    const projectId = req.params.id;
    const sql = 'SELECT * FROM timeline WHERE project_id = ? ORDER BY created_at ASC';

    db.all(sql, [projectId], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// 获取客户列表
app.get('/api/customers', (req, res) => {
    db.all('SELECT * FROM customers ORDER BY name', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// 获取写手列表
app.get('/api/writers', (req, res) => {
    db.all('SELECT * FROM writers ORDER BY name', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// 添加客户
app.post('/api/customers', (req, res) => {
    const { name, contact, company } = req.body;
    const sql = 'INSERT INTO customers (name, contact, company) VALUES (?, ?, ?)';

    db.run(sql, [name, contact, company], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: this.lastID, message: '客户添加成功' });
    });
});

// 添加写手
app.post('/api/writers', (req, res) => {
    const { name, specialty, contact, rate } = req.body;
    const sql = 'INSERT INTO writers (name, specialty, contact, rate) VALUES (?, ?, ?, ?)';

    db.run(sql, [name, specialty, contact, rate], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: this.lastID, message: '写手添加成功' });
    });
});

// 文件上传接口
app.post('/api/upload', upload.array('files', 20), (req, res) => {
    try {
        const projectId = req.body.projectId;
        const uploadedFiles = [];

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: '没有文件被上传' });
        }

        // 处理每个上传的文件
        req.files.forEach(file => {
            const fileInfo = {
                filename: file.filename,
                originalName: file.originalname,
                filePath: `/uploads/${file.filename}`,
                fileType: file.mimetype,
                fileSize: file.size
            };

            uploadedFiles.push(fileInfo);

            // 如果有项目ID，将文件信息存储到数据库
            if (projectId) {
                const sql = `
                    INSERT INTO project_files (project_id, filename, original_name, file_path, file_type, file_size)
                    VALUES (?, ?, ?, ?, ?, ?)
                `;

                db.run(sql, [projectId, file.filename, file.originalname, fileInfo.filePath, file.mimetype, file.size], (err) => {
                    if (err) {
                        console.error('保存文件信息到数据库失败:', err);
                    }
                });
            }
        });

        res.json({
            message: '文件上传成功',
            files: uploadedFiles
        });

    } catch (error) {
        console.error('文件上传失败:', error);
        res.status(500).json({ error: '文件上传失败' });
    }
});

// 获取项目文件
app.get('/api/projects/:id/files', (req, res) => {
    const projectId = req.params.id;
    const sql = 'SELECT * FROM project_files WHERE project_id = ? ORDER BY uploaded_at DESC';

    db.all(sql, [projectId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// 删除文件
app.delete('/api/files/:id', (req, res) => {
    const fileId = req.params.id;

    // 先获取文件信息
    db.get('SELECT * FROM project_files WHERE id = ?', [fileId], (err, file) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (!file) {
            return res.status(404).json({ error: '文件不存在' });
        }

        // 删除物理文件
        const filePath = path.join(__dirname, 'uploads', file.filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // 从数据库删除记录
        db.run('DELETE FROM project_files WHERE id = ?', [fileId], function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: '文件删除成功' });
        });
    });
});

// 删除项目
app.delete('/api/projects/:id', (req, res) => {
    const projectId = req.params.id;
    const userId = req.query.userId; // 从查询参数获取用户ID
    const userRole = req.query.userRole; // 从查询参数获取用户角色

    console.log('删除项目 ID:', projectId, '用户ID:', userId, '用户角色:', userRole);

    // 权限检查：只有超级管理员或项目创建者可以删除
    if (userRole !== 'superadmin') {
        db.get('SELECT created_by FROM projects WHERE id = ?', [projectId], (err, project) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (!project) {
                return res.status(404).json({ error: '项目不存在' });
            }
            if (project.created_by !== parseInt(userId)) {
                return res.status(403).json({ error: '您只能删除自己创建的项目' });
            }
            // 继续执行删除逻辑
            performDelete();
        });
    } else {
        // 超级管理员直接执行删除
        performDelete();
    }

    function performDelete() {
        // 首先删除项目相关的文件
        db.all('SELECT * FROM project_files WHERE project_id = ?', [projectId], (err, files) => {
        if (err) {
            console.error('获取项目文件失败:', err);
        } else {
            // 删除物理文件
            files.forEach(file => {
                const filePath = path.join(__dirname, 'uploads', file.filename);
                if (fs.existsSync(filePath)) {
                    try {
                        fs.unlinkSync(filePath);
                        console.log('删除文件:', file.filename);
                    } catch (fileErr) {
                        console.error('删除文件失败:', fileErr);
                    }
                }
            });
        }

        // 删除数据库中的文件记录
        db.run('DELETE FROM project_files WHERE project_id = ?', [projectId], (err) => {
            if (err) {
                console.error('删除文件记录失败:', err);
            }
        });

        // 删除时间线记录
        db.run('DELETE FROM timeline WHERE project_id = ?', [projectId], (err) => {
            if (err) {
                console.error('删除时间线记录失败:', err);
            }
        });

        // 最后删除项目
        const sql = 'DELETE FROM projects WHERE id = ?';
        db.run(sql, [projectId], function(err) {
            if (err) {
                console.error('删除项目失败:', err);
                return res.status(500).json({ error: '删除失败: ' + err.message });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: '项目不存在' });
            }

            console.log('项目删除成功，ID:', projectId);
            res.json({ message: '项目删除成功' });
        });
    });
    }
});

// 更新项目
app.put('/api/projects/:id', (req, res) => {
    const projectId = req.params.id;
    const {
        title, type, customer_name, writer_name, description,
        deadline, client_price, writer_price, userId, userRole
    } = req.body;

    console.log('更新项目 ID:', projectId, '数据:', req.body);

    // 验证必填字段
    if (!title || title.trim() === '') {
        return res.status(400).json({ error: '项目标题不能为空' });
    }

    // 权限检查：只有超级管理员或项目创建者可以更新
    if (userRole !== 'superadmin') {
        db.get('SELECT created_by FROM projects WHERE id = ?', [projectId], (err, project) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (!project) {
                return res.status(404).json({ error: '项目不存在' });
            }
            if (project.created_by !== parseInt(userId)) {
                return res.status(403).json({ error: '您只能修改自己创建的项目' });
            }
            // 继续执行更新逻辑
            performUpdate();
        });
    } else {
        // 超级管理员直接执行更新
        performUpdate();
    }

    function performUpdate() {

    const sql = `
        UPDATE projects SET
            title = ?, type = ?, customer_name = ?, writer_name = ?,
            description = ?, deadline = ?, client_price = ?, writer_price = ?,
            updated_at = datetime('now')
        WHERE id = ?
    `;

    const params = [
        title.trim(),
        type || '其他',
        customer_name ? customer_name.trim() : null,
        writer_name ? writer_name.trim() : null,
        description ? description.trim() : null,
        deadline || null,
        client_price || 0,
        writer_price || 0,
        projectId
    ];

    db.run(sql, params, function(err) {
        if (err) {
            console.error('更新项目失败:', err);
            return res.status(500).json({ error: '更新失败: ' + err.message });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: '项目不存在' });
        }

        console.log('项目更新成功，ID:', projectId);
        res.json({ message: '项目更新成功' });
    });
    }
});

// 获取用户列表（仅超级管理员）
app.get('/api/users', (req, res) => {
    const sql = 'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC';

    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// 删除用户（仅超级管理员）
app.delete('/api/users/:id', (req, res) => {
    const userId = req.params.id;

    // 防止删除超级管理员
    db.get('SELECT role FROM users WHERE id = ?', [userId], (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (!user) {
            return res.status(404).json({ error: '用户不存在' });
        }

        if (user.role === 'superadmin') {
            return res.status(403).json({ error: '不能删除超级管理员' });
        }

        // 删除用户
        const sql = 'DELETE FROM users WHERE id = ?';
        db.run(sql, [userId], function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: '用户不存在' });
            }

            res.json({ message: '用户删除成功' });
        });
    });
});

// 更新用户（仅超级管理员）
app.put('/api/users/:id', (req, res) => {
    const userId = req.params.id;
    const { username, password, role } = req.body;

    // 防止修改超级管理员
    db.get('SELECT role FROM users WHERE id = ?', [userId], (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (!user) {
            return res.status(404).json({ error: '用户不存在' });
        }

        if (user.role === 'superadmin') {
            return res.status(403).json({ error: '不能修改超级管理员' });
        }

        // 构建更新SQL和参数
        let updateFields = [];
        let updateParams = [];

        if (username) {
            updateFields.push('username = ?');
            updateParams.push(username);
        }

        if (password) {
            updateFields.push('password = ?');
            updateParams.push(password);
        }

        if (role) {
            updateFields.push('role = ?');
            updateParams.push(role);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: '没有要更新的字段' });
        }

        updateParams.push(userId);

        const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;

        db.run(sql, updateParams, function(err) {
            if (err) {
                if (err.code === 'SQLITE_CONSTRAINT') {
                    return res.status(400).json({ error: '用户名已存在' });
                }
                return res.status(500).json({ error: err.message });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: '用户不存在' });
            }

            res.json({ message: '用户更新成功' });
        });
    });
});

// 获取项目沟通记录
app.get('/api/projects/:id/notes', (req, res) => {
    const projectId = req.params.id;
    const sql = `
        SELECT n.*, u.username as creator_name
        FROM project_notes n
        LEFT JOIN users u ON n.created_by = u.id
        WHERE n.project_id = ?
        ORDER BY n.created_at DESC
    `;

    db.all(sql, [projectId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// 添加项目沟通记录
app.post('/api/projects/:id/notes', (req, res) => {
    const projectId = req.params.id;
    const { content, created_by } = req.body;

    if (!content || !content.trim()) {
        return res.status(400).json({ error: '沟通内容不能为空' });
    }

    if (!created_by) {
        return res.status(400).json({ error: '创建者ID不能为空' });
    }

    const sql = `
        INSERT INTO project_notes (project_id, content, created_by, created_at)
        VALUES (?, ?, ?, datetime('now'))
    `;

    db.run(sql, [projectId, content.trim(), created_by], function(err) {
        if (err) {
            console.error('保存沟通记录失败:', err);
            return res.status(500).json({ error: '保存失败: ' + err.message });
        }
        res.json({ id: this.lastID, message: '沟通记录保存成功' });
    });
});

// 删除项目沟通记录
app.delete('/api/projects/:projectId/notes/:noteId', (req, res) => {
    const { projectId, noteId } = req.params;
    const userId = req.query.userId;
    const userRole = req.query.userRole;

    // 权限检查
    if (userRole !== 'superadmin') {
        db.get('SELECT created_by FROM project_notes WHERE id = ?', [noteId], (err, note) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (!note) {
                return res.status(404).json({ error: '记录不存在' });
            }
            if (note.created_by !== parseInt(userId)) {
                return res.status(403).json({ error: '您只能删除自己创建的记录' });
            }
            performDelete();
        });
    } else {
        performDelete();
    }

    function performDelete() {
        const sql = 'DELETE FROM project_notes WHERE id = ? AND project_id = ?';
        db.run(sql, [noteId, projectId], function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: '记录不存在' });
            }
            res.json({ message: '记录删除成功' });
        });
    }
});

app.listen(PORT, () => {
    console.log(`项目管理系统运行在 http://localhost:${PORT}`);
});