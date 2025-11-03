-- 添加权限系统字段到 articles 表
-- 2025-11-02

ALTER TABLE articles 
ADD COLUMN created_by_id INT NULL COMMENT '创建者ID（user表的ID）',
ADD COLUMN submit_time DATETIME NULL COMMENT '提交审核时间',
ADD COLUMN submitted_by_id INT NULL COMMENT '提交人ID';

-- 添加索引
CREATE INDEX idx_articles_created_by_id ON articles(created_by_id);
CREATE INDEX idx_articles_submitted_by_id ON articles(submitted_by_id);
