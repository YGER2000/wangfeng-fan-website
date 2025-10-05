-- 创建行程表
-- 在 wangfeng_fan_website 数据库中运行此SQL

USE wangfeng_fan_website;

CREATE TABLE IF NOT EXISTS schedules (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    category VARCHAR(20) NOT NULL COMMENT '行程分类：演唱会/音乐节/商演/综艺活动/其他',
    date VARCHAR(10) NOT NULL COMMENT '行程日期 YYYY-MM-DD',
    city VARCHAR(50) NOT NULL COMMENT '城市',
    venue VARCHAR(200) DEFAULT NULL COMMENT '具体场馆/地点',
    theme VARCHAR(200) NOT NULL COMMENT '行程主题/详情',
    description TEXT DEFAULT NULL COMMENT '补充说明',
    image VARCHAR(500) DEFAULT NULL COMMENT '海报图片路径',
    source VARCHAR(20) NOT NULL DEFAULT 'custom' COMMENT '数据来源：legacy/custom',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_category (category),
    INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='行程信息表';

-- 显示表结构
DESCRIBE schedules;
