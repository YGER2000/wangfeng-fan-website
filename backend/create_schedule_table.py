#!/usr/bin/env python3
"""
创建行程表的脚本
运行此脚本会在 wangfeng_fan_website 数据库中创建 schedules 表
"""

from app.database import engine, Base
from app.models.schedule_db import Schedule

def create_schedule_table():
    """创建行程表"""
    print("正在创建行程表...")

    # 创建表
    Base.metadata.create_all(bind=engine, tables=[Schedule.__table__])

    print("✅ schedules 表创建成功！")
    print("\n表结构：")
    print("- id: 主键，自增")
    print("- category: 分类（演唱会/音乐节/商演/综艺活动/其他）")
    print("- date: 日期 YYYY-MM-DD")
    print("- city: 城市")
    print("- venue: 场馆/地点")
    print("- theme: 行程主题")
    print("- description: 补充说明")
    print("- image: 海报图片路径")
    print("- source: 数据来源")
    print("- created_at: 创建时间")
    print("- updated_at: 更新时间")

if __name__ == "__main__":
    create_schedule_table()
