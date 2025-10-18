#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
迁移现有画廊数据到数据库
从 galleryUtils.ts 读取数据并导入到 MySQL
"""
import os
import sys
import uuid
from datetime import datetime
from sqlalchemy.orm import Session

# 添加项目路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.gallery_db import PhotoGroup, Photo

# 现有的画廊数据（从 galleryUtils.ts 复制）
photo_groups_data = [
    {
        "id": "daily-2025-04-15",
        "title": "汉江的夜色溜溜的面",
        "date": "2025-04-15",
        "display_date": "2025年4月15日",
        "category": "日常生活",
        "folder_path": "images/画廊/日常生活/2025.4.15-汉江的夜色溜溜的面",
        "cover_image": "images/画廊/日常生活/2025.4.15-汉江的夜色溜溜的面/2025.4.15-汉江的夜色溜溜的面1.jpg",
        "images": [
            "images/画廊/日常生活/2025.4.15-汉江的夜色溜溜的面/2025.4.15-汉江的夜色溜溜的面1.jpg",
            "images/画廊/日常生活/2025.4.15-汉江的夜色溜溜的面/2025.4.15-汉江的夜色溜溜的面2.jpg",
            "images/画廊/日常生活/2025.4.15-汉江的夜色溜溜的面/2025.4.15-汉江的夜色溜溜的面3.jpg",
            "images/画廊/日常生活/2025.4.15-汉江的夜色溜溜的面/2025.4.15-汉江的夜色溜溜的面4.jpg",
            "images/画廊/日常生活/2025.4.15-汉江的夜色溜溜的面/2025.4.15-汉江的夜色溜溜的面5.jpg",
            "images/画廊/日常生活/2025.4.15-汉江的夜色溜溜的面/2025.4.15-汉江的夜色溜溜的面6.jpg",
            "images/画廊/日常生活/2025.4.15-汉江的夜色溜溜的面/2025.4.15-汉江的夜色溜溜的面7.jpg",
            "images/画廊/日常生活/2025.4.15-汉江的夜色溜溜的面/2025.4.15-汉江的夜色溜溜的面8.jpg",
            "images/画廊/日常生活/2025.4.15-汉江的夜色溜溜的面/2025.4.15-汉江的夜色溜溜的面9.jpg",
            "images/画廊/日常生活/2025.4.15-汉江的夜色溜溜的面/2025.4.15-汉江的夜色溜溜的面10.jpg",
            "images/画廊/日常生活/2025.4.15-汉江的夜色溜溜的面/2025.4.15-汉江的夜色溜溜的面11.jpg"
        ],
        "year": "2025"
    },
    {
        "id": "work-2025-04-09",
        "title": "排练",
        "date": "2025-04-09",
        "display_date": "2025年4月9日",
        "category": "工作花絮",
        "folder_path": "images/画廊/工作花絮/2025.4.9-排练",
        "cover_image": "images/画廊/工作花絮/2025.4.9-排练/2025.4.9-排练1.jpg",
        "images": [
            "images/画廊/工作花絮/2025.4.9-排练/2025.4.9-排练1.jpg",
            "images/画廊/工作花絮/2025.4.9-排练/2025.4.9-排练2.jpg",
            "images/画廊/工作花絮/2025.4.9-排练/2025.4.9-排练3.jpg",
            "images/画廊/工作花絮/2025.4.9-排练/2025.4.9-排练4.jpg",
            "images/画廊/工作花絮/2025.4.9-排练/2025.4.9-排练5.jpg",
            "images/画廊/工作花絮/2025.4.9-排练/2025.4.9-排练6.jpg",
            "images/画廊/工作花絮/2025.4.9-排练/2025.4.9-排练7.jpg",
            "images/画廊/工作花絮/2025.4.9-排练/2025.4.9-排练8.jpg",
            "images/画廊/工作花絮/2025.4.9-排练/2025.4.9-排练9.jpg",
            "images/画廊/工作花絮/2025.4.9-排练/2025.4.9-排练10.jpg"
        ],
        "year": "2025"
    },
    {
        "id": "tour-2023-07-08",
        "title": "UNFOLLOW上海站",
        "date": "2023-07-08",
        "display_date": "2023年7月8日",
        "category": "巡演返图",
        "folder_path": "images/画廊/巡演返图/2023.7.8-UNFOLLOW上海站",
        "cover_image": "images/画廊/巡演返图/2023.7.8-UNFOLLOW上海站/2023.7.8-UNFOLLOW上海站1.jpg",
        "images": [
            "images/画廊/巡演返图/2023.7.8-UNFOLLOW上海站/2023.7.8-UNFOLLOW上海站1.jpg",
            "images/画廊/巡演返图/2023.7.8-UNFOLLOW上海站/2023.7.8-UNFOLLOW上海站2.jpg",
            "images/画廊/巡演返图/2023.7.8-UNFOLLOW上海站/2023.7.8-UNFOLLOW上海站3.jpg",
            "images/画廊/巡演返图/2023.7.8-UNFOLLOW上海站/2023.7.8-UNFOLLOW上海站4.jpg",
            "images/画廊/巡演返图/2023.7.8-UNFOLLOW上海站/2023.7.8-UNFOLLOW上海站5.jpg",
            "images/画廊/巡演返图/2023.7.8-UNFOLLOW上海站/2023.7.8-UNFOLLOW上海站6.jpg",
            "images/画廊/巡演返图/2023.7.8-UNFOLLOW上海站/2023.7.8-UNFOLLOW上海站7.jpg",
            "images/画廊/巡演返图/2023.7.8-UNFOLLOW上海站/2023.7.8-UNFOLLOW上海站8.jpg",
            "images/画廊/巡演返图/2023.7.8-UNFOLLOW上海站/2023.7.8-UNFOLLOW上海站9.jpg",
            "images/画廊/巡演返图/2023.7.8-UNFOLLOW上海站/2023.7.8-UNFOLLOW上海站10.jpg"
        ],
        "year": "2023"
    },
    {
        "id": "tour-2023-06-10",
        "title": "UNFOLLOW呼和浩特站",
        "date": "2023-06-10",
        "display_date": "2023年6月10日",
        "category": "巡演返图",
        "folder_path": "images/画廊/巡演返图/2023.6.10-UNFOLLOW呼和浩特站",
        "cover_image": "images/画廊/巡演返图/2023.6.10-UNFOLLOW呼和浩特站/2023.6.10-UNFOLLOW呼和浩特站1.jpg",
        "images": [
            "images/画廊/巡演返图/2023.6.10-UNFOLLOW呼和浩特站/2023.6.10-UNFOLLOW呼和浩特站1.jpg",
            "images/画廊/巡演返图/2023.6.10-UNFOLLOW呼和浩特站/2023.6.10-UNFOLLOW呼和浩特站2.jpg",
            "images/画廊/巡演返图/2023.6.10-UNFOLLOW呼和浩特站/2023.6.10-UNFOLLOW呼和浩特站3.jpg",
            "images/画廊/巡演返图/2023.6.10-UNFOLLOW呼和浩特站/2023.6.10-UNFOLLOW呼和浩特站4.jpg",
            "images/画廊/巡演返图/2023.6.10-UNFOLLOW呼和浩特站/2023.6.10-UNFOLLOW呼和浩特站5.jpg",
            "images/画廊/巡演返图/2023.6.10-UNFOLLOW呼和浩特站/2023.6.10-UNFOLLOW呼和浩特站6.jpg",
            "images/画廊/巡演返图/2023.6.10-UNFOLLOW呼和浩特站/2023.6.10-UNFOLLOW呼和浩特站7.jpg",
            "images/画廊/巡演返图/2023.6.10-UNFOLLOW呼和浩特站/2023.6.10-UNFOLLOW呼和浩特站8.jpg"
        ],
        "year": "2023"
    },
    {
        "id": "tour-2023-05-13",
        "title": "UNFOLLOW深圳站",
        "date": "2023-05-13",
        "display_date": "2023年5月13日",
        "category": "巡演返图",
        "folder_path": "images/画廊/巡演返图/2023-5.13-UNFOLLOW深圳站",
        "cover_image": "images/画廊/巡演返图/2023-5.13-UNFOLLOW深圳站/2023-5.13-UNFOLLOW深圳站1.jpg",
        "images": [
            "images/画廊/巡演返图/2023-5.13-UNFOLLOW深圳站/2023-5.13-UNFOLLOW深圳站1.jpg",
            "images/画廊/巡演返图/2023-5.13-UNFOLLOW深圳站/2023-5.13-UNFOLLOW深圳站2.jpg",
            "images/画廊/巡演返图/2023-5.13-UNFOLLOW深圳站/2023-5.13-UNFOLLOW深圳站3.jpg",
            "images/画廊/巡演返图/2023-5.13-UNFOLLOW深圳站/2023-5.13-UNFOLLOW深圳站4.jpg",
            "images/画廊/巡演返图/2023-5.13-UNFOLLOW深圳站/2023-5.13-UNFOLLOW深圳站5.jpg",
            "images/画廊/巡演返图/2023-5.13-UNFOLLOW深圳站/2023-5.13-UNFOLLOW深圳站6.jpg",
            "images/画廊/巡演返图/2023-5.13-UNFOLLOW深圳站/2023-5.13-UNFOLLOW深圳站7.jpg",
            "images/画廊/巡演返图/2023-5.13-UNFOLLOW深圳站/2023-5.13-UNFOLLOW深圳站8.jpg",
            "images/画廊/巡演返图/2023-5.13-UNFOLLOW深圳站/2023-5.13-UNFOLLOW深圳站9.jpg"
        ],
        "year": "2023"
    },
    {
        "id": "tour-2023-04-30",
        "title": "UNFOLLOW长沙站",
        "date": "2023-04-30",
        "display_date": "2023年4月30日",
        "category": "巡演返图",
        "folder_path": "images/画廊/巡演返图/2023.4.30-UNFOLLOW长沙站",
        "cover_image": "images/画廊/巡演返图/2023.4.30-UNFOLLOW长沙站/2023.4.30-UNFOLLOW长沙站1.jpg",
        "images": [
            "images/画廊/巡演返图/2023.4.30-UNFOLLOW长沙站/2023.4.30-UNFOLLOW长沙站1.jpg",
            "images/画廊/巡演返图/2023.4.30-UNFOLLOW长沙站/2023.4.30-UNFOLLOW长沙站2.jpg",
            "images/画廊/巡演返图/2023.4.30-UNFOLLOW长沙站/2023.4.30-UNFOLLOW长沙站3.jpg",
            "images/画廊/巡演返图/2023.4.30-UNFOLLOW长沙站/2023.4.30-UNFOLLOW长沙站4.jpg",
            "images/画廊/巡演返图/2023.4.30-UNFOLLOW长沙站/2023.4.30-UNFOLLOW长沙站5.jpg",
            "images/画廊/巡演返图/2023.4.30-UNFOLLOW长沙站/2023.4.30-UNFOLLOW长沙站6.jpg",
            "images/画廊/巡演返图/2023.4.30-UNFOLLOW长沙站/2023.4.30-UNFOLLOW长沙站7.jpg",
            "images/画廊/巡演返图/2023.4.30-UNFOLLOW长沙站/2023.4.30-UNFOLLOW长沙站8.jpg",
            "images/画廊/巡演返图/2023.4.30-UNFOLLOW长沙站/2023.4.30-UNFOLLOW长沙站9.jpg",
            "images/画廊/巡演返图/2023.4.30-UNFOLLOW长沙站/2023.4.30-UNFOLLOW长沙站10.jpg",
            "images/画廊/巡演返图/2023.4.30-UNFOLLOW长沙站/2023.4.30-UNFOLLOW长沙站11.jpg",
            "images/画廊/巡演返图/2023.4.30-UNFOLLOW长沙站/2023.4.30-UNFOLLOW长沙站12.jpg",
            "images/画廊/巡演返图/2023.4.30-UNFOLLOW长沙站/2023.4.30-UNFOLLOW长沙站13.jpg",
            "images/画廊/巡演返图/2023.4.30-UNFOLLOW长沙站/2023.4.30-UNFOLLOW长沙站14.jpg"
        ],
        "year": "2023"
    },
    {
        "id": "tour-2023-04-15",
        "title": "UNFOLLOW洛阳站",
        "date": "2023-04-15",
        "display_date": "2023年4月15日",
        "category": "巡演返图",
        "folder_path": "images/画廊/巡演返图/2023.4.15-UNFOLLOW洛阳站",
        "cover_image": "images/画廊/巡演返图/2023.4.15-UNFOLLOW洛阳站/2023.4.15-UNFOLLOW洛阳站1.png",
        "images": [
            "images/画廊/巡演返图/2023.4.15-UNFOLLOW洛阳站/2023.4.15-UNFOLLOW洛阳站1.png",
            "images/画廊/巡演返图/2023.4.15-UNFOLLOW洛阳站/2023.4.15-UNFOLLOW洛阳站2.jpg",
            "images/画廊/巡演返图/2023.4.15-UNFOLLOW洛阳站/2023.4.15-UNFOLLOW洛阳站3.jpg",
            "images/画廊/巡演返图/2023.4.15-UNFOLLOW洛阳站/2023.4.15-UNFOLLOW洛阳站4.jpg",
            "images/画廊/巡演返图/2023.4.15-UNFOLLOW洛阳站/2023.4.15-UNFOLLOW洛阳站5.jpg",
            "images/画廊/巡演返图/2023.4.15-UNFOLLOW洛阳站/2023.4.15-UNFOLLOW洛阳站6.jpg",
            "images/画廊/巡演返图/2023.4.15-UNFOLLOW洛阳站/2023.4.15-UNFOLLOW洛阳站7.jpg",
            "images/画廊/巡演返图/2023.4.15-UNFOLLOW洛阳站/2023.4.15-UNFOLLOW洛阳站8.jpg",
            "images/画廊/巡演返图/2023.4.15-UNFOLLOW洛阳站/2023.4.15-UNFOLLOW洛阳站9.jpg",
            "images/画廊/巡演返图/2023.4.15-UNFOLLOW洛阳站/2023.4.15-UNFOLLOW洛阳站10.jpg",
            "images/画廊/巡演返图/2023.4.15-UNFOLLOW洛阳站/2023.4.15-UNFOLLOW洛阳站11.jpg",
            "images/画廊/巡演返图/2023.4.15-UNFOLLOW洛阳站/2023.4.15-UNFOLLOW洛阳站12.jpg",
            "images/画廊/巡演返图/2023.4.15-UNFOLLOW洛阳站/2023.4.15-UNFOLLOW洛阳站13.jpg"
        ],
        "year": "2023"
    },
    {
        "id": "tour-2021-07-03",
        "title": "UNFOLLOW 苏州站",
        "date": "2021-07-03",
        "display_date": "2021年7月3日",
        "category": "巡演返图",
        "folder_path": "images/画廊/巡演返图/2021.7.3-UNFOLLOW 苏州站",
        "cover_image": "images/画廊/巡演返图/2021.7.3-UNFOLLOW 苏州站/2021.7.3-UNFOLLOW 苏州站1.jpg",
        "images": [
            "images/画廊/巡演返图/2021.7.3-UNFOLLOW 苏州站/2021.7.3-UNFOLLOW 苏州站1.jpg",
            "images/画廊/巡演返图/2021.7.3-UNFOLLOW 苏州站/2021.7.3-UNFOLLOW 苏州站2.jpg",
            "images/画廊/巡演返图/2021.7.3-UNFOLLOW 苏州站/2021.7.3-UNFOLLOW 苏州站3.jpg",
            "images/画廊/巡演返图/2021.7.3-UNFOLLOW 苏州站/2021.7.3-UNFOLLOW 苏州站4.jpg",
            "images/画廊/巡演返图/2021.7.3-UNFOLLOW 苏州站/2021.7.3-UNFOLLOW 苏州站5.jpg",
            "images/画廊/巡演返图/2021.7.3-UNFOLLOW 苏州站/2021.7.3-UNFOLLOW 苏州站6.jpg",
            "images/画廊/巡演返图/2021.7.3-UNFOLLOW 苏州站/2021.7.3-UNFOLLOW 苏州站7.jpg",
            "images/画廊/巡演返图/2021.7.3-UNFOLLOW 苏州站/2021.7.3-UNFOLLOW 苏州站8.jpg",
            "images/画廊/巡演返图/2021.7.3-UNFOLLOW 苏州站/2021.7.3-UNFOLLOW 苏州站9.jpg"
        ],
        "year": "2021"
    }
]


def migrate_gallery_data():
    """迁移画廊数据到数据库"""
    db = SessionLocal()

    try:
        print("开始迁移画廊数据...")
        print(f"总共 {len(photo_groups_data)} 个照片组")

        for group_data in photo_groups_data:
            # 检查照片组是否已存在
            existing_group = db.query(PhotoGroup).filter(PhotoGroup.id == group_data['id']).first()
            if existing_group:
                print(f"⚠️  照片组已存在，跳过: {group_data['title']}")
                continue

            # 创建照片组
            photo_group = PhotoGroup(
                id=group_data['id'],
                title=group_data['title'],
                category=group_data['category'],
                date=datetime.strptime(group_data['date'], '%Y-%m-%d'),
                display_date=group_data['display_date'],
                year=group_data['year'],
                cover_image_url=f"/{group_data['cover_image']}",
                cover_image_thumb_url=f"/{group_data['cover_image']}",  # 暂时使用原图
                storage_type='legacy',  # 标记为旧数据
                is_published=True,
                is_deleted=False
            )

            db.add(photo_group)
            print(f"✅ 创建照片组: {group_data['title']} ({len(group_data['images'])} 张照片)")

            # 创建照片记录
            for index, image_path in enumerate(group_data['images']):
                photo = Photo(
                    id=str(uuid.uuid4()),
                    photo_group_id=group_data['id'],
                    original_filename=image_path.split('/')[-1],
                    image_url=f"/{image_path}",
                    image_thumb_url=f"/{image_path}",  # 暂时使用原图
                    image_medium_url=f"/{image_path}",  # 暂时使用原图
                    storage_type='legacy',
                    storage_path=image_path,
                    sort_order=index,
                    is_deleted=False
                )
                db.add(photo)

        db.commit()
        print("\n✅ 数据迁移完成！")

        # 统计
        total_groups = db.query(PhotoGroup).filter(PhotoGroup.is_deleted == False).count()
        total_photos = db.query(Photo).filter(Photo.is_deleted == False).count()
        print(f"\n📊 数据统计:")
        print(f"   照片组总数: {total_groups}")
        print(f"   照片总数: {total_photos}")

    except Exception as e:
        print(f"\n❌ 迁移失败: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    migrate_gallery_data()
