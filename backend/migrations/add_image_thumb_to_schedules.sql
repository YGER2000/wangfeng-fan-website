-- 为 schedules 表添加 image_thumb 字段
-- 用于存储压缩后的缩略图路径

ALTER TABLE schedules ADD COLUMN image_thumb VARCHAR(500) NULL COMMENT '海报缩略图路径（压缩图）' AFTER image;
