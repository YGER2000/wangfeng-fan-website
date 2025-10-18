-- 创建图片画廊相关表
-- 执行时间：2025-10-16

-- 1. 创建照片组表
CREATE TABLE IF NOT EXISTS photo_groups (
    id VARCHAR(36) PRIMARY KEY COMMENT '照片组ID (UUID)',
    title VARCHAR(200) NOT NULL COMMENT '照片组标题',
    category VARCHAR(50) NOT NULL COMMENT '分类：巡演返图/工作花絮/日常生活',
    date DATETIME NOT NULL COMMENT '照片日期',
    display_date VARCHAR(100) COMMENT '显示日期（如：2023年7月8日）',
    year VARCHAR(4) COMMENT '年份',
    description TEXT COMMENT '描述',

    -- 封面图片信息
    cover_image_url VARCHAR(500) COMMENT '封面图片完整URL（原图）',
    cover_image_thumb_url VARCHAR(500) COMMENT '封面图片缩略图URL',

    -- 存储相关
    storage_type VARCHAR(20) DEFAULT 'local' COMMENT '存储类型：local/oss/r2/minio',

    -- 状态
    is_published BOOLEAN DEFAULT TRUE COMMENT '是否发布',
    is_deleted BOOLEAN DEFAULT FALSE COMMENT '是否删除',

    -- 时间戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    INDEX idx_category (category),
    INDEX idx_date (date),
    INDEX idx_year (year),
    INDEX idx_is_published (is_published),
    INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='照片组表';

-- 2. 创建照片表
CREATE TABLE IF NOT EXISTS photos (
    id VARCHAR(36) PRIMARY KEY COMMENT '照片ID (UUID)',
    photo_group_id VARCHAR(36) NOT NULL COMMENT '所属照片组ID',

    -- 图片信息
    original_filename VARCHAR(255) COMMENT '原始文件名',
    title VARCHAR(200) COMMENT '照片标题（可选）',
    description TEXT COMMENT '照片描述（可选）',

    -- 图片URL - 支持多种尺寸
    image_url VARCHAR(500) NOT NULL COMMENT '原图URL',
    image_thumb_url VARCHAR(500) COMMENT '缩略图URL（用于瀑布流展示，宽度约400px）',
    image_medium_url VARCHAR(500) COMMENT '中等尺寸URL（用于灯箱预览，宽度约1200px）',

    -- 图片元数据
    file_size INT COMMENT '文件大小（字节）',
    width INT COMMENT '图片宽度',
    height INT COMMENT '图片高度',
    mime_type VARCHAR(50) COMMENT 'MIME类型（image/jpeg, image/png等）',

    -- 存储相关
    storage_type VARCHAR(20) DEFAULT 'local' COMMENT '存储类型：local/oss/r2/minio',
    storage_path VARCHAR(500) COMMENT '存储路径（相对路径或OSS key）',

    -- 排序和状态
    sort_order INT DEFAULT 0 COMMENT '排序顺序',
    is_deleted BOOLEAN DEFAULT FALSE COMMENT '是否删除',

    -- 时间戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    INDEX idx_photo_group_id (photo_group_id),
    INDEX idx_sort_order (sort_order),
    INDEX idx_is_deleted (is_deleted),
    FOREIGN KEY (photo_group_id) REFERENCES photo_groups(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='照片表';

-- 插入示例数据（可选，用于测试）
-- INSERT INTO photo_groups (id, title, category, date, display_date, year, is_published) VALUES
-- (UUID(), '测试照片组', '工作花絮', '2025-01-01 00:00:00', '2025年1月1日', '2025', TRUE);
