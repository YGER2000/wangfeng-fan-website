-- 为 users 表添加 avatar 字段
-- 用于存储用户头像路径

ALTER TABLE users ADD COLUMN avatar VARCHAR(500) NULL COMMENT '头像路径' AFTER hashed_password;
