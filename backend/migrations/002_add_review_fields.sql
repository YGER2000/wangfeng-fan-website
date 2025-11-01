-- 添加审核字段到 videos 表
ALTER TABLE videos
ADD COLUMN author_id VARCHAR(36) NULL COMMENT '作者用户ID' AFTER author,
ADD COLUMN is_published INT DEFAULT 1 NOT NULL COMMENT '是否已发布: 0未发布/1已发布' AFTER cover_thumb,
ADD COLUMN review_status VARCHAR(20) DEFAULT 'pending' NOT NULL COMMENT '审核状态: pending/approved/rejected' AFTER is_published,
ADD COLUMN reviewer_id VARCHAR(36) NULL COMMENT '审核人ID' AFTER review_status,
ADD COLUMN review_notes TEXT NULL COMMENT '审核备注/拒绝原因' AFTER reviewer_id,
ADD COLUMN reviewed_at DATETIME NULL COMMENT '审核时间' AFTER review_notes,
ADD INDEX idx_videos_author_id (author_id),
ADD INDEX idx_videos_review_status (review_status),
ADD INDEX idx_videos_reviewer_id (reviewer_id);

-- 添加审核字段到 photo_groups 表
ALTER TABLE photo_groups
ADD COLUMN author_id VARCHAR(36) NULL COMMENT '创建者用户ID' AFTER description,
ADD COLUMN review_status VARCHAR(20) DEFAULT 'pending' NOT NULL COMMENT '审核状态: pending/approved/rejected' AFTER is_deleted,
ADD COLUMN reviewer_id VARCHAR(36) NULL COMMENT '审核人ID' AFTER review_status,
ADD COLUMN review_notes TEXT NULL COMMENT '审核备注/拒绝原因' AFTER reviewer_id,
ADD COLUMN reviewed_at DATETIME NULL COMMENT '审核时间' AFTER review_notes,
ADD INDEX idx_photo_groups_author_id (author_id),
ADD INDEX idx_photo_groups_review_status (review_status),
ADD INDEX idx_photo_groups_reviewer_id (reviewer_id);

-- 补充 schedules 表的审核字段（已有 review_status）
ALTER TABLE schedules
ADD COLUMN author_id VARCHAR(36) NULL COMMENT '创建者用户ID' AFTER source,
ADD COLUMN reviewer_id VARCHAR(36) NULL COMMENT '审核人ID' AFTER review_status,
ADD COLUMN review_notes TEXT NULL COMMENT '审核备注/拒绝原因' AFTER reviewer_id,
ADD COLUMN reviewed_at DATETIME NULL COMMENT '审核时间' AFTER review_notes,
ADD INDEX idx_schedules_author_id (author_id),
ADD INDEX idx_schedules_reviewer_id (reviewer_id);

-- 修改 schedules 表的 review_status 注释
ALTER TABLE schedules
MODIFY COLUMN review_status VARCHAR(20) DEFAULT 'pending' NOT NULL COMMENT '审核状态: pending/approved/rejected';
