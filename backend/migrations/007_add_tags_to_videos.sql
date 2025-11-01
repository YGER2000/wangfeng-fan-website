-- 添加 tags 列到 videos 表
-- Migration: 007_add_tags_to_videos
-- Date: 2025-01-31

ALTER TABLE videos ADD COLUMN tags JSON DEFAULT (JSON_ARRAY());
