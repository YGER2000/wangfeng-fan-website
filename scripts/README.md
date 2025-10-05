# 图片压缩脚本使用说明

## 功能说明

`compress-gallery-images.js` 是一个智能图片压缩工具，用于将画廊中的大尺寸图片压缩到3MB以内，同时保持良好的视觉质量。

## 特性

- 🎯 **智能压缩**: 只处理超过3MB的图片
- 📦 **自动备份**: 压缩前自动备份原图
- 🖼️ **多格式支持**: 支持 JPG, PNG, WebP 格式
- 📐 **尺寸优化**: 超大图片自动调整到合理尺寸
- 📊 **详细统计**: 显示压缩率和节省的空间
- ⚡ **高性能**: 使用 Sharp 库进行高效处理

## 安装依赖

```bash
# 安装 sharp 图片处理库
pnpm install sharp
```

## 使用方法

### 方式一：使用 npm 脚本（推荐）

```bash
# 运行图片压缩
pnpm run compress-gallery
```

### 方式二：直接运行脚本

```bash
# 直接执行脚本
node scripts/compress-gallery-images.js
```

## 配置参数

脚本中的关键配置：

```javascript
const CONFIG = {
  maxSizeBytes: 3 * 1024 * 1024, // 目标大小：3MB
  maxWidth: 1920,                 // 最大宽度：1920px
  maxHeight: 1080,                // 最大高度：1080px
  quality: 85,                    // JPEG质量：85%
  pngQuality: 80,                 // PNG质量：80%
  webpQuality: 85                 // WebP质量：85%
};
```

## 工作流程

1. **扫描**: 递归扫描 `public/images/画廊/` 目录
2. **筛选**: 识别超过3MB的图片文件
3. **备份**: 将原图备份到 `backup/gallery-images-original/`
4. **压缩**: 
   - 调整过大的尺寸（最大1920×1080）
   - 根据格式优化质量参数
   - 应用渐进式加载优化
5. **统计**: 显示压缩效果和节省空间

## 输出示例

```
🖼️  画廊图片压缩工具
====================
📁 扫描目录: /path/to/public/images/画廊
🎯 目标大小: 3MB
📐 最大尺寸: 1920×1080

📊 统计信息:
   总图片数: 65
   需要压缩: 8
   无需处理: 57

🚀 开始压缩...

📦 备份: 巡演返图/2023.4.15-UNFOLLOW洛阳站/xxx.png
✅ xxx.png: 21.00MB → 2.85MB (压缩86.4%)

📈 压缩完成！
====================
✅ 成功压缩: 8/8 个文件
💾 原始总大小: 45.23MB
💾 压缩后大小: 18.67MB
🎯 节省空间: 26.56MB
📊 总压缩率: 58.7%

📦 原文件备份到: /path/to/backup/gallery-images-original
🎉 全部完成！
```

## 安全保障

- ✅ **原图备份**: 所有原图都会备份，不会丢失
- ✅ **非破坏性**: 只有确认压缩成功才覆盖原文件
- ✅ **错误处理**: 处理失败的文件保持原样
- ✅ **格式检查**: 只处理支持的图片格式

## 压缩算法

### JPEG 压缩
- 质量: 85% (平衡质量与文件大小)
- 渐进式加载: 启用
- MozJPEG 优化: 启用

### PNG 压缩
- 质量: 80%
- 压缩级别: 9 (最高)
- 渐进式加载: 启用

### WebP 压缩
- 质量: 85%
- 现代格式，更好的压缩效率

## 性能提升

压缩后的图片将显著提升网站性能：

- 📱 **移动端体验**: 更快的加载速度
- 🌐 **网络友好**: 减少带宽消耗
- ⚡ **懒加载优化**: 配合懒加载更流畅
- 💰 **成本节省**: 降低CDN和存储成本

## 恢复原图

如需恢复原图：

```bash
# 从备份目录恢复
cp -r backup/gallery-images-original/* public/images/画廊/
```

## 注意事项

1. **首次运行前建议手动备份重要图片**
2. **确保有足够的磁盘空间用于备份**
3. **大量图片处理可能需要几分钟时间**
4. **处理过程中不要中断脚本运行**

## 故障排除

### Sharp 安装失败
```bash
# 清理缓存重新安装
pnpm cache clean
pnpm install sharp --force
```

### 权限问题
```bash
# 确保脚本有执行权限
chmod +x scripts/compress-gallery-images.js
```

### 内存不足
```bash
# 增加 Node.js 内存限制
NODE_OPTIONS="--max-old-space-size=4096" pnpm run compress-gallery
```