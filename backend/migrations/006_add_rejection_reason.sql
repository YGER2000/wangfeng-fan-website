-- 添加驳回理由字段到 articles, videos, photo_groups 表
-- 创建时间: 2025-10-31
-- 用途: 支持审核驳回时记录驳回原因

-- 1. 添加 rejection_reason 字段到 articles 表
ALTER TABLE articles
ADD COLUMN rejection_reason TEXT DEFAULT NULL
COMMENT '驳回理由';

-- 2. 添加 rejection_reason 字段到 videos 表
ALTER TABLE videos
ADD COLUMN rejection_reason TEXT DEFAULT NULL
COMMENT '驳回理由';

-- 3. 添加 rejection_reason 字段到 photo_groups 表
ALTER TABLE photo_groups
ADD COLUMN rejection_reason TEXT DEFAULT NULL
COMMENT '驳回理由';

-- 验证字段已添加
SELECT
    'articles' as table_name,
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'articles'
  AND COLUMN_NAME = 'rejection_reason'

UNION ALL

SELECT
    'videos' as table_name,
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'videos'
  AND COLUMN_NAME = 'rejection_reason'

UNION ALL

SELECT
    'photo_groups' as table_name,
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'photo_groups'
  AND COLUMN_NAME = 'rejection_reason';
