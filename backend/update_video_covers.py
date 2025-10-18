#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
更新视频封面URL
从B站API获取已存在视频的封面URL并更新到数据库
"""

import sys
import os

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.video import Video
from app.utils.bilibili import get_video_info


def update_video_covers():
    """更新所有视频的封面URL"""
    db = SessionLocal()

    try:
        # 获取所有没有封面的视频
        videos = db.query(Video).filter(Video.cover_url == None).all()

        print(f"找到 {len(videos)} 个没有封面的视频")

        updated_count = 0
        failed_count = 0

        for video in videos:
            try:
                print(f"\n处理视频: {video.title} (BVID: {video.bvid})")

                # 从B站API获取视频信息
                video_info = get_video_info(video.bvid)

                if video_info and video_info.get('cover'):
                    cover_url = video_info.get('cover')
                    video.cover_url = cover_url
                    db.commit()
                    print(f"  ✅ 已更新封面: {cover_url}")
                    updated_count += 1
                else:
                    print(f"  ⚠️  无法获取封面URL")
                    failed_count += 1

            except Exception as e:
                print(f"  ❌ 更新失败: {e}")
                failed_count += 1
                db.rollback()

        print(f"\n" + "="*50)
        print(f"更新完成！")
        print(f"  成功: {updated_count} 个")
        print(f"  失败: {failed_count} 个")
        print("="*50)

    finally:
        db.close()


if __name__ == "__main__":
    update_video_covers()
