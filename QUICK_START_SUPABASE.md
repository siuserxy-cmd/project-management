# Supabase 快速开始指南

## 🚀 5 分钟完成配置

### 步骤 1: 创建 Supabase 项目 (2 分钟)

1. 访问 https://supabase.com
2. 点击 "Start your project"
3. 使用 GitHub 账号登录（或注册新账号）
4. 点击 "New Project"
5. 填写项目信息：
   - **Name**: `project-management`
   - **Database Password**: 设置一个强密码（至少 12 位）
   - **Region**: 选择 `Southeast Asia (Singapore)` 或 `Northeast Asia (Tokyo)`
   - **Pricing Plan**: 选择 **Free**（每月免费 500MB 数据库）
6. 点击 "Create new project"
7. 等待 1-2 分钟，项目创建完成

### 步骤 2: 获取 API 密钥 (1 分钟)

1. 在项目面板左侧，点击 ⚙️ **Settings**
2. 点击 **API**
3. 复制以下信息：

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 步骤 3: 配置项目 (1 分钟)

1. 打开项目根目录的 `.env` 文件
2. 粘贴您的配置：

```env
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PORT=3001
```

3. 保存文件

### 步骤 4: 初始化数据库 (1 分钟)

1. 在 Supabase 项目面板，点击左侧的 🔍 **SQL Editor**
2. 点击 **New Query**
3. 打开项目中的 `scripts/supabase-init.sql` 文件
4. 复制全部内容（Ctrl+A, Ctrl+C）
5. 粘贴到 Supabase SQL Editor（Ctrl+V）
6. 点击 ▶️ **Run** 按钮执行
7. 看到 "Success. No rows returned" 表示成功

### 步骤 5: 验证配置 (30 秒)

在项目目录运行：

```bash
npm run check:supabase
```

如果看到以下输出，说明配置成功：

```
✅ SUPABASE_URL: https://xxxxxxxxxxxxx.supabase.co
✅ SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIs...
✅ SUPABASE_SERVICE_ROLE_KEY: eyJhbGciOiJIUzI1NiIs...
✅ 数据库连接成功!
✅ 表 users 存在
✅ 表 customers 存在
...
🎉 所有检查通过！Supabase 配置正确！
```

### 步骤 6: 启动项目 (10 秒)

```bash
npm run start:supabase
```

访问: http://localhost:3001

默认账号: `superadmin` / `123456`

---

## 🎯 完成！

您已经成功将项目迁移到 Supabase！

## 📊 Supabase 控制台功能

现在您可以在 Supabase 控制台使用以下功能：

### 📝 Table Editor（表编辑器）
- 可视化查看和编辑数据
- 添加、修改、删除记录
- 导入/导出 CSV

**位置**: 左侧菜单 → Table Editor

### 📈 Database（数据库）
- 查看数据库结构
- 创建索引
- 管理外键关系

**位置**: 左侧菜单 → Database

### 🔍 SQL Editor（SQL 编辑器）
- 执行自定义 SQL 查询
- 保存常用查询
- 查看执行历史

**位置**: 左侧菜单 → SQL Editor

### 🔐 Authentication（认证）
- 管理用户
- 配置登录方式
- 设置 JWT 密钥

**位置**: 左侧菜单 → Authentication

### 📊 Logs（日志）
- 查看 API 请求日志
- 监控性能
- 调试问题

**位置**: 左侧菜单 → Logs

---

## 🔄 在 SQLite 和 Supabase 之间切换

### 使用 Supabase:
```bash
npm run start:supabase
```

### 回到 SQLite:
```bash
npm run start:sqlite
```

---

## ❓ 常见问题

### Q1: 数据库连接失败
**错误**: `数据库连接测试失败`

**解决**:
1. 检查 `.env` 文件中的 URL 和 Key 是否正确
2. 确保复制时没有多余的空格
3. 检查网络连接

### Q2: 表不存在
**错误**: `relation "users" does not exist`

**解决**:
在 Supabase SQL Editor 中重新执行 `scripts/supabase-init.sql`

### Q3: 权限错误
**错误**: `permission denied for table xxx`

**解决**:
确保使用的是 `SUPABASE_SERVICE_ROLE_KEY`，而不是 `SUPABASE_ANON_KEY`

### Q4: 文件上传失败
**说明**:
当前版本文件仍存储在本地服务器的 `uploads` 目录。
如需使用 Supabase Storage，请参考 Supabase 官方文档。

---

## 📚 下一步

1. ✅ **测试所有功能**: 创建项目、上传文件、添加用户
2. ✅ **查看数据**: 在 Supabase Table Editor 中查看数据
3. ✅ **备份数据**: Supabase 提供自动备份（免费版 7 天保留）
4. ✅ **监控使用量**: 在 Settings → Usage 中查看

---

## 🎓 学习资源

- 📖 Supabase 官方文档: https://supabase.com/docs
- 🎥 Supabase 视频教程: https://www.youtube.com/@Supabase
- 💬 Discord 社区: https://discord.supabase.com
- 📝 详细迁移指南: 查看 `SUPABASE_MIGRATION_GUIDE.md`

---

## 🆘 需要帮助？

如果遇到问题：

1. 运行诊断工具: `npm run check:supabase`
2. 查看完整迁移指南: `SUPABASE_MIGRATION_GUIDE.md`
3. 检查 Supabase 项目状态
4. 在项目 Issues 中提问

---

**祝您使用愉快！** 🎉
