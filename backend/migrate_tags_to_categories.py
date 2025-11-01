#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
将旧的单字段标签迁移为“标签种类 + 标签值”的新结构。

执行步骤：
1. 创建 tag_categories 表（如不存在）。
2. 为 tags 表添加 category_id / value 新列，并扩展 name 字段长度。
3. 解析已有标签名称，拆分出种类与值，写入新结构。
4. 尝试为新列添加约束与索引（若已存在会自动跳过）。

运行方式：
    python backend/migrate_tags_to_categories.py
"""

import os
import sys
from typing import Tuple

from sqlalchemy import inspect, text

# 将项目根目录加入 Python 路径，便于导入 app 包
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, PROJECT_ROOT)

from app.database import engine, SessionLocal  # noqa: E402
from app.models.tag_db import Tag, TagCategory  # noqa: E402

DEFAULT_CATEGORY_NAME = "其他"
SEPARATORS = ("：", ":")


def ensure_schema() -> None:
    """确保需要的表与列存在。"""
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()

    with engine.begin() as connection:
        if "tag_categories" not in existing_tables:
            print("-> 创建 tag_categories 表...")
            TagCategory.__table__.create(bind=engine, checkfirst=True)

        tag_columns = {col["name"] for col in inspector.get_columns("tags")}

        if "category_id" not in tag_columns:
            print("-> 为 tags 表添加 category_id 列...")
            connection.execute(text("ALTER TABLE tags ADD COLUMN category_id INT NULL"))

        if "value" not in tag_columns:
            print("-> 为 tags 表添加 value 列...")
            connection.execute(text("ALTER TABLE tags ADD COLUMN value VARCHAR(150) NULL AFTER category_id"))

        print("-> 调整 tags.name 字段长度至 200...")
        connection.execute(text("ALTER TABLE tags MODIFY COLUMN name VARCHAR(200) NOT NULL"))


def split_tag_name(raw_name: str) -> Tuple[str, str]:
    """根据分隔符拆分标签名称，返回 (category_name, value)。"""
    cleaned = (raw_name or "").strip()
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


def migrate_tags() -> None:
    """将旧标签数据迁移到新结构。"""
    session = SessionLocal()
    migrated = 0
    created_categories = 0

    try:
        tags = session.query(Tag).all()
        print(f"-> 待迁移标签数量：{len(tags)}")

        for tag in tags:
            category_name, value = split_tag_name(tag.name)

            category = (
                session.query(TagCategory)
                .filter(TagCategory.name == category_name)
                .first()
            )
            if not category:
                category = TagCategory(name=category_name)
                session.add(category)
                session.flush()
                created_categories += 1

            if tag.category_id != category.id or tag.value != value:
                tag.category_id = category.id
                tag.value = value
                tag.sync_display_name(category.name)
                migrated += 1

        session.commit()
        print(f"-> 新增标签种类：{created_categories}")
        print(f"-> 更新标签记录：{migrated}")
    except Exception as exc:  # pylint: disable=broad-except
        session.rollback()
        raise exc
    finally:
        session.close()


def enforce_constraints() -> None:
    """尝试为新结构增加约束和索引。"""
    inspector = inspect(engine)
    existing_indexes = {index["name"] for index in inspector.get_indexes("tags")}

    with engine.begin() as connection:
        print("-> 将 tags.category_id 设置为 NOT NULL...")
        try:
            connection.execute(text("ALTER TABLE tags MODIFY COLUMN category_id INT NOT NULL"))
        except Exception:  # pylint: disable=broad-except
            print("   (跳过) 无法设置 category_id 为 NOT NULL，可能已有约束。")

        print("-> 将 tags.value 设置为 NOT NULL...")
        try:
            connection.execute(text("ALTER TABLE tags MODIFY COLUMN value VARCHAR(150) NOT NULL"))
        except Exception:  # pylint: disable=broad-except
            print("   (跳过) 无法设置 value 为 NOT NULL，可能已有约束。")

        print("-> 添加 tags.category_id 外键约束...")
        try:
            connection.execute(text(
                "ALTER TABLE tags "
                "ADD CONSTRAINT fk_tags_category "
                "FOREIGN KEY (category_id) REFERENCES tag_categories(id) "
                "ON DELETE RESTRICT"
            ))
        except Exception:  # pylint: disable=broad-except
            print("   (跳过) 外键约束已存在。")

        print("-> 添加 (category_id, value) 唯一约束...")
        try:
            connection.execute(text(
                "ALTER TABLE tags "
                "ADD CONSTRAINT unique_category_value UNIQUE (category_id, value)"
            ))
        except Exception:  # pylint: disable=broad-except
            print("   (跳过) 唯一约束已存在。")

        if "idx_category_value" not in existing_indexes:
            print("-> 创建 idx_category_value 索引...")
            try:
                connection.execute(text(
                    "CREATE INDEX idx_category_value ON tags (category_id, value)"
                ))
            except Exception:  # pylint: disable=broad-except
                print("   (跳过) 创建索引失败，可能已存在。")


def main() -> None:
    print("=" * 60)
    print("开始迁移标签结构：单字段 -> 种类 + 值")
    print("=" * 60)

    ensure_schema()
    migrate_tags()
    enforce_constraints()

    print("=" * 60)
    print("迁移完成。请重启后端服务以验证新结构是否工作正常。")
    print("=" * 60)


if __name__ == "__main__":
    main()
