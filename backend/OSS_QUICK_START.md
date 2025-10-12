# 阿里云 OSS 快速配置清单 ⚡

**5 分钟完成配置！**

## ✅ 第一步：阿里云控制台（3 分钟）

### 1. 创建 OSS Bucket
🔗 https://oss.console.aliyun.com/

- Bucket 名称: `wangfeng-fan-website`（或任意名称）
- 地域: **华东1-杭州**（或离你最近的）
- 读写权限: **⚠️ 公共读**（重要！）
- 存储类型: 标准存储

### 2. 获取访问凭证
🔗 https://ram.console.aliyun.com/users

- 创建 RAM 用户: `oss-uploader`
- 访问方式: ✅ **编程访问**
- 授权策略: `AliyunOSSFullAccess`
- **保存 AccessKey ID 和 Secret**（只显示一次）

### 3. 记录 Endpoint
返回 OSS 控制台 → 你的 Bucket → 概览页面

复制 **外网访问 Endpoint**，例如：
- `oss-cn-hangzhou.aliyuncs.com`
- `oss-cn-beijing.aliyuncs.com`

## ✅ 第二步：配置后端（2 分钟）

### 1. 复制配置文件

```bash
cd backend
cp .env.oss.example .env
```

### 2. 编辑 `.env` 文件

```bash
# 改为使用 OSS
STORAGE_TYPE=oss

# 填入你的配置
OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com     # 你的 Endpoint
OSS_ACCESS_KEY=LTAI5tXXXXXXXXXXXXXX           # 你的 AccessKey ID
OSS_SECRET_KEY=YourSecretKeyXXXXXXXXXX        # 你的 AccessKey Secret
OSS_BUCKET=wangfeng-fan-website                # 你的 Bucket 名称
```

### 3. 重启后端

```bash
python start.py
```

看到这个就成功了：
```
✅ 阿里云 OSS 已连接: wangfeng-fan-website
```

## ✅ 测试

1. 打开网站，登录管理员账号
2. 进入"写文章"页面
3. 上传一张图片
4. 图片能正常显示 = 配置成功！

## 🚨 遇到问题？

### 图片上传后显示 403 Forbidden
- **原因**: Bucket 权限未设置为"公共读"
- **解决**: OSS 控制台 → Bucket → 权限管理 → 改为"公共读"

### 后端报错 "Access Denied"
- **原因**: AccessKey 权限不足
- **解决**: 确认 RAM 用户有 `AliyunOSSFullAccess` 权限

### 后端报错 "Bucket 不存在"
- **原因**: Bucket 名称配置错误
- **解决**: 检查 `.env` 中的 `OSS_BUCKET` 是否和控制台一致

## 💡 进阶配置（可选）

### 配置自定义域名（需要已备案域名）

1. OSS 控制台 → 域名管理 → 绑定域名 `img.yourdomain.com`
2. DNS 添加 CNAME 记录指向 Bucket 域名
3. 更新 `.env`：
   ```bash
   OSS_CUSTOM_DOMAIN=img.yourdomain.com
   ```

### 开启 CDN 加速（推荐）

在绑定域名时勾选"自动添加 CNAME 记录"和"开启 CDN 加速"。

## 📖 完整文档

详细说明请查看：`OSS_MIGRATION_GUIDE.md`

## 💰 费用估算

小型网站（1000 张图片，日访问 1000 次）：**约 ¥5-10/月**

- 存储费用: ¥0.06/月
- 流量费用: ¥3-8/月（取决于访问量）
- 请求费用: ¥0.1/月

**开启 CDN 可降低 50% 流量费用！**
