# 🎵 音乐截取脚本 - 快速参考

## 📦 安装依赖

```bash
# macOS
brew install ffmpeg
brew install parallel  # 可选，仅并行版需要

# Ubuntu/Debian
sudo apt install ffmpeg
sudo apt install parallel  # 可选，仅并行版需要
```

---

## 🚀 一键运行

### 测试版（验证环境）
```bash
/tmp/test_trim_music.sh
```

### 基础版（推荐新手）
```bash
cd /Users/yger/WithFaith/wangfeng-fan-website
./scripts/trim_music_30s.sh
```

### 并行版（速度最快）
```bash
cd /Users/yger/WithFaith/wangfeng-fan-website
./scripts/trim_music_30s_parallel.sh
```

---

## ⚙️ 快速配置

### 修改截取时长（默认30秒）
```bash
# 编辑脚本
nano scripts/trim_music_30s.sh

# 修改这一行
DURATION=30  # 改为 45、60 等
```

### 修改输出目录
```bash
# 编辑脚本
nano scripts/trim_music_30s.sh

# 修改这一行
OUTPUT_DIR="/你的/自定义/路径"
```

### 修改并行线程数（仅并行版）
```bash
# 编辑脚本
nano scripts/trim_music_30s_parallel.sh

# 修改这一行
PARALLEL_JOBS=4  # 根据 CPU 核心数调整
```

---

## 📊 性能对比

| 文件数量 | 基础版 | 并行版(4线程) |
|---------|--------|--------------|
| 50 个   | ~1 分钟 | ~20 秒 |
| 100 个  | ~2 分钟 | ~40 秒 |
| 245 个  | ~5 分钟 | ~1-2 分钟 |

---

## 🔍 常用命令

### 查看音乐文件总数
```bash
find frontend/public/music -type f \( -name "*.mp3" -o -name "*.flac" \) | wc -l
```

### 查看已处理文件数
```bash
find frontend/public/music_preview -type f | wc -l
```

### 删除输出目录（重新处理）
```bash
rm -rf frontend/public/music_preview
```

### 查看输出目录大小
```bash
du -sh frontend/public/music_preview
```

### 验证某个文件是否处理成功
```bash
ls -lh frontend/public/music_preview/album/怒放的生命/01.怒放的生命.mp3
```

---

## ❓ 快速排错

### 提示"ffmpeg not found"
```bash
# 安装 ffmpeg
brew install ffmpeg  # macOS
sudo apt install ffmpeg  # Ubuntu
```

### 提示"parallel not found"（仅并行版）
```bash
# 安装 parallel
brew install parallel  # macOS
sudo apt install parallel  # Ubuntu
```

### 提示"Permission denied"
```bash
# 添加执行权限
chmod +x scripts/trim_music_30s.sh
```

### 某些文件处理失败
```bash
# 手动测试该文件
ffmpeg -i "问题文件.mp3" -t 30 -acodec copy test.mp3
# 查看错误信息
```

---

## 📁 目录结构

```
frontend/public/
├── music/              # 源音乐文件（完整版）
│   ├── album/
│   ├── live/
│   ├── remaster/
│   └── others/
└── music_preview/      # 截取的30秒片段
    ├── album/
    ├── live/
    ├── remaster/
    └── others/
```

---

## 💡 使用建议

✅ **首次使用**: 先运行测试版验证环境
✅ **< 100 文件**: 使用基础版
✅ **> 100 文件**: 使用并行版
✅ **增量更新**: 脚本自动跳过已存在文件
✅ **备份重要**: 处理前备份原音乐文件

❌ **不要**: 在处理过程中修改源文件
❌ **不要**: 在网络磁盘上运行（速度慢）
❌ **不要**: 同时运行多个脚本

---

## 🔗 详细文档

- [完整使用说明](./README_trim_music.md)
- [脚本对比](./SCRIPTS_COMPARISON.md)

---

**最后更新**: 2025-11-07
