# 项目管理系统 - Supabase 版本

## 快速开始

### 1. 配置环境变量

复制 `.env` 文件并填入您的 Supabase 配置：

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORT=3001
```

### 2. 初始化 Supabase 数据库

在 Supabase SQL Editor 中执行 `scripts/supabase-init.sql` 脚本。

### 3. 安装依赖

```bash
npm install
```

### 4. 启动服务器

**使用 Supabase 版本:**
```bash
node server-supabase.js
```

或者切换 server.js:
```bash
# 备份 SQLite 版本
mv server.js server-sqlite.js

# 使用 Supabase 版本
mv server-supabase.js server.js

# 启动
npm start
```

### 5. 访问系统

打开浏览器访问: `http://localhost:3001`

默认账号:
- 超级管理员: `superadmin` / `123456`
- 普通管理员: `admin1` / `123456`

## 项目结构

```
项目管理/
├── config/
│   └── database.js          # Supabase 数据库配置
├── scripts/
│   ├── init-db.js           # SQLite 初始化脚本（旧版）
│   └── supabase-init.sql    # Supabase 初始化 SQL
├── public/                  # 前端文件
├── uploads/                 # 文件上传目录
├── server.js                # 主服务器文件（当前使用的版本）
├── server-sqlite.js         # SQLite 版本（备份）
├── server-supabase.js       # Supabase 版本
├── .env                     # 环境变量配置
├── .env.example             # 环境变量示例
└── SUPABASE_MIGRATION_GUIDE.md  # 迁移指南

## 功能特性

✅ 用户认证和授权
✅ 项目管理（创建、编辑、删除、状态跟踪）
✅ 客户和写手管理
✅ 文件上传和管理
✅ 项目沟通记录
✅ 用户管理（超级管理员）
✅ 云端数据库（Supabase PostgreSQL）
✅ 自动备份（Supabase 提供）

## Supabase 优势

相比 SQLite 版本，Supabase 版本提供：

1. **云端访问**: 数据存储在云端，可从任何地方访问
2. **高并发**: 支持多用户同时访问
3. **实时功能**: 支持实时数据订阅
4. **自动备份**: Supabase 提供自动备份
5. **扩展性**: 轻松扩展到大型应用
6. **安全性**: Row Level Security (RLS) 保护数据
7. **免费额度**: 500MB 数据库，1GB 文件存储

## 数据库表结构

- **users**: 用户表
- **projects**: 项目表
- **customers**: 客户表
- **writers**: 写手表
- **timeline**: 项目时间线
- **project_files**: 项目文件
- **project_notes**: 项目沟通记录

## API 端点

### 用户相关
- `POST /api/register` - 用户注册
- `POST /api/login` - 用户登录
- `GET /api/users` - 获取用户列表（超级管理员）
- `PUT /api/users/:id` - 更新用户
- `DELETE /api/users/:id` - 删除用户

### 项目相关
- `GET /api/projects` - 获取项目列表
- `POST /api/projects` - 创建项目
- `PUT /api/projects/:id` - 更新项目
- `DELETE /api/projects/:id` - 删除项目
- `PUT /api/projects/:id/status` - 更新项目状态
- `GET /api/projects/:id/timeline` - 获取项目时间线

### 文件相关
- `POST /api/upload` - 上传文件
- `GET /api/projects/:id/files` - 获取项目文件
- `DELETE /api/files/:id` - 删除文件

### 沟通记录
- `GET /api/projects/:id/notes` - 获取沟通记录
- `POST /api/projects/:id/notes` - 添加沟通记录
- `DELETE /api/projects/:projectId/notes/:noteId` - 删除沟通记录

### 客户和写手
- `GET /api/customers` - 获取客户列表
- `POST /api/customers` - 添加客户
- `GET /api/writers` - 获取写手列表
- `POST /api/writers` - 添加写手

## 环境变量说明

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `SUPABASE_URL` | Supabase 项目 URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase 公开密钥 | `eyJhb...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务密钥 | `eyJhb...` |
| `PORT` | 服务器端口 | `3001` |
| `MAX_FILE_SIZE` | 最大文件大小（字节） | `10485760` (10MB) |
| `UPLOAD_DIR` | 上传目录 | `uploads` |

## 部署

### 本地部署

```bash
npm start
```

### 生产环境部署

1. **设置环境变量**: 在服务器上配置 `.env` 文件
2. **使用 PM2 运行**:
   ```bash
   npm install -g pm2
   pm2 start server-supabase.js --name project-management
   pm2 save
   pm2 startup
   ```

### 宝塔部署

1. 创建 Node.js 项目
2. 上传代码到服务器
3. 配置环境变量
4. 启动项目

详见 `宝塔部署指南.md`

## 常见问题

### Q: 如何获取 Supabase 配置？
A: 在 Supabase 控制台的 Settings → API 中获取。

### Q: 数据库连接失败怎么办？
A: 检查 `.env` 文件配置是否正确，确保网络连接正常。

### Q: 如何回滚到 SQLite？
A: 将 `server-sqlite.js` 改名为 `server.js` 即可。

### Q: 文件上传失败？
A: 检查 `uploads` 目录权限，确保应用有写入权限。

### Q: 如何备份数据？
A: Supabase 提供自动备份，也可以在控制台手动导出数据。

## 技术栈

- **后端**: Node.js + Express
- **数据库**: Supabase (PostgreSQL)
- **文件上传**: Multer
- **前端**: 原生 HTML/CSS/JavaScript

## 开发

### 开发模式

```bash
npm run dev
```

使用 nodemon 自动重启服务器。

### 数据库迁移

如需从 SQLite 迁移数据到 Supabase，请参考 [SUPABASE_MIGRATION_GUIDE.md](SUPABASE_MIGRATION_GUIDE.md)。

## 许可证

MIT

## 联系方式

如有问题，请提交 Issue 或联系开发者。

---

**提示**: 首次使用请先阅读 [SUPABASE_MIGRATION_GUIDE.md](SUPABASE_MIGRATION_GUIDE.md) 完成配置。
