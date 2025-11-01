-- ============================================================================
-- Strapi V3 权限系统 - 数据库迁移脚本
-- ============================================================================
-- 目的: 为所有内容表添加新字段以支持工作流和权限系统
--
-- 变更内容:
-- 1. status: 草稿/待审核/已批准/已拒绝
-- 2. created_by_id: 内容创建者ID
-- 3. created_at: 创建时间
-- 4. submit_time: 提交审核时间
-- 5. submitted_by_id: 提交审核的用户ID
-- 6. reviewed_at: 审核完成时间
-- 7. reviewer_id: 审核者ID
-- 8. rejection_reason: 拒绝原因
-- ============================================================================

-- ============================================================================
-- 1. 文章表 (articles)
-- ============================================================================

ALTER TABLE articles ADD COLUMN `status` ENUM('draft', 'pending', 'approved', 'rejected') DEFAULT 'draft' AFTER `is_published`;
ALTER TABLE articles ADD COLUMN `created_by_id` INT NULL AFTER `status`;
ALTER TABLE articles ADD COLUMN `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP AFTER `created_by_id`;
ALTER TABLE articles ADD COLUMN `submit_time` DATETIME NULL AFTER `created_at`;
ALTER TABLE articles ADD COLUMN `submitted_by_id` INT NULL AFTER `submit_time`;
ALTER TABLE articles ADD COLUMN `reviewed_at` DATETIME NULL AFTER `submitted_by_id`;
ALTER TABLE articles ADD COLUMN `reviewer_id` INT NULL AFTER `reviewed_at`;
ALTER TABLE articles ADD COLUMN `rejection_reason` TEXT NULL AFTER `reviewer_id`;

-- 添加外键约束
ALTER TABLE articles ADD FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL;
ALTER TABLE articles ADD FOREIGN KEY (`submitted_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL;
ALTER TABLE articles ADD FOREIGN KEY (`reviewer_id`) REFERENCES `users`(`id`) ON DELETE SET NULL;

-- 添加索引优化查询
ALTER TABLE articles ADD INDEX `idx_status` (`status`);
ALTER TABLE articles ADD INDEX `idx_created_by_id` (`created_by_id`);
ALTER TABLE articles ADD INDEX `idx_reviewer_id` (`reviewer_id`);
ALTER TABLE articles ADD INDEX `idx_created_at` (`created_at`);

-- ============================================================================
-- 2. 视频表 (videos)
-- ============================================================================

ALTER TABLE videos ADD COLUMN `status` ENUM('draft', 'pending', 'approved', 'rejected') DEFAULT 'draft' AFTER `is_published`;
ALTER TABLE videos ADD COLUMN `created_by_id` INT NULL AFTER `status`;
ALTER TABLE videos ADD COLUMN `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP AFTER `created_by_id`;
ALTER TABLE videos ADD COLUMN `submit_time` DATETIME NULL AFTER `created_at`;
ALTER TABLE videos ADD COLUMN `submitted_by_id` INT NULL AFTER `submit_time`;
ALTER TABLE videos ADD COLUMN `reviewed_at` DATETIME NULL AFTER `submitted_by_id`;
ALTER TABLE videos ADD COLUMN `reviewer_id` INT NULL AFTER `reviewed_at`;
ALTER TABLE videos ADD COLUMN `rejection_reason` TEXT NULL AFTER `reviewer_id`;

ALTER TABLE videos ADD FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL;
ALTER TABLE videos ADD FOREIGN KEY (`submitted_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL;
ALTER TABLE videos ADD FOREIGN KEY (`reviewer_id`) REFERENCES `users`(`id`) ON DELETE SET NULL;

ALTER TABLE videos ADD INDEX `idx_status` (`status`);
ALTER TABLE videos ADD INDEX `idx_created_by_id` (`created_by_id`);
ALTER TABLE videos ADD INDEX `idx_reviewer_id` (`reviewer_id`);
ALTER TABLE videos ADD INDEX `idx_created_at` (`created_at`);

-- ============================================================================
-- 3. 图组表 (photo_groups)
-- ============================================================================

ALTER TABLE photo_groups ADD COLUMN `status` ENUM('draft', 'pending', 'approved', 'rejected') DEFAULT 'draft' AFTER `is_published`;
ALTER TABLE photo_groups ADD COLUMN `created_by_id` INT NULL AFTER `status`;
ALTER TABLE photo_groups ADD COLUMN `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP AFTER `created_by_id`;
ALTER TABLE photo_groups ADD COLUMN `submit_time` DATETIME NULL AFTER `created_at`;
ALTER TABLE photo_groups ADD COLUMN `submitted_by_id` INT NULL AFTER `submit_time`;
ALTER TABLE photo_groups ADD COLUMN `reviewed_at` DATETIME NULL AFTER `submitted_by_id`;
ALTER TABLE photo_groups ADD COLUMN `reviewer_id` INT NULL AFTER `reviewed_at`;
ALTER TABLE photo_groups ADD COLUMN `rejection_reason` TEXT NULL AFTER `reviewer_id`;

ALTER TABLE photo_groups ADD FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL;
ALTER TABLE photo_groups ADD FOREIGN KEY (`submitted_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL;
ALTER TABLE photo_groups ADD FOREIGN KEY (`reviewer_id`) REFERENCES `users`(`id`) ON DELETE SET NULL;

ALTER TABLE photo_groups ADD INDEX `idx_status` (`status`);
ALTER TABLE photo_groups ADD INDEX `idx_created_by_id` (`created_by_id`);
ALTER TABLE photo_groups ADD INDEX `idx_reviewer_id` (`reviewer_id`);
ALTER TABLE photo_groups ADD INDEX `idx_created_at` (`created_at`);

-- ============================================================================
-- 4. 行程表 (schedules)
-- ============================================================================

ALTER TABLE schedules ADD COLUMN `status` ENUM('draft', 'pending', 'approved', 'rejected') DEFAULT 'draft' AFTER `is_published`;
ALTER TABLE schedules ADD COLUMN `created_by_id` INT NULL AFTER `status`;
ALTER TABLE schedules ADD COLUMN `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP AFTER `created_by_id`;
ALTER TABLE schedules ADD COLUMN `submit_time` DATETIME NULL AFTER `created_at`;
ALTER TABLE schedules ADD COLUMN `submitted_by_id` INT NULL AFTER `submit_time`;
ALTER TABLE schedules ADD COLUMN `reviewed_at` DATETIME NULL AFTER `submitted_by_id`;
ALTER TABLE schedules ADD COLUMN `reviewer_id` INT NULL AFTER `reviewed_at`;
ALTER TABLE schedules ADD COLUMN `rejection_reason` TEXT NULL AFTER `reviewer_id`;

ALTER TABLE schedules ADD FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL;
ALTER TABLE schedules ADD FOREIGN KEY (`submitted_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL;
ALTER TABLE schedules ADD FOREIGN KEY (`reviewer_id`) REFERENCES `users`(`id`) ON DELETE SET NULL;

ALTER TABLE schedules ADD INDEX `idx_status` (`status`);
ALTER TABLE schedules ADD INDEX `idx_created_by_id` (`created_by_id`);
ALTER TABLE schedules ADD INDEX `idx_reviewer_id` (`reviewer_id`);
ALTER TABLE schedules ADD INDEX `idx_created_at` (`created_at`);

-- ============================================================================
-- 5. 数据迁移 - 为现有数据设置默认值
-- ============================================================================

-- 为所有现有内容设置创建者为1（假设用户ID 1存在，或改为适当的用户ID）
UPDATE articles SET created_by_id = 1 WHERE created_by_id IS NULL;
UPDATE videos SET created_by_id = 1 WHERE created_by_id IS NULL;
UPDATE photo_groups SET created_by_id = 1 WHERE created_by_id IS NULL;
UPDATE schedules SET created_by_id = 1 WHERE created_by_id IS NULL;

-- 为已发布的内容设置为approved（不需要审核）
UPDATE articles SET status = 'approved' WHERE is_published = 1 AND status = 'draft';
UPDATE videos SET status = 'approved' WHERE is_published = 1 AND status = 'draft';
UPDATE photo_groups SET status = 'approved' WHERE is_published = 1 AND status = 'draft';
UPDATE schedules SET status = 'approved' WHERE is_published = 1 AND status = 'draft';

-- ============================================================================
-- 验证脚本 - 运行以下查询确认迁移成功
-- ============================================================================

-- SELECT COUNT(*) as article_count,
--        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
--        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
--        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved
-- FROM articles;

-- SELECT COLUMN_NAME, COLUMN_TYPE
-- FROM INFORMATION_SCHEMA.COLUMNS
-- WHERE TABLE_NAME = 'articles'
-- AND COLUMN_NAME IN ('status', 'created_by_id', 'created_at');
