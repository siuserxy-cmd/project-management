# 🚀 快速部署指南

## 最简单的部署方式

### 步骤1: 购买云服务器
**推荐配置**：
- **腾讯云轻量服务器** (新用户有优惠)
- 1核1G内存，25G硬盘
- Ubuntu 20.04 系统
- 约 ¥24/月

**购买链接**：
- 腾讯云: https://cloud.tencent.com/product/lighthouse
- 阿里云: https://www.aliyun.com/product/swas

### 步骤2: 购买域名
**推荐域名商**：
- 腾讯云域名: https://dnspod.cloud.tencent.com/ (¥55/年)
- Cloudflare: https://www.cloudflare.com/products/registrar/ ($8.57/年)

### 步骤3: 上传代码到服务器
```bash
# 方法1: 使用SCP上传
scp -r "E:\项目管理" root@你的服务器IP:/home/

# 方法2: 在服务器上直接下载
ssh root@你的服务器IP
cd /home
# 这里可以从Git仓库下载或手动上传
```

### 步骤4: 运行自动部署脚本
```bash
cd /home/项目管理
chmod +x deploy.sh
./deploy.sh
```

### 步骤5: 配置域名解析
在域名管理面板添加A记录：
- 主机记录: @
- 记录值: 你的服务器IP

### 步骤6: 配置HTTPS
```bash
# 安装SSL证书
certbot --nginx -d 你的域名.com
```

## 🎉 完成！

现在可以通过 `https://你的域名.com` 访问你的项目管理系统了！

### 默认管理员账号
- 用户名: `superadmin`
- 密码: `123456`

**⚠️ 记得立即修改默认密码！**

---

## 💰 总成本预算
- **云服务器**: ¥24-50/月
- **域名**: ¥55/年 (约¥5/月)
- **SSL证书**: 免费
- **总计**: 约¥30-55/月

## 📞 技术支持
如遇到问题，请查看详细的 `DEPLOYMENT_GUIDE.md` 文件。