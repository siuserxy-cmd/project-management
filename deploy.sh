#!/bin/bash
# 项目管理系统部署脚本

echo "🚀 开始部署项目管理系统..."

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then
  echo "❌ 请使用 root 用户运行此脚本"
  exit 1
fi

# 更新系统
echo "📦 更新系统包..."
apt update && apt upgrade -y

# 安装 Node.js
echo "📦 安装 Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# 安装 PM2
echo "📦 安装 PM2..."
npm install -g pm2

# 安装 Nginx
echo "📦 安装 Nginx..."
apt install nginx -y
systemctl start nginx
systemctl enable nginx

# 创建项目目录
echo "📁 创建项目目录..."
mkdir -p /home/项目管理
mkdir -p /home/项目管理/logs
mkdir -p /home/项目管理/uploads
mkdir -p /home/backup

# 设置权限
chown -R www-data:www-data /home/项目管理/uploads
chmod 755 /home/项目管理/uploads

# 进入项目目录
cd /home/项目管理

# 安装项目依赖
echo "📦 安装项目依赖..."
npm install

# 初始化数据库
echo "🗄️ 初始化数据库..."
node scripts/init-db.js

# 启动项目
echo "🚀 启动项目..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# 配置防火墙
echo "🔒 配置防火墙..."
ufw --force enable
ufw allow ssh
ufw allow 'Nginx Full'

echo "✅ 部署完成！"
echo "📝 接下来的步骤："
echo "1. 配置域名解析指向服务器IP"
echo "2. 配置 Nginx 虚拟主机"
echo "3. 申请 SSL 证书"
echo "4. 测试网站功能"
echo ""
echo "🌐 当前可以通过 http://服务器IP 访问"
echo "📊 查看应用状态: pm2 status"
echo "📋 查看应用日志: pm2 logs"