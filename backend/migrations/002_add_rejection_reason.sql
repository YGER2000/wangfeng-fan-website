-- 添加驳回理由字段到各个表
-- Migration: Add rejection_reason field
-- Date: 2025-01-14

-- 1. 文章表添加驳回理由字段
ALTER TABLE articles
ADD COLUMN rejection_reason TEXT DEFAULT NULL COMMENT '驳回理由';

-- 2. 视频表添加驳回理由字段
ALTER TABLE videos
ADD COLUMN rejection_reason TEXT DEFAULT NULL COMMENT '驳回理由';

-- 3. 图组表添加驳回理由字段
ALTER TABLE photo_groups
ADD COLUMN rejection_reason TEXT DEFAULT NULL COMMENT '驳回理由';

-- 验证字段是否添加成功
SHOW COLUMNS FROM articles LIKE 'rejection_reason';
SHOW COLUMNS FROM videos LIKE 'rejection_reason';
SHOW COLUMNS FROM photo_groups LIKE 'rejection_reason';
