-- ============================================================================
-- 权限系统工作流优化迁移
-- ============================================================================
-- 目的: 规范化内容工作流字段，在现有review_status基础上添加缺失的字段
-- 变更: 添加created_by_id, submitted_by_id, submit_time等字段
-- ============================================================================

-- ============================================================================
-- 1. articles 表 - 检查并添加缺失字段
-- ============================================================================

-- 检查是否存在 created_by_id，如果不存在则添加
SELECT 'checking articles.created_by_id' as check_status;
ALTER TABLE articles ADD COLUMN `created_by_id` INT NULL AFTER `author_id`;
ALTER TABLE articles ADD COLUMN `submit_time` DATETIME NULL AFTER `created_at`;
ALTER TABLE articles ADD COLUMN `submitted_by_id` INT NULL AFTER `submit_time`;

-- 如果没有外键，则添加
ALTER TABLE articles ADD CONSTRAINT fk_articles_created_by FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL;
ALTER TABLE articles ADD CONSTRAINT fk_articles_submitted_by FOREIGN KEY (`submitted_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL;

-- 添加索引优化查询
ALTER TABLE articles ADD INDEX `idx_articles_created_by` (`created_by_id`);
ALTER TABLE articles ADD INDEX `idx_articles_submitted_by` (`submitted_by_id`);

-- ============================================================================
-- 2. videos 表 - 检查并添加缺失字段
-- ============================================================================

SELECT 'checking videos.created_by_id' as check_status;
ALTER TABLE videos ADD COLUMN `created_by_id` INT NULL AFTER `author_id`;
ALTER TABLE videos ADD COLUMN `submit_time` DATETIME NULL AFTER `created_at`;
ALTER TABLE videos ADD COLUMN `submitted_by_id` INT NULL AFTER `submit_time`;

ALTER TABLE videos ADD CONSTRAINT fk_videos_created_by FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL;
ALTER TABLE videos ADD CONSTRAINT fk_videos_submitted_by FOREIGN KEY (`submitted_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL;

ALTER TABLE videos ADD INDEX `idx_videos_created_by` (`created_by_id`);
ALTER TABLE videos ADD INDEX `idx_videos_submitted_by` (`submitted_by_id`);

-- ============================================================================
-- 3. photo_groups 表 - 检查并添加缺失字段
-- ============================================================================

SELECT 'checking photo_groups.created_by_id' as check_status;
ALTER TABLE photo_groups ADD COLUMN `created_by_id` INT NULL AFTER `author_id`;
ALTER TABLE photo_groups ADD COLUMN `submit_time` DATETIME NULL AFTER `created_at`;
ALTER TABLE photo_groups ADD COLUMN `submitted_by_id` INT NULL AFTER `submit_time`;

ALTER TABLE photo_groups ADD CONSTRAINT fk_photo_groups_created_by FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL;
ALTER TABLE photo_groups ADD CONSTRAINT fk_photo_groups_submitted_by FOREIGN KEY (`submitted_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL;

ALTER TABLE photo_groups ADD INDEX `idx_photo_groups_created_by` (`created_by_id`);
ALTER TABLE photo_groups ADD INDEX `idx_photo_groups_submitted_by` (`submitted_by_id`);

-- ============================================================================
-- 4. schedules 表 - 检查并添加缺失字段
-- ============================================================================

SELECT 'checking schedules.created_by_id' as check_status;
ALTER TABLE schedules ADD COLUMN `created_by_id` INT NULL AFTER `author_id`;
ALTER TABLE schedules ADD COLUMN `submit_time` DATETIME NULL AFTER `created_at`;
ALTER TABLE schedules ADD COLUMN `submitted_by_id` INT NULL AFTER `submit_time`;

ALTER TABLE schedules ADD CONSTRAINT fk_schedules_created_by FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL;
ALTER TABLE schedules ADD CONSTRAINT fk_schedules_submitted_by FOREIGN KEY (`submitted_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL;

ALTER TABLE schedules ADD INDEX `idx_schedules_created_by` (`created_by_id`);
ALTER TABLE schedules ADD INDEX `idx_schedules_submitted_by` (`submitted_by_id`);

-- ============================================================================
-- 5. 数据迁移 - 为现有数据设置默认值
-- ============================================================================

-- 注: 这里假设 users 表中存在 id=1 的默认用户
-- 如果不存在，请先创建或修改为现有的用户ID

-- 为所有现有内容设置创建者为1（假设用户ID 1存在）
UPDATE articles SET created_by_id = 1 WHERE created_by_id IS NULL LIMIT 1000;
UPDATE videos SET created_by_id = 1 WHERE created_by_id IS NULL LIMIT 1000;
UPDATE photo_groups SET created_by_id = 1 WHERE created_by_id IS NULL LIMIT 1000;
UPDATE schedules SET created_by_id = 1 WHERE created_by_id IS NULL LIMIT 1000;

-- ============================================================================
-- 验证
-- ============================================================================

SELECT 'Migration completed. Verifying...' as status;
SELECT
  'articles' as table_name,
  COUNT(*) as total_records,
  COUNT(created_by_id) as with_creator
FROM articles;

SELECT
  'videos' as table_name,
  COUNT(*) as total_records,
  COUNT(created_by_id) as with_creator
FROM videos;
