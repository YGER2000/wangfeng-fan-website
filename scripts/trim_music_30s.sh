#!/bin/bash

# ========================================
# 音乐文件前30秒截取脚本
# ========================================
# 功能: 截取指定目录下所有音乐文件的前30秒，保持原有目录结构
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

# 检查 ffmpeg 是否安装
check_ffmpeg() {
    if ! command -v ffmpeg &> /dev/null; then
        echo -e "${RED}错误: 未检测到 ffmpeg${NC}"
        echo -e "${YELLOW}请先安装 ffmpeg:${NC}"
        echo -e "  macOS: ${BLUE}brew install ffmpeg${NC}"
        echo -e "  Ubuntu: ${BLUE}sudo apt install ffmpeg${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ 检测到 ffmpeg: $(ffmpeg -version | head -1)${NC}"
}

# 统计音乐文件数量
count_music_files() {
    local count=$(find "$SOURCE_DIR" -type f \( -name "*.mp3" -o -name "*.flac" -o -name "*.m4a" -o -name "*.wav" \) | wc -l)
    echo "$count"
}

# 截取单个音乐文件
trim_audio_file() {
    local input_file="$1"
    local relative_path="${input_file#$SOURCE_DIR/}"
    local output_file="$OUTPUT_DIR/$relative_path"
    local output_dir=$(dirname "$output_file")

    # 创建输出目录
    mkdir -p "$output_dir"

    # 获取文件名（用于显示）
    local filename=$(basename "$input_file")

    # 检查输出文件是否已存在
    if [ -f "$output_file" ]; then
        echo -e "${YELLOW}⊙ 跳过（已存在）: $relative_path${NC}"
        return 0
    fi

    # 使用 ffmpeg 截取前 30 秒
    # -i: 输入文件
    # -t: 持续时间
    # -acodec copy: 复制音频编码（避免重新编码，保持音质）
    # -y: 覆盖已存在的文件
    # -loglevel error: 只显示错误信息

    echo -e "${BLUE}➜ 处理: $relative_path${NC}"

    if ffmpeg -i "$input_file" -t "$DURATION" -acodec copy -y "$output_file" -loglevel error 2>&1; then
        echo -e "${GREEN}✓ 完成: $relative_path${NC}"
        return 0
    else
        echo -e "${RED}✗ 失败: $relative_path${NC}"
        return 1
    fi
}

# 主函数
main() {
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}音乐文件前30秒截取工具${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""

    # 检查 ffmpeg
    check_ffmpeg
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

    # 处理所有音乐文件
    local processed=0
    local skipped=0
    local failed=0

    while IFS= read -r -d '' file; do
        trim_audio_file "$file"
        local result=$?

        if [ $result -eq 0 ]; then
            if [ -f "$OUTPUT_DIR/${file#$SOURCE_DIR/}" ]; then
                ((processed++))
            else
                ((skipped++))
            fi
        else
            ((failed++))
        fi
    done < <(find "$SOURCE_DIR" -type f \( -name "*.mp3" -o -name "*.flac" -o -name "*.m4a" -o -name "*.wav" \) -print0)

    # 输出统计信息
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}处理完成！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "总文件数: ${BLUE}$total_files${NC}"
    echo -e "成功处理: ${GREEN}$processed${NC}"
    echo -e "跳过文件: ${YELLOW}$skipped${NC}"
    echo -e "失败文件: ${RED}$failed${NC}"
    echo ""
    echo -e "输出目录: ${BLUE}$OUTPUT_DIR${NC}"

    # 显示目录结构
    echo ""
    echo -e "${GREEN}目录结构预览:${NC}"
    tree -L 2 "$OUTPUT_DIR" 2>/dev/null || find "$OUTPUT_DIR" -maxdepth 2 -type d | sed 's|[^/]*/| |g'
}

# 运行主函数
main
