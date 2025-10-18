-- 添加视频封面URL字段
-- 执行命令: mysql -u root -p wangfeng_fan_db < backend/migrations/002_add_video_cover_url.sql

USE wangfeng_fan_db;

-- 添加 cover_url 字段
ALTER TABLE videos ADD COLUMN cover_url VARCHAR(500) DEFAULT NULL AFTER bvid;

-- 添加索引以提高查询性能
CREATE INDEX idx_videos_bvid ON videos(bvid);

SELECT 'Migration 002: Added cover_url column to videos table' AS status;
