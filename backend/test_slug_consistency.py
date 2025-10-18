#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试前后端slug生成逻辑是否一致
"""

import sys
import re
from pathlib import Path

# 添加 backend 目录到 Python 路径
sys.path.insert(0, str(Path(__file__).parent))

from app.database import SessionLocal
from app.models.schedule_db import Schedule


def generate_slug_python(theme: str, date: str) -> str:
    """
    Python版本的slug生成（后端逻辑）
    """
    date_part = date.replace('-', '')
    theme_clean = re.sub(r'[^\u4e00-\u9fa5a-zA-Z0-9\s-]', '', theme).strip()
    theme_part = theme_clean[:20].replace(' ', '-').lower()
    slug = f"{date_part}-{theme_part}"
    if len(slug) > 100:
        slug = slug[:100]
    return slug


def generate_slug_javascript_simulation(theme: str, date: str) -> str:
    """
    模拟JavaScript版本的slug生成（前端逻辑）
    """
    date_part = date.replace('-', '')
    # JavaScript: theme.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s-]/g, '')
    theme_clean = re.sub(r'[^\u4e00-\u9fa5a-zA-Z0-9\s-]', '', theme).strip()
    # JavaScript: cleanedTheme.substring(0, 20).replace(/\s+/g, '-').toLowerCase()
    theme_part = theme_clean[:20].replace(' ', '-').lower()
    slug = f"{date_part}-{theme_part}"
    return slug


def test_slug_consistency():
    """测试所有已发布的行程信息的slug一致性"""
    db = SessionLocal()

    try:
        # 获取所有已发布的行程
        schedules = db.query(Schedule).filter(Schedule.is_published == 1).all()

        print("=" * 80)
        print("测试前后端slug生成逻辑一致性")
        print("=" * 80)
        print()

        all_consistent = True

        for schedule in schedules:
            python_slug = generate_slug_python(schedule.theme, schedule.date)
            js_slug = generate_slug_javascript_simulation(schedule.theme, schedule.date)

            is_consistent = python_slug == js_slug

            if not is_consistent:
                all_consistent = False
                print(f"❌ 不一致！")
            else:
                print(f"✅ 一致")

            print(f"   日期: {schedule.date}")
            print(f"   主题: {schedule.theme}")
            print(f"   Python生成: {python_slug}")
            print(f"   JavaScript生成: {js_slug}")
            print()

        print("=" * 80)
        if all_consistent:
            print("✅ 所有行程的slug生成逻辑一致！")
        else:
            print("❌ 发现不一致的slug！请检查上述输出。")
        print("=" * 80)

        return all_consistent

    finally:
        db.close()


def test_special_characters():
    """测试包含特殊字符的主题"""
    print("\n" + "=" * 80)
    print("测试特殊字符处理")
    print("=" * 80)
    print()

    test_cases = [
        ('汪峰"相信未来"巡回演唱会长沙站', '2025-12-27'),
        ('汪峰《相信未来》巡回演唱会', '2025-01-01'),
        ('汪峰&章子怡音乐会', '2025-02-14'),
        ('汪峰：新歌发布会！', '2025-03-15'),
        ('汪峰音乐节@北京', '2025-04-20'),
    ]

    all_consistent = True

    for theme, date in test_cases:
        python_slug = generate_slug_python(theme, date)
        js_slug = generate_slug_javascript_simulation(theme, date)

        is_consistent = python_slug == js_slug

        if not is_consistent:
            all_consistent = False
            print(f"❌ 不一致！")
        else:
            print(f"✅ 一致")

        print(f"   主题: {theme}")
        print(f"   Python生成: {python_slug}")
        print(f"   JavaScript生成: {js_slug}")
        print()

    print("=" * 80)
    if all_consistent:
        print("✅ 所有特殊字符测试通过！")
    else:
        print("❌ 特殊字符处理不一致！")
    print("=" * 80)

    return all_consistent


if __name__ == '__main__':
    # 测试实际数据库中的行程
    result1 = test_slug_consistency()

    # 测试特殊字符
    result2 = test_special_characters()

    if result1 and result2:
        print("\n✅ 所有测试通过！前后端slug生成逻辑完全一致。")
        sys.exit(0)
    else:
        print("\n❌ 测试失败！请修复不一致的问题。")
        sys.exit(1)
