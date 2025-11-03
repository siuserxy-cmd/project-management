# Vercel 部署指南

## ⚠️ 重要提示

**Vercel 不是此项目的最佳部署平台**，因为：
- ❌ 文件上传会在重启后丢失（无持久存储）
- ❌ 必须使用 Supabase（不能使用 SQLite）
- ⚠️ 更适合前端项目，不适合传统后端

**推荐使用**: Railway 或 Render（见下方）

---

## 如果您坚持使用 Vercel

### 前提条件

1. ✅ **必须配置 Supabase**
   - 在 Supabase 创建项目
   - 执行 `scripts/supabase-init.sql` 初始化数据库

2. ⚠️ **文件上传限制**
   - 上传的文件会在服务重启后丢失
   - 建议迁移到 Supabase Storage

### 部署步骤

#### 1. 在 Vercel 配置环境变量

访问您的 Vercel 项目设置 → Environment Variables，添加：

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORT=3001
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads
NODE_ENV=production
```

#### 2. 部署项目

**方式 A: 通过 Vercel 控制台**
1. 访问 https://vercel.com
2. 点击 "Add New" → "Project"
3. 导入您的 GitHub 仓库 `project-management`
4. Vercel 会自动检测 `vercel.json` 配置
5. 添加环境变量
6. 点击 "Deploy"

**方式 B: 通过 Vercel CLI**
```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录
vercel login

# 部署
vercel

# 部署到生产环境
vercel --prod
```

#### 3. 配置完成后

访问 Vercel 提供的 URL，例如：
```
https://project-management-xxx.vercel.app
```

---

## 🚀 推荐的替代方案

### Railway（强烈推荐）✨

**优点**：
- ✅ 完美支持 Node.js + Express
- ✅ 持久文件存储
- ✅ 免费 500 小时/月
- ✅ 自动 HTTPS
- ✅ 一键部署

**部署步骤**：
1. 访问 https://railway.app
2. 使用 GitHub 登录
3. New Project → Deploy from GitHub
4. 选择 `project-management` 仓库
5. 添加环境变量（Supabase 配置）
6. 自动部署完成

配置文件已创建：`railway.json`

---

### Render

**优点**：
- ✅ 免费套餐
- ✅ 持久磁盘
- ✅ 自动 SSL
- ✅ 简单易用

**部署步骤**：
1. 访问 https://render.com
2. 连接 GitHub
3. New → Web Service
4. 选择仓库
5. 添加环境变量
6. 部署

配置文件已创建：`render.yaml`

---

## 📋 Vercel 限制和解决方案

### 问题 1: 文件上传丢失

**问题**: uploads 目录的文件会在重启后消失

**解决方案**: 使用 Supabase Storage

1. 在 Supabase 创建 Storage Bucket
2. 修改文件上传代码使用 Supabase Storage API
3. 参考：https://supabase.com/docs/guides/storage

### 问题 2: SQLite 不可用

**问题**: Vercel 无服务器环境不支持 SQLite

**解决方案**: 必须使用 Supabase 数据库
- 项目已配置 `server-supabase.js`
- `vercel.json` 已指向该文件

### 问题 3: 冷启动

**问题**: 无服务器函数冷启动较慢

**解决方案**:
- 使用 Vercel Pro（保持温暖）
- 或切换到 Railway/Render

---

## 🎯 总结

| 平台 | 适合度 | 免费额度 | 文件存储 | 数据库 |
|-----|-------|---------|---------|--------|
| **Railway** | ⭐⭐⭐⭐⭐ | 500h/月 | ✅ 持久 | ✅ 全支持 |
| **Render** | ⭐⭐⭐⭐ | 750h/月 | ✅ 持久 | ✅ 全支持 |
| **Vercel** | ⭐⭐ | 无限 | ❌ 临时 | ⚠️ 仅云端 |

**建议**: 优先考虑 Railway 或 Render！

---

## 💡 快速切换到 Railway

```bash
# 1. 提交当前更改
git add .
git commit -m "Add deployment configs"
git push

# 2. 访问 Railway
# https://railway.app

# 3. 一键部署
# New Project → Deploy from GitHub → 选择仓库
```

完成！🎉

---

## 需要帮助？

- Railway 文档: https://docs.railway.app
- Render 文档: https://render.com/docs
- Vercel 文档: https://vercel.com/docs
