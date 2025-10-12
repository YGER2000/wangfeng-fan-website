from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    # MySQL 数据库配置
    database_user: str = "root"
    database_password: str = "123456"
    database_host: str = "localhost"
    database_port: str = "3306"
    database_name: str = "wangfeng_fan_website"
    database_url: Optional[str] = None  # 完整数据库 URL（可选）

    # JWT 配置
    secret_key: str = "super-secret-key-for-wangfeng-fan-website"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # 阿里云邮件服务配置
    smtp_host: str = "smtpdm.aliyun.com"  # 阿里云DirectMail SMTP服务器
    smtp_port: int = 25  # 端口: 25, 80, 或 465(SSL)
    smtp_username: str = ""  # SMTP用户名
    smtp_password: str = ""  # SMTP密码
    sender_email: str = ""  # 发件人邮箱
    sender_name: str = "感受峰 感受存在"  # 发件人名称

    # 存储配置
    storage_type: str = "local"  # 可选: local, minio, r2, oss

    # 阿里云 OSS 配置
    oss_endpoint: str = ""
    oss_access_key: str = ""
    oss_secret_key: str = ""
    oss_bucket: str = "wangfeng-images"
    oss_custom_domain: str = ""

    # MinIO 配置
    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_bucket: str = "wangfeng-images"
    minio_secure: bool = False

    # Cloudflare R2 配置
    r2_account_id: str = ""
    r2_access_key: str = ""
    r2_secret_key: str = ""
    r2_bucket: str = "wangfeng-images"

    # 本地存储配置
    local_storage_path: str = "./uploads"

    # 应用配置
    debug: bool = False
    backend_port: int = 1994

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings():
    return Settings()
