#!/usr/bin/env python3
"""
Seed demo data for testing the tag content modal.

The script will:
1. Ensure a tag category named "测试标签" exists.
2. Ensure a tag "测试标签：星光限定" exists under that category.
3. Create one demo article, video, photo group, and schedule (if they don't exist yet).
4. Attach the demo tag to all these contents via the content_tags table.

Run it from the project root:
    python scripts/seed_tag_test_data.py
"""
from __future__ import annotations

import sys
import uuid
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = PROJECT_ROOT / "backend"

sys.path.insert(0, str(BACKEND_DIR))

from app.database import SessionLocal  # noqa: E402
from app.models.article import Article  # noqa: E402
from app.models.video import Video  # noqa: E402
from app.models.gallery_db import PhotoGroup  # noqa: E402
from app.models.schedule_db import Schedule  # noqa: E402
from app.models.tag_db import TagCategory, Tag, ContentTag  # noqa: E402


load_dotenv(BACKEND_DIR / ".env")


TAG_CATEGORY_NAME = "测试标签"
TAG_VALUE = "星光限定"
TAG_DISPLAY_NAME = f"{TAG_CATEGORY_NAME}：{TAG_VALUE}"


def ensure_tag(session) -> Tag:
    category = (
        session.query(TagCategory)
        .filter(TagCategory.name == TAG_CATEGORY_NAME)
        .first()
    )
    if not category:
        category = TagCategory(name=TAG_CATEGORY_NAME, description="演示标签分类")
        session.add(category)
        session.flush()

    tag = (
        session.query(Tag)
        .filter(Tag.category_id == category.id, Tag.value == TAG_VALUE)
        .first()
    )
    if not tag:
        tag = Tag(
            category_id=category.id,
            value=TAG_VALUE,
            name=TAG_DISPLAY_NAME,
            description="用于本地测试标签弹窗的数据",
        )
        session.add(tag)
        session.flush()

    return tag


def ensure_article(session, tag_name: str) -> Article:
    slug = "demo-tag-article"
    article = session.query(Article).filter(Article.slug == slug).first()
    if article:
        return article

    now = datetime.utcnow()
    article = Article(
        id=str(uuid.uuid4()),
        title="【测试】星光限定巡演回顾",
        slug=slug,
        content="这是一篇用于测试标签弹窗的文章内容，用于展示文章标签被关联后的表现。",
        excerpt="测试标签文章摘要 —— 星光限定巡演回顾。",
        author="系统管理员",
        category_primary="峰言峰语",
        category_secondary="汪峰博客",
        category="峰言峰语",
        tags=[tag_name],
        cover_url="https://dummyimage.com/1200x675/7c3aed/ffffff&text=Tag+Demo+Article",
        is_published=True,
        review_status="approved",
        reviewed_at=now,
        published_at=now,
        created_at=now,
        updated_at=now,
        view_count=520,
    )
    session.add(article)
    return article


def ensure_video(session, tag_name: str) -> Video:
    bvid = "BVtagDemo001"
    video = session.query(Video).filter(Video.bvid == bvid).first()
    if video:
        return video

    now = datetime.utcnow()
    video = Video(
        id=str(uuid.uuid4()),
        title="【测试】星光限定·现场集锦",
        description="用于演示标签弹窗的视频数据，展示前端如何列出拥有相同标签的视频。",
        author="系统管理员",
        category="演出现场",
        bvid=bvid,
        cover_url="https://dummyimage.com/960x540/9333ea/ffffff&text=Tag+Demo+Video",
        cover_local=None,
        cover_thumb=None,
        tags=[tag_name],
        is_published=1,
        review_status="approved",
        reviewed_at=now,
        publish_date=now,
        created_at=now,
        updated_at=now,
    )
    session.add(video)
    return video


def ensure_gallery(session, tag_name: str) -> PhotoGroup:
    title = "【测试】星光限定巡演图集"
    gallery = session.query(PhotoGroup).filter(PhotoGroup.title == title).first()
    if gallery:
        return gallery

    now = datetime.utcnow()
    gallery = PhotoGroup(
        id=str(uuid.uuid4()),
        title=title,
        category="巡演返图",
        date=now,
        display_date=now.strftime("%Y年%m月%d日"),
        year=str(now.year),
        description="测试标签对应的图集数据，帮助验证画廊标签展示。",
        cover_image_url="https://dummyimage.com/1200x800/6d28d9/ffffff&text=Tag+Demo+Gallery",
        cover_image_thumb_url="https://dummyimage.com/600x400/6d28d9/ffffff&text=Tag+Demo+Gallery",
        storage_type="oss",
        is_published=True,
        is_deleted=False,
        review_status="approved",
        reviewed_at=now,
        created_at=now,
        updated_at=now,
    )
    session.add(gallery)
    return gallery


def ensure_schedule(session, tag_name: str) -> Schedule:
    theme = "【测试】星光限定·城市快闪"
    schedule = (
        session.query(Schedule)
        .filter(Schedule.theme == theme, Schedule.city == "北京")
        .first()
    )
    if schedule:
        return schedule

    now = datetime.utcnow()
    schedule = Schedule(
        category="演唱会",
        date="2025-02-20",
        city="北京",
        venue="工体北看台",
        theme=theme,
        description="模拟带标签的行程数据，用于测试标签系统在行程中的行为表现。",
        image="https://dummyimage.com/900x1200/581c87/ffffff&text=Tag+Demo+Schedule",
        image_thumb="https://dummyimage.com/450x600/581c87/ffffff&text=Tag+Demo+Schedule",
        tags=tag_name,
        source="custom",
        review_status="approved",
        reviewed_at=now,
        is_published=1,
        created_at=now,
        updated_at=now,
    )
    session.add(schedule)
    session.flush()  # populate auto-incremented ID
    return schedule


def attach_tag(session, tag: Tag, content_type: str, content_id: str | int) -> None:
    content_id_str = str(content_id)
    existing = (
        session.query(ContentTag)
        .filter(
            ContentTag.tag_id == tag.id,
            ContentTag.content_type == content_type,
            ContentTag.content_id == content_id_str,
        )
        .first()
    )
    if existing:
        return

    session.add(
        ContentTag(
            tag_id=tag.id,
            content_type=content_type,
            content_id=content_id_str,
        )
    )


def main():
    session = SessionLocal()
    try:
        tag = ensure_tag(session)
        article = ensure_article(session, tag.name)
        video = ensure_video(session, tag.name)
        gallery = ensure_gallery(session, tag.name)
        schedule = ensure_schedule(session, tag.name)

        session.flush()

        attach_tag(session, tag, "article", article.id)
        attach_tag(session, tag, "video", video.id)
        attach_tag(session, tag, "gallery", gallery.id)
        attach_tag(session, tag, "schedule", schedule.id)

        session.commit()
        print("✅ Tag demo data ready!")
        print(f" - Tag: {tag.name} (ID: {tag.id})")
        print(f" - Article: {article.title} (slug={article.slug})")
        print(f" - Video: {video.title} (bvid={video.bvid})")
        print(f" - Gallery: {gallery.title}")
        print(f" - Schedule: {schedule.theme} (ID={schedule.id})")
    except Exception as exc:  # pragma: no cover
        session.rollback()
        raise
    finally:
        session.close()


if __name__ == "__main__":
    main()
