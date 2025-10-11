-- 汪峰粉丝网站管理后台数据库迁移脚本
-- 版本: 001_add_admin_features
-- 日期: 2025-10-06
-- 描述: 添加管理后台功能所需的数据库字段和表

USE wangfeng_fan_website;

-- ============================================
-- 1. 修改 users 表：添加状态字段
-- ============================================
-- 检查并添加 status 列
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE table_schema = 'wangfeng_fan_website'
    AND table_name = 'users'
    AND column_name = 'status');

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT ''active'' NOT NULL COMMENT ''用户状态: active/inactive/banned'' AFTER is_active',
    'SELECT ''Column status already exists'' AS msg');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 添加索引
SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE table_schema = 'wangfeng_fan_website'
    AND table_name = 'users'
    AND index_name = 'idx_status');

SET @sql = IF(@idx_exists = 0,
    'ALTER TABLE users ADD INDEX idx_status (status)',
    'SELECT ''Index idx_status already exists'' AS msg');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 更新现有用户的状态
UPDATE users SET status = 'active' WHERE is_active = 1 AND (status IS NULL OR status = '');
UPDATE users SET status = 'inactive' WHERE is_active = 0 AND (status IS NULL OR status = '');

-- ============================================
-- 2. 修改 articles 表：添加审核字段
-- ============================================
-- 添加 author_id
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE table_schema = 'wangfeng_fan_website' AND table_name = 'articles' AND column_name = 'author_id');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE articles ADD COLUMN author_id VARCHAR(36) DEFAULT NULL COMMENT ''作者用户ID'' AFTER author',
    'SELECT ''Column author_id exists''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 添加 review_status
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE table_schema = 'wangfeng_fan_website' AND table_name = 'articles' AND column_name = 'review_status');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE articles ADD COLUMN review_status VARCHAR(20) DEFAULT ''pending'' NOT NULL COMMENT ''审核状态''',
    'SELECT ''Column review_status exists''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 添加 reviewer_id
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE table_schema = 'wangfeng_fan_website' AND table_name = 'articles' AND column_name = 'reviewer_id');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE articles ADD COLUMN reviewer_id VARCHAR(36) DEFAULT NULL COMMENT ''审核人ID''',
    'SELECT ''Column reviewer_id exists''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 添加 review_notes
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE table_schema = 'wangfeng_fan_website' AND table_name = 'articles' AND column_name = 'review_notes');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE articles ADD COLUMN review_notes TEXT DEFAULT NULL COMMENT ''审核备注''',
    'SELECT ''Column review_notes exists''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 添加 reviewed_at
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE table_schema = 'wangfeng_fan_website' AND table_name = 'articles' AND column_name = 'reviewed_at');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE articles ADD COLUMN reviewed_at DATETIME DEFAULT NULL COMMENT ''审核时间''',
    'SELECT ''Column reviewed_at exists''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 添加索引
SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE table_schema = 'wangfeng_fan_website' AND table_name = 'articles' AND index_name = 'idx_author_id');
SET @sql = IF(@idx_exists = 0, 'ALTER TABLE articles ADD INDEX idx_author_id (author_id)', 'SELECT ''Index exists''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE table_schema = 'wangfeng_fan_website' AND table_name = 'articles' AND index_name = 'idx_review_status');
SET @sql = IF(@idx_exists = 0, 'ALTER TABLE articles ADD INDEX idx_review_status (review_status)', 'SELECT ''Index exists''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE table_schema = 'wangfeng_fan_website' AND table_name = 'articles' AND index_name = 'idx_reviewer_id');
SET @sql = IF(@idx_exists = 0, 'ALTER TABLE articles ADD INDEX idx_reviewer_id (reviewer_id)', 'SELECT ''Index exists''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 更新现有已发布的文章为已批准状态
UPDATE articles SET review_status = 'approved' WHERE is_published = 1;

-- ============================================
-- 3. 创建 admin_logs 表：管理员操作日志
-- ============================================
CREATE TABLE IF NOT EXISTS admin_logs (
    id VARCHAR(36) PRIMARY KEY COMMENT '日志ID (UUID)',
    action VARCHAR(20) NOT NULL COMMENT '操作类型',
    resource_type VARCHAR(20) NOT NULL COMMENT '资源类型',
    resource_id VARCHAR(36) DEFAULT NULL COMMENT '资源ID',

    operator_id VARCHAR(36) NOT NULL COMMENT '操作者ID',
    operator_username VARCHAR(50) NOT NULL COMMENT '操作者用户名',
    operator_role VARCHAR(20) NOT NULL COMMENT '操作者角色',

    description TEXT DEFAULT NULL COMMENT '操作描述',
    details TEXT DEFAULT NULL COMMENT '详细信息 (JSON)',

    ip_address VARCHAR(45) DEFAULT NULL COMMENT 'IP地址 (支持IPv6)',
    user_agent VARCHAR(255) DEFAULT NULL COMMENT '浏览器信息',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

    INDEX idx_action (action),
    INDEX idx_resource_type (resource_type),
    INDEX idx_resource_id (resource_id),
    INDEX idx_operator_id (operator_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员操作日志表';

-- ============================================
-- 4. 验证表结构
-- ============================================
-- 查看 users 表结构
-- DESCRIBE users;

-- 查看 articles 表结构
-- DESCRIBE articles;

-- 查看 admin_logs 表结构
-- DESCRIBE admin_logs;

-- ============================================
-- 5. 插入测试数据（可选）
-- ============================================
-- 取消下面的注释以创建测试管理员账号
-- INSERT INTO users (id, username, email, hashed_password, full_name, role, is_active, status, created_at, updated_at)
-- VALUES (
--     UUID(),
--     'admin',
--     'admin@wangfeng.com',
--     '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5oGqXuWZzC/qW',  -- 密码: admin123
--     '超级管理员',
--     'super_admin',
--     1,
--     'active',
--     NOW(),
--     NOW()
-- );

COMMIT;

-- 迁移完成
SELECT 'Admin features migration completed successfully!' AS status;
