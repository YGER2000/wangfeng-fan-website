# 阿里云 OSS 迁移指南

本指南将帮助你将网站的图片存储从本地/MinIO 迁移到阿里云 OSS。

## 📋 准备工作

### 1. 在阿里云控制台创建 OSS Bucket

1. 登录 [阿里云 OSS 控制台](https://oss.console.aliyun.com/)
2. 点击"创建 Bucket"
3. 填写配置：
   - **Bucket 名称**: `wangfeng-fan-website`（全局唯一，如果被占用请换一个）
   - **地域**: 选择离用户最近的（推荐：华东1-杭州）
   - **存储类型**: 标准存储（频繁访问）
   - **读写权限**: **公共读**（重要！允许匿名用户访问图片）
   - **服务端加密**: 不加密
   - **实时日志查询**: 不开启（节省成本）
4. 点击"确定"创建

### 2. 获取 OSS 访问凭证

#### 方式一：使用 RAM 子账号（推荐，更安全）

1. 进入 [RAM 访问控制](https://ram.console.aliyun.com/)
2. 点击"用户" → "创建用户"
3. 填写用户信息：
   - **登录名称**: `oss-uploader`
   - **访问方式**: ✅ **勾选"编程访问"**（OpenAPI 调用访问）
4. 点击"确定"，**立即保存 AccessKey ID 和 AccessKey Secret**（只显示一次！）
5. 给用户授权：
   - 找到刚创建的用户，点击"添加权限"
   - 搜索并选择 `AliyunOSSFullAccess`（OSS 完全访问权限）
   - 或者创建自定义策略，只授予特定 Bucket 的权限（更安全）

#### 方式二：使用主账号 AccessKey（不推荐）

如果你要用主账号，可以在控制台右上角头像 → "AccessKey 管理"中创建。

### 3. 记录 OSS Endpoint

回到 OSS 控制台，点击你的 Bucket 名称，在"概览"页面可以看到：

- **外网访问 Endpoint**: `oss-cn-hangzhou.aliyuncs.com`（根据你选择的地域不同）
- **内网访问 Endpoint**: `oss-cn-hangzhou-internal.aliyuncs.com`（如果服务器在阿里云同地域可用，更快更便宜）

**注意**: Endpoint 格式是 `oss-cn-{region}.aliyuncs.com`，**不包含 bucket 名称**。

## 🔧 配置后端

### 1. 安装 Python 依赖

后端已经使用 `minio` 库（支持 S3 兼容 API），阿里云 OSS 也支持，无需额外安装。

### 2. 配置环境变量

复制示例配置文件：

```bash
cd backend
cp .env.oss.example .env
```

编辑 `.env` 文件，填入你的真实配置：

```bash
# 存储类型设为 oss
STORAGE_TYPE=oss

# OSS Endpoint（根据你的 Bucket 地域）
OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com

# OSS 访问凭证（从 RAM 控制台获取）
OSS_ACCESS_KEY=LTAI5tXXXXXXXXXXXXXX
OSS_SECRET_KEY=YourSecretKeyXXXXXXXXXXXXXXXX

# OSS Bucket 名称（你创建的 Bucket）
OSS_BUCKET=wangfeng-fan-website

# 自定义域名（可选，如果你绑定了备案域名）
# OSS_CUSTOM_DOMAIN=img.yourdomain.com
```

### 3. 测试 OSS 连接

启动后端：

```bash
cd backend
python start.py
```

如果配置正确，你会看到：

```
✅ 阿里云 OSS 已连接: wangfeng-fan-website
```

如果看到错误，请检查：
- AccessKey 是否正确
- Bucket 名称是否正确
- Bucket 是否设置为"公共读"

## 📤 迁移现有图片

### 方案一：使用 OSS 控制台上传（推荐，简单）

1. 进入 OSS 控制台 → 你的 Bucket → 文件管理
2. 点击"上传文件"或"上传文件夹"
3. 选择本地图片目录：
   - `frontend/public/images/` 的内容上传到 OSS 的 `images/` 目录
   - 已上传的文章图片（如果有）上传到 `articles/` 目录
4. 保持目录结构一致

### 方案二：使用 ossutil 命令行工具（适合大量文件）

1. 下载 [ossutil 工具](https://help.aliyun.com/document_detail/120075.html)
2. 配置认证信息：
   ```bash
   ./ossutil config
   # 输入 Endpoint, AccessKey ID, AccessKey Secret
   ```
3. 批量上传：
   ```bash
   # 上传整个目录
   ./ossutil cp -r ./frontend/public/images/ oss://wangfeng-fan-website/images/
   ```

### 方案三：使用 Python 脚本批量上传

创建 `backend/migrate_to_oss.py`：

```python
import os
from app.services.storage import get_storage

def migrate_images(local_dir: str, oss_prefix: str = ""):
    """将本地图片迁移到 OSS"""
    storage = get_storage()

    for root, dirs, files in os.walk(local_dir):
        for file in files:
            if file.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
                local_path = os.path.join(root, file)
                relative_path = os.path.relpath(local_path, local_dir)

                # 读取文件
                with open(local_path, 'rb') as f:
                    image_data = f.read()

                # 上传到 OSS
                oss_path = os.path.join(oss_prefix, relative_path) if oss_prefix else relative_path
                url = storage.upload_image(image_data, oss_path)
                print(f"✅ 已上传: {local_path} -> {url}")

if __name__ == "__main__":
    # 迁移 public/images 目录
    migrate_images("../frontend/public/images", "images")
```

运行：
```bash
cd backend
python migrate_to_oss.py
```

## 🌐 配置自定义域名（可选，推荐）

如果你有已备案的域名，可以绑定到 OSS：

### 1. 在 OSS 控制台绑定域名

1. 进入你的 Bucket → 传输管理 → 域名管理
2. 点击"绑定域名"
3. 输入你的域名：如 `img.yourdomain.com`
4. 开启 CDN 加速（推荐，加速访问）

### 2. 在域名 DNS 添加 CNAME 记录

在你的域名 DNS 服务商（如阿里云云解析）添加记录：

- **记录类型**: CNAME
- **主机记录**: `img`（如果域名是 img.yourdomain.com）
- **记录值**: 你的 Bucket 域名（如 `wangfeng-fan-website.oss-cn-hangzhou.aliyuncs.com`）
- **TTL**: 10 分钟

### 3. 更新后端配置

编辑 `.env`：

```bash
OSS_CUSTOM_DOMAIN=img.yourdomain.com
```

重启后端，新上传的图片将使用自定义域名。

## 💰 费用说明

### OSS 计费项

1. **存储费用**:
   - 标准存储：¥0.12/GB/月（首 50TB）
   - 估算：1000 张图片（压缩后约 500KB）= 500MB ≈ ¥0.06/月

2. **流量费用**:
   - 外网流出流量：¥0.50/GB（首 10TB）
   - 如果绑定 CDN：CDN 流量费用更低（约 ¥0.24/GB）

3. **请求费用**:
   - PUT 请求：¥0.01/万次
   - GET 请求：¥0.01/万次

### 成本优化建议

1. ✅ **开启 CDN 加速**：减少 OSS 流量费用，加快访问速度
2. ✅ **图片压缩**：代码已实现（压缩到 1MB 以内）
3. ✅ **配置生命周期规则**：自动删除过期图片（如果需要）

**预估成本**: 小型网站（日访问 1000 次，1000 张图片）约 ¥5-10/月

## 🔄 更新前端图片路径

### 静态资源图片

如果你的 `frontend/public/images/` 中有静态图片：

1. **方案一**: 继续使用本地静态文件（推荐，静态资源不变）
2. **方案二**: 将图片上传到 OSS 后，更新代码中的路径：

```typescript
// 原来
<img src="/images/avatars/wangfeng.jpg" />

// 改为
<img src="https://wangfeng-fan-website.oss-cn-hangzhou.aliyuncs.com/images/avatars/wangfeng.jpg" />
```

### 用户上传图片

用户上传的图片（文章中的图片）会自动使用 OSS，无需修改代码。

## ✅ 验证迁移结果

### 1. 测试图片上传

1. 启动前后端
2. 登录网站，进入"写文章"页面
3. 上传一张图片
4. 检查：
   - 图片能否正常显示
   - 查看浏览器开发者工具 → Network，图片 URL 是否为 OSS 地址

### 2. 检查 OSS 控制台

进入 OSS 控制台 → 文件管理，查看是否有新上传的文件。

## 🚨 常见问题

### 1. 图片上传后 403 Forbidden

**原因**: Bucket 权限未设置为"公共读"

**解决**: OSS 控制台 → 你的 Bucket → 权限管理 → 读写权限 → 改为"公共读"

### 2. 图片 URL 无法访问

**原因**: Endpoint 配置错误或 Bucket 名称错误

**解决**:
- 检查 `OSS_ENDPOINT` 是否正确（不包含 bucket 名称）
- 检查 `OSS_BUCKET` 是否和控制台一致

### 3. 上传失败："Access Denied"

**原因**: AccessKey 权限不足

**解决**:
- 确认 RAM 用户有 `AliyunOSSFullAccess` 权限
- 或检查自定义策略是否包含 `oss:PutObject` 权限

### 4. 图片上传慢

**原因**: 使用外网 Endpoint 且服务器不在阿里云

**解决**:
- 如果服务器在阿里云同地域：使用内网 Endpoint（`oss-cn-xxx-internal.aliyuncs.com`）
- 如果服务器在境外：考虑使用 Cloudflare R2 或其他就近存储

### 5. 自定义域名配置后不生效

**原因**: DNS CNAME 解析未生效

**解决**:
- 等待 DNS 解析生效（最多 10 分钟）
- 使用 `nslookup img.yourdomain.com` 检查解析

## 📚 相关文档

- [阿里云 OSS 产品文档](https://help.aliyun.com/product/31815.html)
- [OSS 快速入门](https://help.aliyun.com/document_detail/31883.html)
- [RAM 访问控制](https://help.aliyun.com/document_detail/28627.html)
- [OSS 定价](https://www.aliyun.com/price/product#/oss/detail)

## 🎉 完成！

配置完成后，所有新上传的图片都会自动存储在阿里云 OSS，你可以享受：

- ✅ 高可用性（99.995%）
- ✅ 高速访问（CDN 加速）
- ✅ 无限容量（按需付费）
- ✅ 自动备份（多副本存储）
- ✅ 符合国内备案要求
