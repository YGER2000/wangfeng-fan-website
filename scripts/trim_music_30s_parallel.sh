#!/bin/bash

# ========================================
# 音乐文件前30秒截取脚本（并行处理版本）
# ========================================
# 功能: 使用多线程并行截取音乐文件，速度更快
# 作者: 开发团队
# 日期: 2025-11-07
# ========================================

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置参数
SOURCE_DIR="/Users/yger/WithFaith/wangfeng-fan-website/frontend/public/music"
OUTPUT_DIR="/Users/yger/WithFaith/wangfeng-fan-website/frontend/public/music_preview"
DURATION=30  # 截取时长（秒）
PARALLEL_JOBS=4  # 并行任务数（根据 CPU 核心数调整，推荐 2-8）

# 检查依赖
check_dependencies() {
    local missing_deps=()

    if ! command -v ffmpeg &> /dev/null; then
        missing_deps+=("ffmpeg")
    fi

    if ! command -v parallel &> /dev/null; then
        missing_deps+=("parallel")
    fi

    if [ ${#missing_deps[@]} -gt 0 ]; then
        echo -e "${RED}错误: 缺少以下依赖${NC}"
        for dep in "${missing_deps[@]}"; do
            echo -e "  - $dep"
        done
        echo ""
        echo -e "${YELLOW}安装方法:${NC}"
        echo -e "  macOS:"
        echo -e "    ${BLUE}brew install ffmpeg${NC}"
        echo -e "    ${BLUE}brew install parallel${NC}"
        echo -e "  Ubuntu/Debian:"
        echo -e "    ${BLUE}sudo apt install ffmpeg parallel${NC}"
        exit 1
    fi

    echo -e "${GREEN}✓ 检测到 ffmpeg: $(ffmpeg -version | head -1 | cut -d' ' -f3)${NC}"
    echo -e "${GREEN}✓ 检测到 GNU parallel: $(parallel --version | head -1 | cut -d' ' -f3)${NC}"
}

# 统计音乐文件数量
count_music_files() {
    local count=$(find "$SOURCE_DIR" -type f \( -name "*.mp3" -o -name "*.flac" -o -name "*.m4a" -o -name "*.wav" \) | wc -l)
    echo "$count"
}

# 截取单个音乐文件（供 parallel 调用）
trim_single_file() {
    local input_file="$1"
    local source_dir="$2"
    local output_dir="$3"
    local duration="$4"

    local relative_path="${input_file#$source_dir/}"
    local output_file="$output_dir/$relative_path"
    local output_subdir=$(dirname "$output_file")

    # 创建输出目录
    mkdir -p "$output_subdir"

    # 检查输出文件是否已存在
    if [ -f "$output_file" ]; then
        echo "SKIP: $relative_path"
        return 0
    fi

    # 使用 ffmpeg 截取
    if ffmpeg -i "$input_file" -t "$duration" -acodec copy -y "$output_file" -loglevel error 2>&1; then
        echo "DONE: $relative_path"
        return 0
    else
        echo "FAIL: $relative_path"
        return 1
    fi
}

# 导出函数供 parallel 使用
export -f trim_single_file

# 主函数
main() {
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}音乐文件前30秒截取工具（并行版）${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""

    # 检查依赖
    check_dependencies
    echo ""

    # 检查源目录
    if [ ! -d "$SOURCE_DIR" ]; then
        echo -e "${RED}错误: 源目录不存在: $SOURCE_DIR${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ 源目录: $SOURCE_DIR${NC}"

    # 创建输出目录
    mkdir -p "$OUTPUT_DIR"
    echo -e "${GREEN}✓ 输出目录: $OUTPUT_DIR${NC}"
    echo -e "${BLUE}✓ 并行任务数: $PARALLEL_JOBS${NC}"
    echo ""

    # 统计文件数量
    local total_files=$(count_music_files)
    echo -e "${BLUE}找到 $total_files 个音乐文件${NC}"
    echo ""

    # 确认操作
    read -p "是否开始处理？(y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}操作已取消${NC}"
        exit 0
    fi
    echo ""

    echo -e "${BLUE}开始并行处理...${NC}"
    echo ""

    # 使用 GNU parallel 并行处理
    # --jobs $PARALLEL_JOBS: 并行任务数
    # --bar: 显示进度条
    # --eta: 显示预计完成时间
    find "$SOURCE_DIR" -type f \( -name "*.mp3" -o -name "*.flac" -o -name "*.m4a" -o -name "*.wav" \) | \
    parallel --jobs $PARALLEL_JOBS --bar --eta \
        trim_single_file {} "$SOURCE_DIR" "$OUTPUT_DIR" "$DURATION" | \
    while IFS= read -r line; do
        case "$line" in
            DONE:*)
                echo -e "${GREEN}✓ ${line#DONE: }${NC}"
                ;;
            SKIP:*)
                echo -e "${YELLOW}⊙ 跳过: ${line#SKIP: }${NC}"
                ;;
            FAIL:*)
                echo -e "${RED}✗ 失败: ${line#FAIL: }${NC}"
                ;;
        esac
    done

    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}处理完成！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "输出目录: ${BLUE}$OUTPUT_DIR${NC}"

    # 显示目录结构
    echo ""
    echo -e "${GREEN}目录结构预览:${NC}"
    if command -v tree &> /dev/null; then
        tree -L 2 "$OUTPUT_DIR"
    else
        find "$OUTPUT_DIR" -maxdepth 2 -type d | sed 's|[^/]*/| |g'
    fi
}

# 运行主函数
main
