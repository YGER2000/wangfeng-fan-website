#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
创建行程信息文章模板示例

使用方法：
cd backend
python3 create_schedule_article_template.py
"""

import sys
import uuid
from pathlib import Path
from datetime import datetime

# 添加 backend 目录到 Python 路径
sys.path.insert(0, str(Path(__file__).parent))

from app.database import SessionLocal
from app.models.article import Article
from app.models.schedule_db import Schedule


def generate_schedule_article_content(schedule: Schedule) -> str:
    """
    根据行程信息生成文章内容（富文本HTML格式）

    模板结构：
    - 基本信息（时间、城市、场馆等）
    - 海报图片
    - 补充说明
    """

    # 构建基本信息部分（使用富文本HTML）
    basic_info = f"""<h2>📅 演出信息</h2>
<p><strong>时间</strong>: {schedule.date}</p>
<p><strong>城市</strong>: {schedule.city}</p>"""

    # 添加场馆信息（如果有）
    if schedule.venue and schedule.venue != 'TBA':
        basic_info += f"""<p><strong>场馆</strong>: {schedule.venue}</p>"""

    basic_info += f"""<p><strong>分类</strong>: {schedule.category}</p>"""

    # 构建海报部分
    poster_section = """<h2>🎤 演出海报</h2>"""
    if schedule.image:
        # 注意：文章中使用相对路径，前端会自动处理
        # 移除内联样式，让CSS控制图片显示
        poster_section += f'<p><img src="/{schedule.image}" alt="{schedule.theme}"></p>'
    else:
        poster_section += "<p><em>暂无海报</em></p>"

    # 构建补充说明部分
    description_section = ""
    if schedule.description:
        description_section = f"""<h2>📝 补充说明</h2>
<p>{schedule.description}</p>"""

    # 组合所有部分
    content = f"""{basic_info}
<hr>
{poster_section}{description_section}"""

    return content


def generate_slug(theme: str, date: str) -> str:
    """
    生成文章的 slug（URL友好的标识符）

    格式：日期-主题
    示例：20251227-汪峰相信未来巡回演唱会长沙站
    """
    # 使用日期（移除连字符）
    date_part = date.replace('-', '')

    import re
    # 移除所有特殊字符，只保留中文、英文、数字、空格和连字符
    # 使用Unicode范围匹配中文字符: \u4e00-\u9fa5
    theme_clean = re.sub(r'[^\u4e00-\u9fa5a-zA-Z0-9\s-]', '', theme).strip()
    # 取前20个字符，替换空格为连字符，转小写
    theme_part = theme_clean[:20].replace(' ', '-').lower()

    slug = f"{date_part}-{theme_part}"

    # 如果slug太长，截断
    if len(slug) > 100:
        slug = slug[:100]

    return slug


def create_schedule_article(schedule_id: int) -> Article:
    """
    为指定行程创建文章

    Args:
        schedule_id: 行程ID

    Returns:
        创建的文章对象
    """
    db = SessionLocal()

    try:
        # 1. 获取行程信息
        schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()

        if not schedule:
            raise ValueError(f"找不到ID为 {schedule_id} 的行程")

        # 2. 生成文章内容
        content = generate_schedule_article_content(schedule)

        # 3. 生成 slug
        slug = generate_slug(schedule.theme, schedule.date)

        # 5. 生成摘要
        excerpt = f"{schedule.date} | {schedule.city}"
        if schedule.venue and schedule.venue != 'TBA':
            excerpt += f" | {schedule.venue}"

        # 6. 生成标签 - 从行程的tags字段获取
        article_tags = []
        if schedule.tags:
            # schedule.tags 是逗号分隔的字符串
            article_tags = [tag.strip() for tag in schedule.tags.split(',') if tag.strip()]

        # 6. 创建文章
        article = Article(
            id=str(uuid.uuid4()),
            title=schedule.theme,
            slug=slug,
            content=content,
            excerpt=excerpt,
            author="感受峰感受存在",
            category_primary="资料科普",
            category_secondary="行程信息",
            category="行程信息",  # 兼容旧字段
            tags=article_tags,  # 使用行程的标签
            is_published=True,  # 默认发布
            review_status="approved",  # 默认已审核
            meta_description=f"{schedule.theme} - {schedule.date} {schedule.city}",
            meta_keywords=f"汪峰,{schedule.category},{schedule.city},演唱会"
        )

        db.add(article)
        db.commit()
        db.refresh(article)

        print(f"✅ 文章创建成功！")
        print(f"   - 标题: {article.title}")
        print(f"   - Slug: {article.slug}")
        print(f"   - 分类: {article.category_primary} / {article.category_secondary}")
        print(f"   - URL: http://localhost:1997/#/articles/{article.slug}")

        return article

    except Exception as e:
        db.rollback()
        print(f"❌ 创建文章失败: {e}")
        raise
    finally:
        db.close()


def main():
    print("=" * 60)
    print("行程信息文章模板生成器")
    print("=" * 60)

    # 使用行程ID 104 作为示例
    schedule_id = 104

    print(f"\n正在为行程 ID {schedule_id} 创建文章...\n")

    try:
        article = create_schedule_article(schedule_id)

        print("\n" + "=" * 60)
        print("✅ 示例文章创建完成！")
        print("=" * 60)
        print("\n请在浏览器中访问以下链接查看效果：")
        print(f"http://localhost:1997/#/articles/{article.slug}")
        print("\n或在前端的 资料科普 > 行程信息 分类下查看")

    except Exception as e:
        print(f"\n❌ 创建失败: {e}")
        return 1

    return 0


if __name__ == '__main__':
    sys.exit(main())
