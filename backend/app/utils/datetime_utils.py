"""时间工具函数 - 统一使用北京时间"""
from datetime import datetime, timezone, timedelta


# 北京时区 UTC+8
BEIJING_TZ = timezone(timedelta(hours=8))


def get_beijing_now() -> datetime:
    """
    获取当前北京时间（naive datetime，无时区信息）
    用于替代 datetime.utcnow()，直接存入MySQL等数据库
    """
    return datetime.now(BEIJING_TZ).replace(tzinfo=None)


def get_beijing_now_aware() -> datetime:
    """获取当前北京时间（aware datetime，包含时区信息）"""
    return datetime.now(BEIJING_TZ)


def utc_to_beijing(utc_dt: datetime) -> datetime:
    """将UTC时间转换为北京时间"""
    if utc_dt.tzinfo is None:
        # 如果是naive datetime，假设是UTC时间
        utc_dt = utc_dt.replace(tzinfo=timezone.utc)
    return utc_dt.astimezone(BEIJING_TZ)


def beijing_to_utc(beijing_dt: datetime) -> datetime:
    """将北京时间转换为UTC时间"""
    if beijing_dt.tzinfo is None:
        # 如果是naive datetime，假设是北京时间
        beijing_dt = beijing_dt.replace(tzinfo=BEIJING_TZ)
    return beijing_dt.astimezone(timezone.utc)
