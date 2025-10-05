from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # MySQL 数据库配置
    database_user: str = "root"
    database_password: str = "123456"
    database_host: str = "localhost"
    database_port: str = "3306"
    database_name: str = "wangfeng_fan_website"
    
    # JWT 配置
    secret_key: str = "your-secret-key-here-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings():
    return Settings()
