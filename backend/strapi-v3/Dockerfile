FROM node:20-alpine

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制依赖文件
COPY package.json pnpm-lock.yaml* ./

# 安装依赖
RUN pnpm install --frozen-lockfile || pnpm install

# 复制应用代码
COPY . .

# 暴露端口
EXPOSE 1337

# 启动 Strapi
CMD ["pnpm", "develop"]
