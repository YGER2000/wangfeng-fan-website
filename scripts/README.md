# Scripts 目录索引

本目录包含汪峰粉丝网站项目的实用脚本工具。

---

## 📂 目录结构

```
scripts/
├── README.md                      # 本文件 - 脚本索引
├── trim_music_30s.sh              # 音乐截取脚本（基础版）
├── trim_music_30s_parallel.sh     # 音乐截取脚本（并行版）
├── README_trim_music.md           # 音乐截取详细文档
├── SCRIPTS_COMPARISON.md          # 脚本对比说明
├── QUICK_REFERENCE.md             # 快速参考卡片
└── import_blog_posts.py           # 博客文章导入脚本（已存在）
```

---

## 🎵 音乐截取工具

### 功能
截取音乐文件的前 30 秒，生成预览片段，保持原有目录结构。

### 适用场景
- 生成音乐预览文件（用于网站试听）
- 减小音乐文件体积（便于快速加载）
- 版权保护（只提供片段试听）

### 脚本列表

| 脚本 | 说明 | 推荐场景 |
|------|------|----------|
| [trim_music_30s.sh](./trim_music_30s.sh) | 基础版（串行处理） | 首次使用、文件数 < 100 |
| [trim_music_30s_parallel.sh](./trim_music_30s_parallel.sh) | 并行版（多线程） | 文件数 > 100、追求速度 |

### 文档

- 📖 [详细使用说明](./README_trim_music.md)
- 📊 [脚本对比](./SCRIPTS_COMPARISON.md)
- ⚡ [快速参考](./QUICK_REFERENCE.md)

### 快速开始

```bash
# 1. 安装依赖
brew install ffmpeg  # macOS
# 或
sudo apt install ffmpeg  # Ubuntu

# 2. 运行基础版
cd /Users/yger/WithFaith/wangfeng-fan-website
./scripts/trim_music_30s.sh

# 3. 或运行并行版（需要额外安装 parallel）
brew install parallel
./scripts/trim_music_30s_parallel.sh
```

---

## 📝 博客文章导入工具

### 功能
批量导入博客文章到数据库。

### 脚本
- [import_blog_posts.py](./import_blog_posts.py)

### 使用方法
```bash
cd /Users/yger/WithFaith/wangfeng-fan-website
python3 scripts/import_blog_posts.py
```

---

## 🔧 开发中的脚本（规划）

以下是未来可能添加的脚本：

1. **数据库备份脚本**
   - 自动备份 MySQL 数据库
   - 支持定时任务

2. **图片压缩脚本**
   - 批量压缩图片
   - 生成多种尺寸（缩略图、中等、原图）

3. **日志清理脚本**
   - 自动清理旧日志
   - 压缩归档

4. **性能监控脚本**
   - 监控服务器资源使用
   - 发送告警通知

---

## 📋 使用规范

### 脚本命名规范
- 使用小写字母和下划线
- 描述性命名，例如 `trim_music_30s.sh`
- Shell 脚本使用 `.sh` 后缀
- Python 脚本使用 `.py` 后缀

### 脚本结构规范
```bash
#!/bin/bash

# ========================================
# 脚本标题
# ========================================
# 功能: 简要说明
# 作者: 开发团队
# 日期: YYYY-MM-DD
# ========================================

# 配置参数
PARAM1="value1"
PARAM2="value2"

# 主函数
main() {
    # 脚本逻辑
}

# 运行主函数
main
```

### 文档规范
每个脚本应该配备：
- ✅ 脚本内注释（说明关键步骤）
- ✅ README 文档（详细使用说明）
- ✅ 使用示例（演示如何运行）
- ✅ 常见问题（FAQ）

---

## ⚠️ 安全提示

### 运行脚本前
1. ✅ 阅读脚本代码，理解其功能
2. ✅ 备份重要数据
3. ✅ 在测试环境先验证
4. ✅ 确保有足够的磁盘空间

### 脚本权限
```bash
# 查看脚本权限
ls -l scripts/

# 添加执行权限
chmod +x scripts/脚本名.sh

# 移除执行权限（安全考虑）
chmod -x scripts/脚本名.sh
```

---

## 🐛 问题反馈

如果脚本运行遇到问题：

1. 检查是否安装了所需依赖
2. 查看脚本输出的错误信息
3. 阅读对应的 README 文档
4. 查看常见问题 FAQ

---

## 📦 依赖总览

| 工具 | 用途 | 安装命令 (macOS) | 安装命令 (Ubuntu) |
|------|------|-----------------|------------------|
| ffmpeg | 音频处理 | `brew install ffmpeg` | `sudo apt install ffmpeg` |
| parallel | 并行处理 | `brew install parallel` | `sudo apt install parallel` |
| python3 | Python 脚本 | 系统自带 | 系统自带 |
| tree | 目录树显示 | `brew install tree` | `sudo apt install tree` |

---

## 📚 相关文档

- [项目根目录 README](../README.md)
- [部署文档](../docs/部署文档/)
- [开发文档](../docs/)

---

**维护者**: 开发团队
**最后更新**: 2025-11-07
**项目地址**: [GitHub Repository](https://github.com/你的用户名/wangfeng-fan-website)
