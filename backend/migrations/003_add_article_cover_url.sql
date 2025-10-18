-- 为 articles 表添加封面图片字段
-- 创建时间: 2025-01-XX

-- 添加封面 URL 字段
ALTER TABLE articles
ADD COLUMN cover_url VARCHAR(500) DEFAULT NULL COMMENT '文章封面图片URL';

-- 添加索引以提升查询性能（如果需要按封面状态筛选）
CREATE INDEX idx_articles_cover_url ON articles(cover_url);
