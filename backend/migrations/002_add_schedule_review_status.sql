-- 行程审核状态字段迁移脚本
-- 版本: 002_add_schedule_review_status
-- 日期: 2025-10-06
-- 描述: 为 schedules 表添加审核状态字段

USE wangfeng_fan_website;

-- 添加 review_status 字段
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE table_schema = 'wangfeng_fan_website'
    AND table_name = 'schedules'
    AND column_name = 'review_status');

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE schedules ADD COLUMN review_status VARCHAR(20) DEFAULT ''pending'' NOT NULL COMMENT ''审核状态: pending/approved'' AFTER source',
    'SELECT ''Column review_status already exists'' AS msg');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 添加 is_published 字段
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE table_schema = 'wangfeng_fan_website'
    AND table_name = 'schedules'
    AND column_name = 'is_published');

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE schedules ADD COLUMN is_published TINYINT DEFAULT 0 NOT NULL COMMENT ''是否已发布: 0未发布/1已发布'' AFTER review_status',
    'SELECT ''Column is_published already exists'' AS msg');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 添加索引
SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE table_schema = 'wangfeng_fan_website'
    AND table_name = 'schedules'
    AND index_name = 'idx_review_status');

SET @sql = IF(@idx_exists = 0,
    'ALTER TABLE schedules ADD INDEX idx_review_status (review_status)',
    'SELECT ''Index idx_review_status already exists'' AS msg');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 更新现有数据：将所有现有行程设置为已审核已发布
UPDATE schedules SET review_status = 'approved', is_published = 1 WHERE review_status IS NULL OR review_status = '';

COMMIT;

SELECT 'Schedule review status migration completed successfully!' AS status;
