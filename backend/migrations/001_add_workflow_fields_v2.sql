-- ============================================================================
-- 权限系统字段补充迁移
-- ============================================================================
-- 检查并添加缺少的字段（如果还没有的话）

-- ============================================================================
-- 1. 文章表 (articles) - 添加缺少的字段
-- ============================================================================

-- 检查并添加 submit_time 和 submitted_by_id（如果不存在）
ALTER TABLE articles ADD COLUMN `submit_time` DATETIME NULL AFTER `created_at`;
ALTER TABLE articles ADD COLUMN `submitted_by_id` INT NULL AFTER `submit_time`;

-- 检查并添加 rejection_reason（如果不存在）
ALTER TABLE articles ADD COLUMN `rejection_reason` TEXT NULL AFTER `review_notes`;

-- 添加缺少的外键
ALTER TABLE articles ADD FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL;
ALTER TABLE articles ADD FOREIGN KEY (`submitted_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL;

-- ============================================================================
-- 2. 视频表 (videos) - 添加缺少的字段
-- ============================================================================

ALTER TABLE videos ADD COLUMN `submit_time` DATETIME NULL AFTER `created_at`;
ALTER TABLE videos ADD COLUMN `submitted_by_id` INT NULL AFTER `submit_time`;
ALTER TABLE videos ADD COLUMN `rejection_reason` TEXT NULL AFTER `review_notes`;

ALTER TABLE videos ADD FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL;
ALTER TABLE videos ADD FOREIGN KEY (`submitted_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL;

-- ============================================================================
-- 3. 图组表 (photo_groups) - 添加缺少的字段
-- ============================================================================

ALTER TABLE photo_groups ADD COLUMN `submit_time` DATETIME NULL AFTER `created_at`;
ALTER TABLE photo_groups ADD COLUMN `submitted_by_id` INT NULL AFTER `submit_time`;
ALTER TABLE photo_groups ADD COLUMN `rejection_reason` TEXT NULL AFTER `review_notes`;

ALTER TABLE photo_groups ADD FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL;
ALTER TABLE photo_groups ADD FOREIGN KEY (`submitted_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL;

-- ============================================================================
-- 4. 行程表 (schedules) - 添加缺少的字段
-- ============================================================================

ALTER TABLE schedules ADD COLUMN `submit_time` DATETIME NULL AFTER `created_at`;
ALTER TABLE schedules ADD COLUMN `submitted_by_id` INT NULL AFTER `submit_time`;
ALTER TABLE schedules ADD COLUMN `rejection_reason` TEXT NULL AFTER `review_notes`;

ALTER TABLE schedules ADD FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL;
ALTER TABLE schedules ADD FOREIGN KEY (`submitted_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL;

-- ============================================================================
-- 验证脚本
-- ============================================================================

-- 验证文章表字段
-- DESC articles;

-- 验证数据完整性
-- SELECT COUNT(*) as total_articles,
--        COUNT(created_by_id) as with_creator,
--        COUNT(CASE WHEN status IS NOT NULL THEN 1 END) as with_status
-- FROM articles;
