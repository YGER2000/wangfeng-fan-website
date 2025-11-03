# OSS 海报迁移操作指南

本文档列出了将行程海报统一迁移到阿里云 OSS 所需的环境准备与执行步骤。请在项目根目录（`/Users/yger/WithFaith/wangfeng-fan-website`）下操作。

---

## 1. 准备环境变量

1. 确认 `backend/.env` 中已经包含以下字段（如无，请补充真实值）：
   ```ini
   STORAGE_TYPE=oss
   OSS_ENDPOINT=你的 Endpoint
   OSS_ACCESS_KEY=你的 AccessKey
   OSS_SECRET_KEY=你的 SecretKey
   OSS_BUCKET=你的 Bucket 名称
   ```

2. 进入项目根目录并在当前终端会话中加载这些变量：
   ```bash
   set -a
   source backend/.env      # 如果你使用其他配置文件，请替换为实际路径
   set +a
   ```

> 说明：脚本运行时会直接读取环境变量，若未执行上面命令，`python` 脚本会提示找不到 `OSS_*` 配置。

---

## 2. 上传默认海报到 OSS

1. 选定一张本地海报作为临时占位图，例如：`frontend/public/images/concerts/xiangxinweilai_poster.jpg`。
2. 在项目根目录执行以下命令，将图片上传到 OSS，并记录输出的完整 URL：
   ```bash
   python - <<'PY'
   from pathlib import Path
   from backend.app.services.storage import get_storage
   
   image_path = Path("frontend/public/images/concerts/default-poster.jpg")
   storage = get_storage()
   
   with image_path.open("rb") as f:
       data = f.read()
   
   url = storage.upload_bytes(
       data,
       "schedules/default/default-poster.jpg",  # 可按需修改对象键
       content_type="image/jpeg",
   )
   print(url)
   PY
   ```
3. 控制台会打印 OSS 上该图片的访问地址，例如：
   ```
   https://your-bucket.oss-cn-hangzhou.aliyuncs.com/schedules/default/default-poster.jpg
   ```
   将该地址复制备用。

---

## 3. 配置默认海报变量

1. 编辑 `backend/.env`，在 OSS 配置部分加入刚才获取的 URL：
   ```ini
   SCHEDULE_DEFAULT_POSTER_URL=https://wangfeng-fan-website.oss-cn-hangzhou.aliyuncs.com/schedules/default/default-poster.jpg
   ```
2. 保存后再次执行环境变量加载命令：
   ```bash
   set -a
   source backend/.env
   set +a
   ```

---

## 4. 批量更新现有行程海报

1. 运行批量更新脚本，将数据库中所有行程的 `image` / `image_thumb` 替换为新的默认地址：
   ```bash
   python backend/update_schedule_posters.py https://wangfeng-fan-website.oss-cn-hangzhou.aliyuncs.com/schedules/default/default-poster.jpg
   ```
2. 若看到输出 `✅ 已更新 X 条行程的海报`，说明替换完成。

---

## 5. 重启后端并验证

1. 如果后端正在运行（无论是本地进程还是 Docker 容器），请重启服务以加载最新环境变量。
2. 进入后台创建或编辑行程，上传新的海报；在数据库和前端返回的字段中，应看到直接指向 OSS 的 URL。
3. 如果删除行程，请确认 OSS 中的海报文件会被同步删除（默认会尝试删除，失败会记录在日志）。

---

## 6. 后续手动替换

- 脚本仅提供统一占位图，后续请逐个行程替换真实海报。更新时海报将自动上传至 `schedules/{分类}/{日期-主题}/schedule-{id}-poster*.jpg`，不再依赖本地目录。
- 若需要再次批量替换，只需重复执行第 4 步并传入新的 OSS 地址。
