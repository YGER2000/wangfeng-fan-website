#!/bin/bash

# 汪峰粉丝网站 - 部署脚本
# 用途：将代码和资源上传到云服务器
# 使用方式：./deploy.sh

set -e  # 错误时停止执行

# 配置
SERVER_IP="47.111.177.153"
SERVER_USER="root"
REMOTE_PATH="/opt/wangfeng-fan-website"
LOCAL_PATH="/Users/yger/WithFaith/wangfeng-fan-website"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  汪峰粉丝网站部署脚本${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 第 1 步：确认本地项目存在
echo -e "${YELLOW}[1/4] 检查本地项目...${NC}"
if [ ! -d "$LOCAL_PATH" ]; then
    echo -e "${RED}❌ 本地项目不存在: $LOCAL_PATH${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 本地项目存在${NC}"
echo ""

# 第 2 步：询问用户选择部署方式
echo -e "${YELLOW}[2/4] 选择部署方式${NC}"
echo "  1) 部署代码 (git pull)"
echo "  2) 上传资源 (public/ 目录)"
echo "  3) 同时部署代码和资源"
read -p "请选择 (1-3): " choice

# 第 3 步：执行部署
if [ "$choice" = "1" ] || [ "$choice" = "3" ]; then
    echo ""
    echo -e "${YELLOW}[3/4] 更新代码...${NC}"
    ssh $SERVER_USER@$SERVER_IP "cd $REMOTE_PATH && git pull origin main"
    echo -e "${GREEN}✅ 代码已更新${NC}"
fi

if [ "$choice" = "2" ] || [ "$choice" = "3" ]; then
    echo ""
    echo -e "${YELLOW}[3/4] 上传资源文件...${NC}"

    # 计算文件大小
    SIZE=$(du -sh "$LOCAL_PATH/frontend/public" | cut -f1)
    echo -e "  资源大小: ${YELLOW}$SIZE${NC}"
    echo -e "  目标: $SERVER_IP:$REMOTE_PATH/frontend/"

    read -p "确认上传? (y/n): " confirm
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        scp -r "$LOCAL_PATH/frontend/public" \
            $SERVER_USER@$SERVER_IP:$REMOTE_PATH/frontend/
        echo -e "${GREEN}✅ 资源已上传${NC}"
    else
        echo -e "${YELLOW}⏭️  已跳过资源上传${NC}"
    fi
fi

# 第 4 步：验证部署
echo ""
echo -e "${YELLOW}[4/4] 验证部署...${NC}"
ssh $SERVER_USER@$SERVER_IP "
    echo '检查项目结构...'
    ls -la $REMOTE_PATH/ | head -10
    echo ''
    echo '检查 public 目录...'
    ls -la $REMOTE_PATH/frontend/public/ | head -10
"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ 部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "后续步骤："
echo -e "  1) SSH 登录服务器: ${YELLOW}ssh root@47.111.177.153${NC}"
echo -e "  2) 启动后端: ${YELLOW}cd /opt/wangfeng-fan-website/backend && python3 start.py${NC}"
echo -e "  3) 配置 Nginx 和启动前端"
echo ""
