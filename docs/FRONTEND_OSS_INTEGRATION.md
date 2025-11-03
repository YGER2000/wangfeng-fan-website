# 前端 OSS 音乐集成指南

## 概述

前端现已支持从阿里云 OSS 加载音乐文件。这个指南说明如何配置和使用 OSS 音乐 URL。

## 工作原理

### 文件路径映射

前端代码中的音乐路径格式统一为：
```typescript
filePath: '/music/album/2005-怒放的生命/01.怒放的生命.flac'
```

`withBasePath()` 函数会自动将这个路径转换为完整的 URL：

- **开发环境（配置了 OSS）：**
  ```
  /music/album/2005-怒放的生命/01.怒放的生命.flac
  ↓ withBasePath()
  https://wangfeng-fan-website.oss-cn-hangzhou.aliyuncs.com/music/album/2005-怒放的生命/01.怒放的生命.flac
  ```

- **开发环境（未配置 OSS）：**
  ```
  /music/album/2005-怒放的生命/01.怒放的生命.flac
  ↓ withBasePath()
  /music/album/2005-怒放的生命/01.怒放的生命.flac
  ```

- **生产环境：**
  ```
  /music/album/2005-怒放的生命/01.怒放的生命.flac
  ↓ withBasePath()
  https://wangfeng-fan-website.oss-cn-hangzhou.aliyuncs.com/music/album/2005-怒放的生命/01.怒放的生命.flac
  ```

## 配置步骤

### 第 1 步：复制环境配置模板

**开发环境：**
```bash
cd frontend
cp .env.local.example .env.local
```

**生产环境：**
```bash
cp .env.production.example .env.production
```

### 第 2 步：编辑环境变量文件

#### 开发环境 (`frontend/.env.local`)

```env
# 开发环境下使用 OSS 音乐
VITE_MUSIC_OSS_BASE_URL=https://wangfeng-fan-website.oss-cn-hangzhou.aliyuncs.com

# 后端 API 地址（本地开发）
VITE_API_BASE_URL=http://localhost:1994
```

如果想在开发时用本地音乐（需要 `frontend/public/music/` 存在）：
```env
# 注释掉 OSS URL，则使用本地路径
# VITE_MUSIC_OSS_BASE_URL=https://wangfeng-fan-website.oss-cn-hangzhou.aliyuncs.com

VITE_API_BASE_URL=http://localhost:1994
```

#### 生产环境 (`frontend/.env.production`)

```env
# 生产环境使用 OSS 音乐
VITE_MUSIC_OSS_BASE_URL=https://wangfeng-fan-website.oss-cn-hangzhou.aliyuncs.com

# 后端 API 地址（改为你的生产域名）
VITE_API_BASE_URL=https://your-domain.com
```

### 第 3 步：验证配置

**在开发环境测试：**
```bash
cd frontend
pnpm dev
```

打开浏览器，进入播放器页面，打开浏览器开发者工具（F12）：

1. 点击任何歌曲播放
2. 在网络标签（Network）中查看音乐文件请求
3. 确认 URL 是否为 OSS 地址：
   - ✅ 正确：`https://wangfeng-fan-website.oss-cn-hangzhou.aliyuncs.com/music/...`
   - ❌ 错误：`http://localhost:1997/music/...`

**在控制台查看调试信息：**
```javascript
// 在浏览器控制台执行，确认环境变量是否加载
console.log(import.meta.env.VITE_MUSIC_OSS_BASE_URL)
```

应该输出：
```
https://wangfeng-fan-website.oss-cn-hangzhou.aliyuncs.com
```

## 代码实现细节

### `withBasePath()` 函数位置
[frontend/src/lib/utils.ts](../frontend/src/lib/utils.ts#L8-L39)

**逻辑流程：**
1. 如果路径已是完整 URL（http/https），直接返回
2. 如果路径是 `/music/` 开头：
   - 检查 `VITE_MUSIC_OSS_BASE_URL` 是否配置
   - 如果配置了，使用 OSS URL
   - 否则，使用相对路径
3. 其他路径（图片等）继续使用本地路径

### 使用位置

- **MusicContext** ([MusicContext.tsx:265](../frontend/src/contexts/MusicContext.tsx#L265))
  ```typescript
  const audioPath = withBasePath(song.filePath);
  audioRef.current.src = audioPath;
  ```

- **其他图片资源** (自动处理，无需修改)
  ```typescript
  const imagePath = withBasePath('images/gallery/...');
  ```

## 常见问题

### Q: 为什么音乐播放失败？
A: 检查以下几点：
1. OSS Bucket 权限设置为"公共读"
2. `VITE_MUSIC_OSS_BASE_URL` 环境变量正确配置
3. 音乐文件已成功上传到 OSS
4. 网络连接正常，能访问 OSS 域名

### Q: 如何在生产环境使用本地音乐？
A: 虽然不推荐，但可以：
1. 将 `frontend/public/music/` 目录上传到服务器
2. 在 `.env.production` 中注释掉 `VITE_MUSIC_OSS_BASE_URL`
3. 重新构建前端：`pnpm build`

### Q: 如何切换 OSS Bucket？
A: 更新环境变量中的 `VITE_MUSIC_OSS_BASE_URL`：
```env
# 原来的 bucket
VITE_MUSIC_OSS_BASE_URL=https://wangfeng-fan-website.oss-cn-hangzhou.aliyuncs.com

# 新 bucket
VITE_MUSIC_OSS_BASE_URL=https://new-bucket-name.oss-cn-beijing.aliyuncs.com
```

### Q: 如何支持多个地域的 OSS 节点？
A: Vite 环境变量支持条件配置，可以在 `vite.config.ts` 中添加：
```typescript
export default defineConfig({
  define: {
    __MUSIC_OSS_URL__: JSON.stringify(
      process.env.VITE_MUSIC_OSS_BASE_URL || ''
    ),
  },
})
```

## 性能优化建议

### 1. 启用 CDN 加速（可选但推荐）

在阿里云 CDN 控制台配置：
- 源站：`wangfeng-fan-website.oss-cn-hangzhou.aliyuncs.com`
- 加速域名：`music.your-domain.com`
- 更新 `VITE_MUSIC_OSS_BASE_URL` 为 CDN 域名

### 2. 浏览器缓存

OSS 默认返回正确的 `Cache-Control` 头，浏览器会自动缓存。

### 3. 预加载

可选：在 MusicContext 中添加音乐预加载：
```typescript
// 预加载下一首歌曲
const preloadNextSong = (song: Song) => {
  const audio = new Audio();
  audio.src = withBasePath(song.filePath);
  audio.preload = 'metadata';
};
```

## 部署检查清单

部署到生产环境前，请确认：

- [ ] OSS Bucket 已创建且权限设置为公共读
- [ ] 所有音乐文件已上传到 OSS
- [ ] `frontend/.env.production` 已配置正确的 OSS URL
- [ ] 前端已构建：`pnpm build`
- [ ] `frontend/dist/` 文件已上传或包含在 Docker 镜像中
- [ ] 测试音乐播放功能，确认使用 OSS URL 加载

## 参考链接

- [backend/.env.example](../backend/.env.example) - 后端 OSS 配置
- [frontend/.env.local.example](../.env.local.example) - 前端开发环境配置
- [frontend/.env.production.example](../.env.production.example) - 前端生产环境配置
- [docs/OSS_MUSIC_MIGRATION_GUIDE.md](./OSS_MUSIC_MIGRATION_GUIDE.md) - 音乐迁移指南
- [Vite 环境变量文档](https://vitejs.dev/guide/env-and-mode.html)
