#!/usr/bin/env python3
"""
批量更新行程海报为指定的 OSS URL

用法：
    python backend/update_schedule_posters.py https://your-oss-domain/schedules/default/default-poster.jpg
"""
from __future__ import annotations

import sys
from typing import Optional

from app.database import SessionLocal
from app.models.schedule_db import Schedule


def update_posters(poster_url: str) -> int:
    """将所有行程的海报和缩略图更新为给定 URL，返回受影响的行程数量"""
    session = SessionLocal()
    updated = 0
    try:
        schedules = session.query(Schedule).all()
        for schedule in schedules:
            schedule.image = poster_url
            schedule.image_thumb = poster_url
            updated += 1
        session.commit()
        return updated
    finally:
        session.close()


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print("用法: python backend/update_schedule_posters.py <poster_url>")
        return 1

    poster_url = argv[1].strip()
    if not poster_url.startswith("http://") and not poster_url.startswith("https://"):
        print("错误：poster_url 必须是完整的 http(s) 地址")
        return 1

    count = update_posters(poster_url)
    print(f"✅ 已更新 {count} 条行程的海报为: {poster_url}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
