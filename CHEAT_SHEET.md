# Supabase 快速参考

## 🚀 快速命令

```bash
# 检查 Supabase 配置
npm run check:supabase

# 启动 Supabase 版本
npm run start:supabase

# 开发模式（自动重启）
npm run dev:supabase

# 切换回 SQLite
npm run start:sqlite
```

## 📋 配置清单

### .env 文件必填项

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

### 获取配置位置

Supabase 控制台 → Settings → API

## 🗄️ 数据库初始化

1. Supabase 控制台 → SQL Editor
2. 复制 `scripts/supabase-init.sql` 内容
3. 粘贴并点击 Run

## 🔍 常用 SQL 查询

### 查看所有用户
```sql
SELECT * FROM users;
```

### 查看所有项目
```sql
SELECT * FROM projects ORDER BY created_at DESC;
```

### 查看项目统计
```sql
SELECT status, COUNT(*) as count
FROM projects
GROUP BY status;
```

### 清空所有数据（谨慎使用）
```sql
TRUNCATE users, projects, customers, writers,
         timeline, project_files, project_notes
RESTART IDENTITY CASCADE;
```

## 📊 Supabase 控制台快捷方式

| 功能 | 路径 |
|-----|------|
| 表编辑器 | Table Editor → 选择表 |
| SQL 编辑器 | SQL Editor → New Query |
| 用户管理 | Authentication → Users |
| 数据库结构 | Database → Tables |
| API 文档 | API Docs |
| 日志查看 | Logs → API / Database |

## 🔧 故障排查

### 连接失败
```bash
# 1. 检查配置
npm run check:supabase

# 2. 验证 .env 文件
cat .env

# 3. 测试网络
ping supabase.com
```

### 表不存在
```sql
-- 在 SQL Editor 执行
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
```

### 重置数据库
在 SQL Editor 重新运行 `supabase-init.sql`

## 🎯 默认账号

```
用户名: superadmin
密码: 123456
角色: superadmin
```

## 📁 文件结构

```
项目管理/
├── config/database.js          # 数据库配置
├── server-supabase.js          # Supabase 版本
├── server-sqlite.js            # SQLite 备份
├── scripts/
│   ├── supabase-init.sql       # 数据库初始化
│   └── check-supabase.js       # 配置检查
├── .env                        # 环境变量（需配置）
└── QUICK_START_SUPABASE.md     # 快速开始
```

## 🌐 有用的链接

- 🏠 Supabase 控制台: https://app.supabase.com
- 📚 官方文档: https://supabase.com/docs
- 💬 Discord 社区: https://discord.supabase.com
- 🐛 GitHub Issues: https://github.com/supabase/supabase/issues

## 💡 小技巧

### 1. 查看实时日志
Supabase 控制台 → Logs → API

### 2. 导出数据
Table Editor → 选择表 → Export to CSV

### 3. 导入数据
Table Editor → 选择表 → Insert → Import data from CSV

### 4. 自动格式化 SQL
在 SQL Editor 中按 `Ctrl + Shift + F`

### 5. 快速搜索表
在 Table Editor 使用搜索框

## 🔐 安全最佳实践

1. ✅ 不要提交 `.env` 到 Git
2. ✅ 使用 `SERVICE_ROLE_KEY` 仅在后端
3. ✅ 定期更换密码
4. ✅ 启用 Row Level Security（可选）
5. ✅ 监控 API 使用量

## 📈 性能优化

### 检查慢查询
```sql
SELECT * FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### 查看表大小
```sql
SELECT
    table_name,
    pg_size_pretty(pg_total_relation_size(quote_ident(table_name)))
FROM information_schema.tables
WHERE table_schema = 'public';
```

## 🎨 数据类型对照表

| JavaScript | PostgreSQL | 示例 |
|-----------|-----------|------|
| String | TEXT | 'Hello' |
| Number (整数) | BIGINT | 123 |
| Number (小数) | DECIMAL | 99.99 |
| Boolean | BOOLEAN | true |
| Date | TIMESTAMPTZ | NOW() |
| Object | JSONB | {"key": "value"} |

---

**记住**: 这只是快速参考，详细信息请查看完整文档！
