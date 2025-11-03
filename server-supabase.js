const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
require('dotenv').config();

const { supabase, testConnection } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// 确保上传目录存在
const uploadDir = path.join(__dirname, process.env.UPLOAD_DIR || 'uploads');
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
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 默认 10MB
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

// 测试数据库连接
testConnection();

// 首页路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 用户注册
app.post('/api/register', async (req, res) => {
    const { username, password, role } = req.body;

    // 简单验证
    if (!username || !password || !role) {
        return res.status(400).json({ error: '所有字段都是必填的' });
    }

    // 生成默认邮箱
    const email = `${username}@example.com`;

    try {
        const { data, error } = await supabase
            .from('users')
            .insert([{ username, email, password, role }])
            .select();

        if (error) {
            if (error.code === '23505') { // PostgreSQL unique constraint error
                return res.status(400).json({ error: '用户名或邮箱已存在' });
            }
            return res.status(500).json({ error: error.message });
        }

        res.json({ id: data[0].id, message: '注册成功' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 用户登录
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('password', password)
            .single();

        if (error || !data) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }

        // 返回用户信息（不包含密码）
        const { password: _, ...userInfo } = data;
        res.json({ user: userInfo, message: '登录成功' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 获取项目列表
app.get('/api/projects', async (req, res) => {
    const userId = req.query.userId;
    const viewAll = req.query.viewAll === 'true';

    try {
        let query = supabase
            .from('projects')
            .select(`
                *,
                users!projects_created_by_fkey(username)
            `)
            .order('created_at', { ascending: false });

        if (userId && !viewAll) {
            query = query.eq('created_by', userId);
        }

        const { data, error } = await query;

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        // 格式化数据以匹配原有格式
        const formattedData = data.map(project => ({
            ...project,
            creator_name: project.users?.username || null,
            users: undefined
        }));

        res.json(formattedData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 创建新项目
app.post('/api/projects', async (req, res) => {
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

    try {
        const { data, error } = await supabase
            .from('projects')
            .insert([{
                title: title.trim(),
                type: type || '其他',
                customer_name: customer_name ? customer_name.trim() : null,
                writer_name: writer_name ? writer_name.trim() : null,
                description: description ? description.trim() : null,
                deadline: deadline || null,
                client_price: client_price || 0,
                writer_price: writer_price || 0,
                status: '待接单',
                created_by
            }])
            .select();

        if (error) {
            console.error('数据库错误:', error);
            return res.status(500).json({ error: '数据库错误: ' + error.message });
        }

        console.log('项目创建成功，ID:', data[0].id);
        res.json({ id: data[0].id, message: '项目创建成功' });
    } catch (err) {
        console.error('创建项目失败:', err);
        res.status(500).json({ error: err.message });
    }
});

// 更新项目状态
app.put('/api/projects/:id/status', async (req, res) => {
    const { status } = req.body;
    const projectId = req.params.id;

    try {
        // 更新项目状态
        const { error: projectError } = await supabase
            .from('projects')
            .update({ status })
            .eq('id', projectId);

        if (projectError) {
            return res.status(500).json({ error: projectError.message });
        }

        // 记录状态变更到时间线
        const { error: timelineError } = await supabase
            .from('timeline')
            .insert([{ project_id: projectId, status }]);

        if (timelineError) {
            console.error('Timeline update failed:', timelineError);
        }

        res.json({ message: '状态更新成功' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 获取项目时间线
app.get('/api/projects/:id/timeline', async (req, res) => {
    const projectId = req.params.id;

    try {
        const { data, error } = await supabase
            .from('timeline')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: true });

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 获取客户列表
app.get('/api/customers', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .order('name');

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 获取写手列表
app.get('/api/writers', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('writers')
            .select('*')
            .order('name');

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 添加客户
app.post('/api/customers', async (req, res) => {
    const { name, contact, company } = req.body;

    try {
        const { data, error } = await supabase
            .from('customers')
            .insert([{ name, contact, company }])
            .select();

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json({ id: data[0].id, message: '客户添加成功' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 添加写手
app.post('/api/writers', async (req, res) => {
    const { name, specialty, contact, rate } = req.body;

    try {
        const { data, error } = await supabase
            .from('writers')
            .insert([{ name, specialty, contact, rate }])
            .select();

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json({ id: data[0].id, message: '写手添加成功' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 文件上传接口
app.post('/api/upload', upload.array('files', 20), async (req, res) => {
    try {
        // Vercel 环境警告
        if (process.env.VERCEL === '1') {
            console.warn('警告: 在 Vercel 上，上传的文件会在服务重启后丢失。建议使用 Supabase Storage。');
        }

        const projectId = req.body.projectId;
        const uploadedFiles = [];

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: '没有文件被上传' });
        }

        // 处理每个上传的文件
        for (const file of req.files) {
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
                const { error } = await supabase
                    .from('project_files')
                    .insert([{
                        project_id: projectId,
                        filename: file.filename,
                        original_name: file.originalname,
                        file_path: fileInfo.filePath,
                        file_type: file.mimetype,
                        file_size: file.size
                    }]);

                if (error) {
                    console.error('保存文件信息到数据库失败:', error);
                }
            }
        }

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
app.get('/api/projects/:id/files', async (req, res) => {
    const projectId = req.params.id;

    try {
        const { data, error } = await supabase
            .from('project_files')
            .select('*')
            .eq('project_id', projectId)
            .order('uploaded_at', { ascending: false });

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 删除文件
app.delete('/api/files/:id', async (req, res) => {
    const fileId = req.params.id;

    try {
        // 先获取文件信息
        const { data: file, error: fetchError } = await supabase
            .from('project_files')
            .select('*')
            .eq('id', fileId)
            .single();

        if (fetchError || !file) {
            return res.status(404).json({ error: '文件不存在' });
        }

        // 删除物理文件
        const filePath = path.join(__dirname, 'uploads', file.filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // 从数据库删除记录
        const { error: deleteError } = await supabase
            .from('project_files')
            .delete()
            .eq('id', fileId);

        if (deleteError) {
            return res.status(500).json({ error: deleteError.message });
        }

        res.json({ message: '文件删除成功' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 删除项目
app.delete('/api/projects/:id', async (req, res) => {
    const projectId = req.params.id;
    const userId = req.query.userId;
    const userRole = req.query.userRole;

    console.log('删除项目 ID:', projectId, '用户ID:', userId, '用户角色:', userRole);

    try {
        // 权限检查：只有超级管理员或项目创建者可以删除
        if (userRole !== 'superadmin') {
            const { data: project, error: projectError } = await supabase
                .from('projects')
                .select('created_by')
                .eq('id', projectId)
                .single();

            if (projectError || !project) {
                return res.status(404).json({ error: '项目不存在' });
            }

            if (project.created_by !== parseInt(userId)) {
                return res.status(403).json({ error: '您只能删除自己创建的项目' });
            }
        }

        // 获取项目相关文件
        const { data: files } = await supabase
            .from('project_files')
            .select('*')
            .eq('project_id', projectId);

        // 删除物理文件
        if (files) {
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

        // Supabase 会通过 ON DELETE CASCADE 自动删除相关记录
        // 删除项目（会自动级联删除 timeline, project_files, project_notes）
        const { error: deleteError } = await supabase
            .from('projects')
            .delete()
            .eq('id', projectId);

        if (deleteError) {
            console.error('删除项目失败:', deleteError);
            return res.status(500).json({ error: '删除失败: ' + deleteError.message });
        }

        console.log('项目删除成功，ID:', projectId);
        res.json({ message: '项目删除成功' });
    } catch (err) {
        console.error('删除项目出错:', err);
        res.status(500).json({ error: err.message });
    }
});

// 更新项目
app.put('/api/projects/:id', async (req, res) => {
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

    try {
        // 权限检查：只有超级管理员或项目创建者可以更新
        if (userRole !== 'superadmin') {
            const { data: project, error: projectError } = await supabase
                .from('projects')
                .select('created_by')
                .eq('id', projectId)
                .single();

            if (projectError || !project) {
                return res.status(404).json({ error: '项目不存在' });
            }

            if (project.created_by !== parseInt(userId)) {
                return res.status(403).json({ error: '您只能修改自己创建的项目' });
            }
        }

        // 执行更新
        const { error: updateError } = await supabase
            .from('projects')
            .update({
                title: title.trim(),
                type: type || '其他',
                customer_name: customer_name ? customer_name.trim() : null,
                writer_name: writer_name ? writer_name.trim() : null,
                description: description ? description.trim() : null,
                deadline: deadline || null,
                client_price: client_price || 0,
                writer_price: writer_price || 0
            })
            .eq('id', projectId);

        if (updateError) {
            console.error('更新项目失败:', updateError);
            return res.status(500).json({ error: '更新失败: ' + updateError.message });
        }

        console.log('项目更新成功，ID:', projectId);
        res.json({ message: '项目更新成功' });
    } catch (err) {
        console.error('更新项目出错:', err);
        res.status(500).json({ error: err.message });
    }
});

// 获取用户列表（仅超级管理员）
app.get('/api/users', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, username, email, role, created_at')
            .order('created_at', { ascending: false });

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 删除用户（仅超级管理员）
app.delete('/api/users/:id', async (req, res) => {
    const userId = req.params.id;

    try {
        // 防止删除超级管理员
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id', userId)
            .single();

        if (userError || !user) {
            return res.status(404).json({ error: '用户不存在' });
        }

        if (user.role === 'superadmin') {
            return res.status(403).json({ error: '不能删除超级管理员' });
        }

        // 删除用户
        const { error: deleteError } = await supabase
            .from('users')
            .delete()
            .eq('id', userId);

        if (deleteError) {
            return res.status(500).json({ error: deleteError.message });
        }

        res.json({ message: '用户删除成功' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 更新用户（仅超级管理员）
app.put('/api/users/:id', async (req, res) => {
    const userId = req.params.id;
    const { username, password, role } = req.body;

    try {
        // 防止修改超级管理员
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id', userId)
            .single();

        if (userError || !user) {
            return res.status(404).json({ error: '用户不存在' });
        }

        if (user.role === 'superadmin') {
            return res.status(403).json({ error: '不能修改超级管理员' });
        }

        // 构建更新对象
        const updateData = {};
        if (username) updateData.username = username;
        if (password) updateData.password = password;
        if (role) updateData.role = role;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: '没有要更新的字段' });
        }

        // 执行更新
        const { error: updateError } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', userId);

        if (updateError) {
            if (updateError.code === '23505') {
                return res.status(400).json({ error: '用户名已存在' });
            }
            return res.status(500).json({ error: updateError.message });
        }

        res.json({ message: '用户更新成功' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 获取项目沟通记录
app.get('/api/projects/:id/notes', async (req, res) => {
    const projectId = req.params.id;

    try {
        const { data, error } = await supabase
            .from('project_notes')
            .select(`
                *,
                users!project_notes_created_by_fkey(username)
            `)
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        // 格式化数据
        const formattedData = data.map(note => ({
            ...note,
            creator_name: note.users?.username || null,
            users: undefined
        }));

        res.json(formattedData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 添加项目沟通记录
app.post('/api/projects/:id/notes', async (req, res) => {
    const projectId = req.params.id;
    const { content, created_by } = req.body;

    if (!content || !content.trim()) {
        return res.status(400).json({ error: '沟通内容不能为空' });
    }

    if (!created_by) {
        return res.status(400).json({ error: '创建者ID不能为空' });
    }

    try {
        const { data, error } = await supabase
            .from('project_notes')
            .insert([{
                project_id: projectId,
                content: content.trim(),
                created_by
            }])
            .select();

        if (error) {
            console.error('保存沟通记录失败:', error);
            return res.status(500).json({ error: '保存失败: ' + error.message });
        }

        res.json({ id: data[0].id, message: '沟通记录保存成功' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 删除项目沟通记录
app.delete('/api/projects/:projectId/notes/:noteId', async (req, res) => {
    const { projectId, noteId } = req.params;
    const userId = req.query.userId;
    const userRole = req.query.userRole;

    try {
        // 权限检查
        if (userRole !== 'superadmin') {
            const { data: note, error: noteError } = await supabase
                .from('project_notes')
                .select('created_by')
                .eq('id', noteId)
                .single();

            if (noteError || !note) {
                return res.status(404).json({ error: '记录不存在' });
            }

            if (note.created_by !== parseInt(userId)) {
                return res.status(403).json({ error: '您只能删除自己创建的记录' });
            }
        }

        // 执行删除
        const { error: deleteError } = await supabase
            .from('project_notes')
            .delete()
            .eq('id', noteId)
            .eq('project_id', projectId);

        if (deleteError) {
            return res.status(500).json({ error: deleteError.message });
        }

        res.json({ message: '记录删除成功' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 只在非 Vercel 环境下启动服务器
if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        console.log(`项目管理系统运行在 http://localhost:${PORT}`);
        console.log('使用 Supabase 数据库');
    });
}

// 导出 app 供 Vercel 使用
module.exports = app;
