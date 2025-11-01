#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
导入音乐标签到数据库
先删除所有旧标签，然后导入新的音乐标签
"""

import sys
import os
import json
from datetime import datetime

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import joinedload

from app.database import SessionLocal
from app.models.tag_db import Tag, TagCategory

DEFAULT_CATEGORY_NAME = "其他"
SEPARATORS = ("：", ":")


def split_tag_label(label: str):
    """将标签字符串拆分为 (种类, 值)。"""
    cleaned = (label or "").strip()
    if not cleaned:
        return DEFAULT_CATEGORY_NAME, ""

    for separator in SEPARATORS:
        index = cleaned.find(separator)
        if index != -1:
            category_part = cleaned[:index].strip()
            value_part = cleaned[index + 1 :].strip()
            if category_part and value_part:
                return category_part, value_part

    return DEFAULT_CATEGORY_NAME, cleaned


def get_or_create_category(db, name: str) -> TagCategory:
    """获取或创建标签种类。"""
    category = db.query(TagCategory).filter(TagCategory.name == name).first()
    if category:
        return category

    category = TagCategory(name=name)
    db.add(category)
    db.flush()
    return category

def import_music_tags():
    """导入音乐标签"""
    db = SessionLocal()

    try:
        # 1. 删除所有旧标签
        print("=" * 60)
        print("步骤 1: 删除所有旧标签...")
        print("=" * 60)
        
        old_tags_count = db.query(Tag).count()
        print(f"找到 {old_tags_count} 个旧标签")
        
        if old_tags_count > 0:
            db.query(Tag).delete()
            db.commit()
            print(f"✅ 已删除所有旧标签\n")
        else:
            print("✅ 没有旧标签需要删除\n")

        # 2. 加载新的音乐标签
        print("=" * 60)
        print("步骤 2: 加载音乐标签数据...")
        print("=" * 60)
        
        json_file = "/Users/yger/WithFaith/wangfeng-fan-website/backend/generated_music_tags.json"
        
        with open(json_file, 'r', encoding='utf-8') as f:
            tag_names = json.load(f)
        
        print(f"从 JSON 文件加载了 {len(tag_names)} 个标签\n")

        # 3. 导入新标签
        print("=" * 60)
        print("步骤 3: 导入音乐标签到数据库...")
        print("=" * 60)
        
        success_count = 0
        
        for tag_name in tag_names:
            try:
                category_name, value = split_tag_label(tag_name)
                if not value:
                    print(f"⚠️ 跳过空标签: {tag_name}")
                    continue

                category = get_or_create_category(db, category_name)

                new_tag = Tag(
                    category_id=category.id,
                    value=value,
                    created_at=datetime.utcnow()
                )
                new_tag.sync_display_name(category.name)

                db.add(new_tag)
                success_count += 1
                
                # 每50个标签提交一次
                if success_count % 50 == 0:
                    db.commit()
                    print(f"已导入 {success_count} 个标签...")
                    
            except Exception as e:
                print(f"❌ 导入标签失败: {tag_name} - {e}")
                db.rollback()
        
        # 提交剩余的标签
        db.commit()
        
        print(f"\n✅ 成功导入 {success_count} 个标签")
        
        # 4. 验证导入结果
        print("\n" + "=" * 60)
        print("步骤 4: 验证导入结果...")
        print("=" * 60)
        
        total_tags = db.query(Tag).count()
        album_tags = db.query(Tag).join(TagCategory).filter(TagCategory.name == '专辑').count()
        song_tags = db.query(Tag).join(TagCategory).filter(TagCategory.name == '单曲').count()
        
        print(f"数据库中总标签数: {total_tags}")
        print(f"  - 专辑标签: {album_tags} 个")
        print(f"  - 单曲标签: {song_tags} 个")
        
        # 显示前10个标签示例
        print("\n前10个标签示例:")
        sample_tags = (
            db.query(Tag)
            .options(joinedload(Tag.category))
            .order_by(Tag.created_at)
            .limit(10)
            .all()
        )
        for tag in sample_tags:
            category = tag.category.name if hasattr(tag, 'category') and tag.category else '未知种类'
            print(f"  [{tag.id}] {category} -> {tag.name}")
        
        print("\n" + "=" * 60)
        print("✅ 音乐标签导入完成！")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ 导入失败: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    import_music_tags()
