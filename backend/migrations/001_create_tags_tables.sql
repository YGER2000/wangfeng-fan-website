-- 标签系统数据库迁移脚本
-- 创建日期: 2025-10-14

-- 1. 创建标签主表
CREATE TABLE IF NOT EXISTS tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL COMMENT '标签名称',
    description TEXT NULL COMMENT '标签描述',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='标签主表';

-- 2. 创建内容-标签关联表
CREATE TABLE IF NOT EXISTS content_tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tag_id INT NOT NULL COMMENT '标签ID',
    content_type VARCHAR(50) NOT NULL COMMENT '内容类型: video/article/gallery/schedule/music',
    content_id INT NOT NULL COMMENT '内容ID',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    UNIQUE KEY unique_content_tag (content_type, content_id, tag_id),
    INDEX idx_tag (tag_id),
    INDEX idx_content (content_type, content_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='内容-标签关联表';

-- 3. 为现有 schedules 表添加 tags 字段（如果还没有）
ALTER TABLE schedules
ADD COLUMN IF NOT EXISTS tags TEXT NULL COMMENT '标签，用逗号分隔'
AFTER description;

-- 完成提示
SELECT '标签系统表创建成功！' AS message;
