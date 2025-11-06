#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
从本地 `博客文章_增强版/` 目录读取 Markdown 文件，解析后导入到
`articles` 表中，默认发布到「峰言峰语 / 汪峰博客」栏目。

使用前确保：
1. 已安装 python-slugify 和 markdown：`pip install python-slugify markdown`
2. 数据库允许从当前机器连接（使用 appuser 账户）
"""

import json
import os
import re
import uuid
from datetime import datetime
from pathlib import Path

import mysql.connector
from markdown import markdown
from slugify import slugify


ROOT_DIR = Path(__file__).resolve().parents[1]
POSTS_DIR = ROOT_DIR / "博客文章_增强版"

DB_CONFIG = {
    "host": os.environ.get("IMPORT_DB_HOST", "47.111.177.153"),
    "user": "appuser",
    "password": "1q3.102w",
    "database": "wangfeng_fan_website",
    "charset": "utf8mb4",
}

CATEGORY_PRIMARY = "峰言峰语"
CATEGORY_SECONDARY = "汪峰博客"
DEFAULT_CATEGORY = "个人感悟"
DEFAULT_AUTHOR = "汪峰"
DEFAULT_TAGS = json.dumps([])

TIME_PATTERN = re.compile(r"\*\*发布时间\*\*\s*:\s*(.+)")
LINK_PATTERN = re.compile(r"\*\*原文链接\*\*\s*:\s*(.+)")


def load_existing_slugs(cursor) -> set[str]:
    cursor.execute("SELECT slug FROM articles")
    return {row[0] for row in cursor.fetchall()}


def parse_post(path: Path) -> dict:
    text = path.read_text(encoding="utf-8").strip()
    parts = text.split("---", 1)
    header = parts[0]
    body_md = parts[1] if len(parts) > 1 else ""

    lines = header.splitlines()
    if not lines or not lines[0].startswith("#"):
        raise ValueError(f"文件缺少标题: {path}")
    title = lines[0].lstrip("#").strip()

    time_match = TIME_PATTERN.search(header)
    if not time_match:
        raise ValueError(f"文件缺少发布时间: {path}")
    published_str = time_match.group(1).strip()
    published_at = datetime.strptime(published_str, "%Y-%m-%d %H:%M")

    link_match = LINK_PATTERN.search(header)
    original_link = link_match.group(1).strip() if link_match else None

    metadata_md = ""
    if original_link:
        metadata_md = f"> **原文链接**: [{original_link}]({original_link})\n\n"

    content_html = markdown(metadata_md + body_md.strip(), extensions=["extra"])

    plain_text = re.sub(r"<[^>]+>", "", content_html)
    plain_text = plain_text.replace("\xa0", " ").strip()
    excerpt = (plain_text[:150] + "...") if len(plain_text) > 150 else plain_text
    meta_description = (plain_text[:160]).strip() if plain_text else None

    return {
        "title": title,
        "content_html": content_html,
        "excerpt": excerpt,
        "meta_description": meta_description,
        "published_at": published_at,
    }


def build_slug(base: str, existing_slugs: set[str]) -> str | None:
    if base in existing_slugs:
        return None
    existing_slugs.add(base)
    return base


def main():
    if not POSTS_DIR.exists():
        raise SystemExit(f"目录不存在: {POSTS_DIR}")

    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()

    existing_slugs = load_existing_slugs(cursor)

    created_count = 0

    for path in sorted(POSTS_DIR.glob("*.md")):
        try:
            post = parse_post(path)
        except Exception as exc:  # noqa: BLE001
            print(f"[跳过] {path.name}: {exc}")
            continue

        date_prefix = post["published_at"].strftime("%Y%m%d")
        slug_base = f"{date_prefix}-{slugify(post['title'])}"
        slug = build_slug(slug_base, existing_slugs)
        if slug is None:
            print(f"[跳过] {path.name}: 已存在同名 slug，跳过导入")
            continue

        article_id = str(uuid.uuid4())
        timestamp = post["published_at"].strftime("%Y-%m-%d %H:%M:%S")

        cursor.execute(
            """
            INSERT INTO articles (
                id, title, slug, content, excerpt,
                author, category, category_primary, category_secondary,
                tags, cover_url,
                is_published, is_deleted, review_status,
                published_at, created_at, updated_at,
                meta_description, meta_keywords, view_count
            ) VALUES (
                %(id)s, %(title)s, %(slug)s, %(content)s, %(excerpt)s,
                %(author)s, %(category)s, %(category_primary)s, %(category_secondary)s,
                %(tags)s, %(cover_url)s,
                %(is_published)s, %(is_deleted)s, %(review_status)s,
                %(published_at)s, %(created_at)s, %(updated_at)s,
                %(meta_description)s, %(meta_keywords)s, %(view_count)s
            )
            """,
            {
                "id": article_id,
                "title": post["title"],
                "slug": slug,
                "content": post["content_html"],
                "excerpt": post["excerpt"],
                "author": DEFAULT_AUTHOR,
                "category": DEFAULT_CATEGORY,
                "category_primary": CATEGORY_PRIMARY,
                "category_secondary": CATEGORY_SECONDARY,
                "tags": DEFAULT_TAGS,
                "cover_url": None,
                "is_published": 1,
                "is_deleted": 0,
                "review_status": "approved",
                "published_at": timestamp,
                "created_at": timestamp,
                "updated_at": timestamp,
                "meta_description": post["meta_description"],
                "meta_keywords": "汪峰,博客",
                "view_count": 0,
            },
        )

        created_count += 1
        print(f"[导入] {path.name} -> {slug}")

    conn.commit()
    cursor.close()
    conn.close()

    print(f"导入完成，共新增 {created_count} 篇文章。")


if __name__ == "__main__":
    main()
