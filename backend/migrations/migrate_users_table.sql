-- 用户表迁移脚本
-- 将 users 表从 UUID 主键改为自增整数主键（从10000开始），删除 full_name 字段

-- 1. 备份现有数据
CREATE TABLE users_backup AS SELECT * FROM users;

-- 2. 删除旧表
DROP TABLE IF EXISTS users;

-- 3. 创建新表结构
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '昵称(支持中文)',
    email VARCHAR(100) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login DATETIME,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_status (status)
) AUTO_INCREMENT=10000 COMMENT='用户表';

-- 4. 如果需要迁移旧数据，可以使用以下语句（可选）
-- INSERT INTO users (username, email, hashed_password, role, is_active, status, created_at, updated_at, last_login)
-- SELECT username, email, hashed_password, role, is_active, status, created_at, updated_at, last_login
-- FROM users_backup;

-- 5. 删除备份表（数据迁移确认无误后执行）
-- DROP TABLE users_backup;
