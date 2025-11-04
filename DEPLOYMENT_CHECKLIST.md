# ✅ 部署前检查清单

## 第 1 部分：本地准备

- [ ] **项目已提交到 Git**
  ```bash
  cd /Users/yger/WithFaith/wangfeng-fan-website
  git status  # 应该显示 "On branch main" 且没有未提交的改动
  ```

- [ ] **项目已推送到 GitHub/GitLab**
  ```bash
  git remote -v  # 应该显示 origin URL
  git log --oneline | head -5  # 显示最近的提交
  ```

- [ ] **public 目录存在且完整**
  ```bash
  du -sh frontend/public/  # 应该显示 ~10GB
  ls frontend/public/music | wc -l  # 应该显示 ~200
  ```

- [ ] **.gitignore 配置正确**
  ```bash
  grep "frontend/public" .gitignore  # 应该有输出
  git status  # 确保 public 目录不在 git 追踪中
  ```

## 第 2 部分：服务器准备

- [ ] **知道服务器 root 密码**
  - [ ] 记得密码
  - [ ] 不记得 - 需要在阿里云控制台重置

- [ ] **服务器 IP 正确**
  - 你的服务器 IP：`47.111.177.153`
  - 根据阿里云控制台确认

- [ ] **可以 SSH 登录服务器**
  ```bash
  ssh root@47.111.177.153
  # 输入密码后应该能登录
  echo "登录成功！"
  exit  # 退出
  ```

- [ ] **/opt 目录存在**
  ```bash
  ssh root@47.111.177.153 "ls -la /opt"
  ```

## 第 3 部分：GitHub 仓库检查

- [ ] **仓库公开或有访问权限**
  - 仓库 URL：https://github.com/用户名/wangfeng-fan-website

- [ ] **.gitignore 中包含以下项**
  - `frontend/public/`
  - `frontend/.env.local`
  - `frontend/.env.production`
  - `backend/.env`

- [ ] **README.md 中有安装和运行说明**

## 第 4 部分：部署步骤

按顺序执行（每步完成后打勾）：

1. [ ] **在服务器上克隆项目**
   ```bash
   ssh root@47.111.177.153
   cd /opt
   git clone https://github.com/用户名/wangfeng-fan-website.git
   cd wangfeng-fan-website
   ls -la
   exit
   ```

2. [ ] **从本地上传 public 资源**
   ```bash
   cd /Users/yger/WithFaith/wangfeng-fan-website
   scp -r frontend/public root@47.111.177.153:/opt/wangfeng-fan-website/frontend/
   ```

3. [ ] **验证部署**
   ```bash
   ssh root@47.111.177.153 "ls -la /opt/wangfeng-fan-website/frontend/public"
   ```

## 第 5 部分：后续配置

- [ ] **配置服务器环境**
  ```bash
  ssh root@47.111.177.153
  cd /opt/wangfeng-fan-website

  # 创建 .env 文件
  cp backend/.env.example backend/.env
  # 编辑 backend/.env，配置数据库等

  exit
  ```

- [ ] **安装依赖**
  ```bash
  ssh root@47.111.177.153
  cd /opt/wangfeng-fan-website/backend
  pip install -r requirements.txt

  cd /opt/wangfeng-fan-website/frontend
  npm install
  npm run build
  ```

- [ ] **配置 Nginx**
  - 参考 `DEPLOYMENT_GUIDE_v4.md`

- [ ] **启动服务**
  - 后端：`python3 start.py`
  - 前端：Nginx 配置

---

## 🚨 常见问题

| 问题 | 解决方案 |
|------|--------|
| git clone 失败 | 确认仓库 URL，用 HTTPS 而不是 SSH |
| scp 上传失败 | 确认密码正确，或用 SSH 密钥 |
| /opt 目录不存在 | 用 `mkdir -p /opt` 创建 |
| 权限不足 | 确保用 `root` 用户，或用 `sudo` |

---

## 📞 需要帮助？

如果部署过程中遇到问题，请保留以下信息：
1. 错误信息的完整文本
2. 你执行的命令
3. 执行命令的位置（本地还是服务器）

