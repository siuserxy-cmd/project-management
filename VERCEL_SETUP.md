# Vercel 部署配置指南

## ✅ 第 1 步：配置 Supabase 环境变量

这是**最关键**的一步！没有这些环境变量，部署会失败。

### 在 Vercel 控制台添加环境变量

1. 访问您的 Vercel 项目
2. 点击 **Settings** → **Environment Variables**
3. **逐个添加**以下变量：

#### 必填环境变量

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `SUPABASE_URL` | `https://uaddmvtgxroukugroucc.supabase.co` | 您的 Supabase 项目 URL |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZGRtdnRneHJvdWt1Z3JvdWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNjU3MTksImV4cCI6MjA3Nzc0MTcxOX0.G2_SlAXFCgUtFvcogQkj_dO7ySPuFqxErbNIMuYUPAc` | Supabase 公开密钥 |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZGRtdnRneHJvdWt1Z3JvdWNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjE2NTcxOSwiZXhwIjoyMDc3NzQxNzE5fQ.Bi8p8emDNiPX0o2PJyYUIIN3UnGObIswvUaSa8D7pks` | Supabase 服务密钥 |
| `NODE_ENV` | `production` | 环境模式 |
| `PORT` | `3001` | 端口号 |

#### 可选环境变量

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `MAX_FILE_SIZE` | `10485760` | 最大文件大小（10MB） |
| `UPLOAD_DIR` | `uploads` | 上传目录 |

### 🎯 添加步骤（重要！）

对于**每一个**环境变量：

1. 点击 **Add New**
2. **Name**: 输入变量名（如 `SUPABASE_URL`）
3. **Value**: 粘贴对应的值
4. **Environment**: 勾选 **Production**, **Preview**, **Development**（全选）
5. 点击 **Save**
6. 重复以上步骤添加所有变量

---

## ✅ 第 2 步：初始化 Supabase 数据库

**如果还没有执行**，请在 Supabase 控制台执行初始化：

1. 访问 https://app.supabase.com/project/uaddmvtgxroukugroucc
2. 点击左侧 **SQL Editor**
3. 点击 **New Query**
4. 打开本地 `scripts/supabase-init.sql` 文件
5. 复制全部内容
6. 粘贴到 SQL Editor
7. 点击 **Run** 执行

等待执行完成，应该看到 "Success" 提示。

---

## ✅ 第 3 步：部署到 Vercel

### 方式 A：通过 Vercel 控制台（推荐）

1. 访问 https://vercel.com
2. 点击 **Add New** → **Project**
3. 导入您的 GitHub 仓库：`siuserxy-cmd/project-management`
4. Vercel 会自动检测 `vercel.json` 配置
5. **不要修改任何配置**（已经在 vercel.json 中配置好了）
6. 点击 **Deploy**

### 方式 B：通过 Git 推送（自动部署）

如果您已经连接了 GitHub：

```bash
git add .
git commit -m "配置 Vercel 部署"
git push
```

Vercel 会自动检测到推送并开始部署。

---

## ✅ 第 4 步：验证部署

部署完成后：

1. Vercel 会提供一个 URL，例如：`https://project-management-xxx.vercel.app`
2. 访问该 URL
3. 使用默认账号登录：
   - 用户名：`superadmin`
   - 密码：`123456`

### 测试功能

- ✅ 登录
- ✅ 查看项目列表
- ✅ 创建新项目
- ✅ 添加客户/写手
- ⚠️ 文件上传（会有警告，见下方）

---

## ⚠️ 重要限制

### 1. 文件上传会丢失

**问题**: 在 Vercel 上传的文件会在服务器重启后消失（无服务器环境特性）

**解决方案**（3 选 1）：

#### 选项 A：接受限制（临时方案）
- 用户知晓文件可能丢失
- 仅用于演示/测试

#### 选项 B：使用 Supabase Storage（推荐）
将文件上传到 Supabase Storage：

1. 在 Supabase 创建 Storage Bucket
2. 修改上传代码使用 Supabase Storage API
3. 参考：https://supabase.com/docs/guides/storage

#### 选项 C：改用其他平台
- Railway：https://railway.app（完美支持）
- Render：https://render.com（完美支持）

### 2. 冷启动

首次访问或长时间无访问后，可能需要几秒钟启动。

### 3. 执行时间限制

免费版单个请求最多 10 秒。

---

## 🔧 故障排查

### 问题 1: 部署失败 - "No Next.js version detected"

**原因**: Vercel 没有正确识别 `vercel.json`

**解决**:
1. 确认 `vercel.json` 文件在项目根目录
2. 在 Vercel 控制台，Settings → General，确认 Root Directory 为空或 `.`
3. 重新部署

### 问题 2: 数据库连接失败

**错误**: `Could not find the table 'public.users'`

**解决**:
1. 确认环境变量已正确添加
2. 检查 Supabase 数据库是否已初始化
3. 运行本地测试：`npm run check:supabase`

### 问题 3: 500 Internal Server Error

**解决**:
1. 在 Vercel 控制台查看 Functions 日志
2. 点击部署 → **Functions** → 点击函数查看日志
3. 根据错误信息调试

### 问题 4: 页面显示不正常

**原因**: 静态文件路径问题

**解决**:
1. 检查 `vercel.json` 中的 routes 配置
2. 确认 `public` 目录存在
3. 清除浏览器缓存

---

## 📊 Vercel 配置文件说明

### vercel.json

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server-supabase.js",    // 使用 Supabase 版本
      "use": "@vercel/node"            // Node.js 运行时
    },
    {
      "src": "public/**",              // 静态文件
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/(.*\\.(css|js|png|jpg|jpeg|gif|ico|svg|html))",
      "dest": "/public/$1"             // 静态文件路由
    },
    {
      "src": "/api/(.*)",
      "dest": "/server-supabase.js"    // API 路由
    },
    {
      "src": "/(.*)",
      "dest": "/server-supabase.js"    // 默认路由
    }
  ],
  "env": {
    "NODE_ENV": "production",
    "VERCEL": "1"                      // 标识 Vercel 环境
  }
}
```

---

## 🎯 检查清单

部署前请确认：

- [ ] 已在 Vercel 添加所有环境变量
- [ ] 已在 Supabase 执行初始化 SQL
- [ ] `vercel.json` 存在且配置正确
- [ ] `server-supabase.js` 已修改支持 Vercel
- [ ] 已推送最新代码到 GitHub

部署后请验证：

- [ ] 可以访问部署的 URL
- [ ] 可以登录系统
- [ ] 可以查看项目列表
- [ ] 可以创建新项目
- [ ] 数据库读写正常

---

## 🚀 部署成功后

### 自定义域名（可选）

1. 在 Vercel 控制台，点击 **Settings** → **Domains**
2. 添加您的域名
3. 按照提示配置 DNS

### 查看分析

1. 点击 **Analytics** 查看访问统计
2. 点击 **Logs** 查看运行日志

### 自动部署

每次推送到 GitHub，Vercel 会自动重新部署。

---

## 💡 优化建议

### 1. 使用 Supabase Storage

避免文件丢失问题：

```javascript
// 上传到 Supabase Storage
const { data, error } = await supabase.storage
  .from('project-files')
  .upload(`${projectId}/${filename}`, file);
```

### 2. 添加错误监控

集成 Sentry 或其他错误监控服务。

### 3. 优化冷启动

- 使用 Vercel Pro（保持函数温暖）
- 或添加定时任务定期访问

---

## 📞 需要帮助？

- Vercel 文档：https://vercel.com/docs
- Supabase 文档：https://supabase.com/docs
- 项目 GitHub：https://github.com/siuserxy-cmd/project-management

---

**祝您部署顺利！** 🎉
