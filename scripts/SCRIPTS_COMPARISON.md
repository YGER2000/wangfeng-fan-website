# 音乐截取脚本对比

本目录提供了 **3 个版本** 的音乐截取脚本，根据您的需求选择使用。

---

## 📋 脚本对比

| 特性 | 基础版 | 并行版 | 测试版 |
|------|--------|--------|--------|
| **文件名** | `trim_music_30s.sh` | `trim_music_30s_parallel.sh` | `/tmp/test_trim_music.sh` |
| **依赖** | ffmpeg | ffmpeg + GNU parallel | ffmpeg |
| **处理速度** | 较慢（串行） | 快（多线程） | 仅测试单文件 |
| **适用场景** | 首次使用、小规模处理 | 大规模处理（100+文件） | 测试 ffmpeg 是否可用 |
| **难度** | ⭐ 简单 | ⭐⭐ 中等 | ⭐ 简单 |
| **推荐指数** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐（仅测试用） |

---

## 🚀 快速开始

### 1️⃣ 测试版（推荐首次使用）

**用途**: 验证 ffmpeg 是否安装正确，测试单个文件

```bash
# 运行测试
/tmp/test_trim_music.sh
```

**优点**:
- 快速验证环境
- 只处理一个文件，安全
- 可以播放输出文件验证效果

**输出示例**:
```
测试文件: /Users/yger/.../music/album/怒放的生命/01.怒放的生命.mp3
输出目录: /tmp/music_preview_test

正在截取前 30 秒...
✓ 成功！

原文件信息:
-rw-r--r--  1 yger  staff   5.2M Oct 16 10:19 01.怒放的生命.mp3

输出文件信息:
-rw-r--r--  1 yger  staff   1.3M Nov  7 14:30 01.怒放的生命.mp3

可以使用以下命令播放测试:
  open "/tmp/music_preview_test/01.怒放的生命.mp3"
```

---

### 2️⃣ 基础版（推荐新手）

**用途**: 处理所有音乐文件，简单易用

```bash
cd /Users/yger/WithFaith/wangfeng-fan-website
./scripts/trim_music_30s.sh
```

**优点**:
- 依赖少（只需 ffmpeg）
- 逻辑简单，易于理解和修改
- 进度清晰，每个文件都有输出

**缺点**:
- 速度较慢（串行处理）
- 处理 200+ 文件可能需要 5-10 分钟

**适合场景**:
- 首次使用
- 音乐文件数量 < 100
- 不熟悉命令行工具

---

### 3️⃣ 并行版（推荐高级用户）

**用途**: 快速处理大量音乐文件（使用多线程）

```bash
# 1. 安装 GNU parallel
brew install parallel  # macOS
# 或
sudo apt install parallel  # Ubuntu

# 2. 运行脚本
cd /Users/yger/WithFaith/wangfeng-fan-website
./scripts/trim_music_30s_parallel.sh
```

**优点**:
- **速度快** - 4 线程可提速 3-4 倍
- 显示进度条和预计完成时间（ETA）
- 适合大规模处理

**缺点**:
- 需要额外安装 GNU parallel
- CPU 占用较高

**适合场景**:
- 音乐文件数量 > 100
- 需要频繁重新处理
- 追求效率

**性能对比** (245 个文件):
- 基础版: ~5 分钟
- 并行版 (4 线程): ~1-2 分钟

---

## 📖 使用指南

### 步骤 1: 安装依赖

#### 基础版和测试版
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg
```

#### 并行版（额外依赖）
```bash
# macOS
brew install ffmpeg parallel

# Ubuntu/Debian
sudo apt install ffmpeg parallel
```

### 步骤 2: 验证安装
```bash
ffmpeg -version
parallel --version  # 仅并行版需要
```

### 步骤 3: 运行脚本

**测试版**:
```bash
/tmp/test_trim_music.sh
```

**基础版**:
```bash
cd /Users/yger/WithFaith/wangfeng-fan-website
./scripts/trim_music_30s.sh
```

**并行版**:
```bash
cd /Users/yger/WithFaith/wangfeng-fan-website
./scripts/trim_music_30s_parallel.sh
```

---

## ⚙️ 自定义配置

### 修改截取时长

编辑脚本中的 `DURATION` 参数：

```bash
# 打开脚本编辑
nano scripts/trim_music_30s.sh

# 修改这一行：
DURATION=30  # 改为你想要的秒数，例如 DURATION=45
```

### 修改输出目录

编辑脚本中的 `OUTPUT_DIR` 参数：

```bash
# 打开脚本编辑
nano scripts/trim_music_30s.sh

# 修改这一行：
OUTPUT_DIR="/你的/自定义/路径"
```

### 并行版：调整线程数

```bash
# 打开脚本编辑
nano scripts/trim_music_30s_parallel.sh

# 修改这一行：
PARALLEL_JOBS=4  # 改为你想要的线程数
```

**推荐线程数**:
- 双核 CPU: 2
- 四核 CPU: 4
- 八核 CPU: 6-8
- 十六核 CPU: 8-12

---

## 🔍 常见问题

### Q: 如何知道脚本处理了多少文件？

**A**: 运行完成后会显示统计信息：
```
总文件数: 245
成功处理: 240
跳过文件: 5
失败文件: 0
```

### Q: 脚本会覆盖已存在的文件吗？

**A**: 不会。脚本会自动跳过已存在的文件，显示：
```
⊙ 跳过（已存在）: album/春天里/01.春天里.mp3
```

### Q: 如何重新处理所有文件？

**A**: 删除输出目录后重新运行：
```bash
rm -rf /Users/yger/WithFaith/wangfeng-fan-website/frontend/public/music_preview
./scripts/trim_music_30s.sh
```

### Q: 处理失败的文件怎么办？

**A**:
1. 查看脚本输出中标记为 `✗ 失败` 的文件
2. 使用 ffmpeg 手动测试：
   ```bash
   ffmpeg -i "失败的文件.mp3" -t 30 -acodec copy test.mp3
   ```
3. 根据错误信息排查（可能是文件损坏或格式不支持）

### Q: 可以处理视频文件吗？

**A**: 可以，但需要修改脚本的文件匹配模式，添加视频扩展名（.mp4, .avi 等）

---

## 📊 文件大小对比

**示例**（一首 4 分钟的 MP3 歌曲）:

| 格式 | 原文件 | 30秒片段 | 压缩比 |
|------|--------|----------|--------|
| MP3 (320kbps) | 9.6 MB | 1.2 MB | ~87% |
| FLAC (无损) | 35 MB | 4.4 MB | ~87% |
| M4A (256kbps) | 7.7 MB | 0.96 MB | ~87% |

**结论**: 截取前 30 秒可以节省约 **87%** 的存储空间。

---

## 📁 输出目录说明

### 默认输出目录
```
/Users/yger/WithFaith/wangfeng-fan-website/frontend/public/music_preview/
```

### 目录结构（保持与源目录一致）
```
music_preview/
├── album/          # 录音室专辑片段
├── live/           # 现场演出片段
├── remaster/       # 新编版本片段
└── others/         # 其他分类片段
```

---

## 🎯 推荐工作流程

### 首次使用（推荐）
```bash
# 1. 运行测试验证环境
/tmp/test_trim_music.sh

# 2. 播放测试输出，确认效果
open /tmp/music_preview_test/*.mp3

# 3. 运行基础版处理所有文件
./scripts/trim_music_30s.sh
```

### 大规模处理（推荐）
```bash
# 1. 安装 parallel
brew install parallel

# 2. 运行并行版
./scripts/trim_music_30s_parallel.sh

# 3. 验证输出
ls -lh frontend/public/music_preview/
```

---

## 📝 脚本文件清单

| 文件 | 说明 | 大小 |
|------|------|------|
| `trim_music_30s.sh` | 基础版截取脚本 | ~3 KB |
| `trim_music_30s_parallel.sh` | 并行版截取脚本 | ~4 KB |
| `README_trim_music.md` | 详细使用说明 | ~10 KB |
| `SCRIPTS_COMPARISON.md` | 本对比文档 | ~6 KB |

---

**作者**: 开发团队
**最后更新**: 2025-11-07
**相关文档**: [README_trim_music.md](./README_trim_music.md)
