# Supabase 迁移指南

本指南将帮助您将项目从 SQLite 数据库迁移到 Supabase（PostgreSQL）数据库。

## 迁移步骤

### 1. 创建 Supabase 项目

1. 访问 [Supabase 官网](https://supabase.com)
2. 注册/登录账号
3. 创建新项目：
   - 项目名称: `project-management`
   - 数据库密码: 设置一个强密码并记住
   - 区域: 选择 `Singapore` 或 `Tokyo`（离中国最近）
   - 定价: 选择 **Free Plan**（免费套餐）

### 2. 获取 Supabase 配置信息

项目创建完成后：

1. 进入项目控制台
2. 点击左侧菜单 **Settings（设置）** → **API**
3. 复制以下信息：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: 以 `eyJ` 开头的长字符串
   - **service_role key**: 以 `eyJ` 开头的长字符串（仅后端使用）

### 3. 配置环境变量

编辑项目根目录的 `.env` 文件，填入您的 Supabase 配置：

```env
# Supabase 配置
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# 服务器配置
PORT=3001

# 文件上传配置
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads
```

### 4. 初始化 Supabase 数据库

1. 在 Supabase 控制台，点击左侧菜单 **SQL Editor**
2. 点击 **New Query**
3. 复制 `scripts/supabase-init.sql` 文件的全部内容
4. 粘贴到 SQL 编辑器中
5. 点击 **Run** 执行脚本

这将创建所有必要的数据表和示例数据。

### 5. 切换到 Supabase 版本

#### 方法一：重命名文件（推荐）

```bash
# 备份原有的 server.js
mv server.js server-sqlite.js

# 使用新的 Supabase 版本
mv server-supabase.js server.js
```

#### 方法二：直接使用 Supabase 版本

修改 `package.json` 中的启动脚本：

```json
{
  "scripts": {
    "start": "node server-supabase.js",
    "dev": "nodemon server-supabase.js",
    "start-sqlite": "node server-sqlite.js"
  }
}
```

### 6. 启动服务器

```bash
npm start
```

查看控制台输出，应该看到：

```
✓ Supabase 数据库连接成功
项目管理系统运行在 http://localhost:3001
使用 Supabase 数据库
```

### 7. 测试功能

访问 `http://localhost:3001` 并测试以下功能：

- ✅ 用户登录（superadmin / 123456）
- ✅ 创建项目
- ✅ 查看项目列表
- ✅ 上传文件
- ✅ 添加沟通记录
- ✅ 用户管理（超级管理员）

## 数据迁移（可选）

如果您有现有的 SQLite 数据需要迁移到 Supabase：

### 导出 SQLite 数据

```bash
# 导出用户数据
sqlite3 database.db "SELECT * FROM users;" -csv > users.csv

# 导出项目数据
sqlite3 database.db "SELECT * FROM projects;" -csv > projects.csv

# 导出其他表...
```

### 导入到 Supabase

1. 在 Supabase 控制台，进入 **Table Editor**
2. 选择对应的表
3. 点击 **Insert** → **Import data from CSV**
4. 上传导出的 CSV 文件

**注意**: 由于 ID 字段的差异（SQLite 的 INTEGER vs PostgreSQL 的 BIGSERIAL），您可能需要手动调整 ID 和外键关系。

## Supabase vs SQLite 主要差异

### 数据类型变化

| SQLite | PostgreSQL/Supabase | 说明 |
|--------|---------------------|------|
| `INTEGER PRIMARY KEY AUTOINCREMENT` | `BIGSERIAL PRIMARY KEY` | 自增主键 |
| `REAL` | `DECIMAL(10, 2)` | 价格等精确数值 |
| `DATETIME` | `TIMESTAMPTZ` | 带时区的时间戳 |
| `datetime('now')` | `NOW()` | 当前时间 |

### SQL 语法差异

**SQLite**:
```sql
datetime('now')
CURRENT_TIMESTAMP
```

**PostgreSQL**:
```sql
NOW()
CURRENT_TIMESTAMP
```

### 外键级联删除

Supabase (PostgreSQL) 支持 `ON DELETE CASCADE`，当删除父记录时自动删除相关子记录。

示例：
```sql
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
```

这意味着删除项目时，相关的时间线、文件、沟通记录会自动删除。

## Supabase 额外功能

迁移到 Supabase 后，您可以使用以下额外功能：

### 1. 实时订阅（Real-time）

```javascript
// 监听项目变化
const channel = supabase
  .channel('projects-changes')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'projects' },
    (payload) => {
      console.log('项目发生变化:', payload);
    }
  )
  .subscribe();
```

### 2. Row Level Security (RLS)

在 Supabase 控制台中启用 RLS，限制用户只能访问自己的数据：

```sql
-- 启用 RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户只能看到自己创建的项目
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = created_by);
```

### 3. Storage（文件存储）

可以将文件上传改为使用 Supabase Storage：

```javascript
// 上传文件到 Supabase Storage
const { data, error } = await supabase.storage
  .from('project-files')
  .upload(`${projectId}/${filename}`, file);
```

### 4. 自动备份

Supabase 提供自动每日备份功能（付费计划）。

## 性能优化建议

### 1. 使用索引

数据库初始化脚本已经创建了以下索引：

```sql
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_timeline_project_id ON timeline(project_id);
CREATE INDEX idx_project_files_project_id ON project_files(project_id);
CREATE INDEX idx_project_notes_project_id ON project_notes(project_id);
```

### 2. 使用连接查询

Supabase 支持复杂的 JOIN 查询：

```javascript
const { data } = await supabase
  .from('projects')
  .select(`
    *,
    users!projects_created_by_fkey(username),
    project_notes(count)
  `)
  .eq('status', '待接单');
```

### 3. 分页查询

对于大量数据，使用分页：

```javascript
const { data } = await supabase
  .from('projects')
  .select('*')
  .range(0, 9)  // 获取前 10 条记录
  .order('created_at', { ascending: false });
```

## 故障排查

### 连接失败

**问题**: `数据库连接测试失败`

**解决方案**:
1. 检查 `.env` 文件中的 `SUPABASE_URL` 和 `SUPABASE_SERVICE_ROLE_KEY` 是否正确
2. 确保网络连接正常
3. 检查 Supabase 项目是否处于激活状态

### 权限错误

**问题**: `permission denied for table xxx`

**解决方案**:
1. 确保使用的是 `service_role` key，而不是 `anon` key
2. 检查 Supabase 控制台中的 RLS 策略设置

### 数据类型错误

**问题**: `invalid input syntax for type bigint`

**解决方案**:
- 确保传递给数据库的 ID 是数字类型，而不是字符串
- 使用 `parseInt()` 转换字符串为数字

## 回滚到 SQLite

如果需要回滚到 SQLite：

```bash
# 恢复原有的 server.js
mv server.js server-supabase.js
mv server-sqlite.js server.js

# 或者修改 package.json 启动脚本
npm run start-sqlite
```

## 支持和帮助

- **Supabase 官方文档**: https://supabase.com/docs
- **Supabase Discord 社区**: https://discord.supabase.com
- **GitHub Issues**: 在项目仓库提交问题

## 下一步

✅ 数据库迁移完成后，建议：

1. 测试所有功能
2. 更新部署文档
3. 考虑启用 Supabase 的高级功能（实时订阅、RLS 等）
4. 设置生产环境的备份策略
5. 监控数据库性能和使用情况

祝您使用愉快！
