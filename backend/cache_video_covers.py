#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批量缓存视频封面脚本
下载B站封面到本地并保存为16:9比例的图片

使用方法:
python3 backend/cache_video_covers.py
"""
import sys
import os

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.database import SessionLocal
from app.models.video import Video
from app.utils.image_cache import cache_cover_image
import time


def cache_all_video_covers(force_update: bool = False):
    """批量缓存所有视频的封面"""
    db = SessionLocal()

    try:
        # 获取所有有B站封面URL的视频
        if force_update:
            videos = db.query(Video).filter(Video.cover_url.isnot(None)).all()
            print(f"强制更新模式：找到 {len(videos)} 个视频")
        else:
            # 只更新没有本地缓存的视频
            videos = db.query(Video).filter(
                Video.cover_url.isnot(None),
                Video.cover_local.is_(None)
            ).all()
            print(f"增量更新模式：找到 {len(videos)} 个需要缓存的视频")

        if not videos:
            print("没有需要缓存的视频")
            return

        print("-" * 50)

        success_count = 0
        skip_count = 0
        fail_count = 0

        for index, video in enumerate(videos, 1):
            print(f"\n[{index}/{len(videos)}] {video.title}")
            print(f"  BV号: {video.bvid}")

            # 如果已经有本地缓存且不是强制更新，跳过
            if not force_update and video.cover_local and video.cover_thumb:
                print(f"  ✓ 已有本地缓存，跳过")
                skip_count += 1
                continue

            # 缓存封面
            try:
                cover_local, cover_thumb = cache_cover_image(video.cover_url, video.bvid)

                if cover_local and cover_thumb:
                    # 更新数据库
                    video.cover_local = cover_local
                    video.cover_thumb = cover_thumb
                    db.commit()
                    success_count += 1
                else:
                    print(f"  ✗ 缓存失败")
                    fail_count += 1

            except Exception as e:
                print(f"  ✗ 缓存失败: {e}")
                fail_count += 1
                db.rollback()

            # 避免请求过快
            if index < len(videos):
                time.sleep(0.3)

        print("\n" + "=" * 50)
        print("缓存完成！")
        print(f"总计: {len(videos)} 个视频")
        print(f"成功: {success_count} 个")
        print(f"跳过: {skip_count} 个")
        print(f"失败: {fail_count} 个")
        print("=" * 50)

    except Exception as e:
        print(f"\n批量缓存过程中出错: {e}")
        db.rollback()
    finally:
        db.close()


def cache_single_video_cover(bvid: str):
    """缓存单个视频的封面"""
    db = SessionLocal()

    try:
        video = db.query(Video).filter(Video.bvid == bvid).first()

        if not video:
            print(f"未找到BV号为 {bvid} 的视频")
            return

        if not video.cover_url:
            print(f"该视频没有B站封面URL")
            return

        print(f"正在缓存视频封面: {video.title}")
        print(f"BV号: {video.bvid}")

        cover_local, cover_thumb = cache_cover_image(video.cover_url, video.bvid)

        if cover_local and cover_thumb:
            video.cover_local = cover_local
            video.cover_thumb = cover_thumb
            db.commit()
            print(f"\n✓ 缓存成功")
            print(f"  原图路径: {cover_local}")
            print(f"  缩略图路径: {cover_thumb}")
        else:
            print(f"\n✗ 缓存失败")

    except Exception as e:
        print(f"缓存失败: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='批量缓存视频封面到本地（16:9比例）')
    parser.add_argument('--bvid', type=str, help='单个视频的BV号')
    parser.add_argument('--force', action='store_true', help='强制更新已缓存的封面')
    parser.add_argument('--test', action='store_true', help='测试模式：只查看需要缓存的视频数量')

    args = parser.parse_args()

    print("=" * 50)
    print("视频封面本地缓存工具（16:9比例）")
    print("=" * 50)

    if args.bvid:
        # 缓存单个视频
        cache_single_video_cover(args.bvid)
    elif args.test:
        # 测试模式
        print("\n[测试模式] 正在检查需要缓存的视频...")
        db = SessionLocal()
        videos = db.query(Video).filter(
            Video.cover_url.isnot(None),
            Video.cover_local.is_(None)
        ).all()
        print(f"需要缓存的视频数量: {len(videos)}")
        for video in videos[:5]:
            print(f"  - {video.title} ({video.bvid})")
        if len(videos) > 5:
            print(f"  ... 还有 {len(videos) - 5} 个")
        db.close()
    else:
        # 批量缓存
        confirm = input(f"\n确认要批量缓存视频封面吗？{'(强制更新模式)' if args.force else '(增量更新模式)'} (yes/no): ")
        if confirm.lower() in ['yes', 'y']:
            cache_all_video_covers(force_update=args.force)
        else:
            print("已取消操作")
