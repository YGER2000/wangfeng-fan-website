from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from urllib.parse import quote_plus


def build_database_url() -> str:
    """按照优先级拼接数据库连接串，默认指向 PostgreSQL fanpage。"""
    direct_url = os.getenv("DATABASE_URL")
    if direct_url:
        return direct_url

    db_engine = os.getenv("DATABASE_ENGINE", "postgresql+psycopg")
    is_postgres = "postgresql" in db_engine

    default_user = "wfnb" if is_postgres else "root"
    default_password = "dev_password" if is_postgres else "123456"
    default_host = "localhost"
    default_port = "5432" if is_postgres else "3306"
    default_name = "fanpage" if is_postgres else "wangfeng_fan_website"

    db_user = os.getenv("DATABASE_USER", default_user)
    db_password = quote_plus(os.getenv("DATABASE_PASSWORD", default_password))
    db_host = os.getenv("DATABASE_HOST", default_host)
    db_port = os.getenv("DATABASE_PORT", default_port)
    db_name = os.getenv("DATABASE_NAME", default_name)
    db_query = os.getenv("DATABASE_QUERY", "")

    query_suffix = ""
    if db_query:
        sanitized = db_query.lstrip("?")
        query_suffix = f"?{sanitized}"
    elif not is_postgres:
        # MySQL 默认追加 charset
        query_suffix = "?charset=utf8mb4"

    return f"{db_engine}://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}{query_suffix}"


SQLALCHEMY_DATABASE_URL = build_database_url()

# 创建数据库引擎
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,  # 自动检查连接是否有效
    pool_recycle=3600,   # 每小时回收连接
    echo=False           # 不打印 SQL 语句（生产环境设为 False）
)

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 创建基类
Base = declarative_base()

# 依赖项：获取数据库会话
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
