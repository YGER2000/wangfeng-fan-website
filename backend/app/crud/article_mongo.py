from typing import List, Optional
from datetime import datetime
from slugify import slugify
import uuid

from app.core.database import get_database
from app.schemas.article import ArticleCreate, ArticleUpdate


async def create_article(article: ArticleCreate) -> dict:
    """创建新文章"""
    db = await get_database()

    # 生成唯一ID和slug
    article_id = str(uuid.uuid4())
    slug = slugify(article.title)

    # 确保slug唯一
    base_slug = slug
    counter = 1
    while await db.articles.find_one({"slug": slug}):
        slug = f"{base_slug}-{counter}"
        counter += 1

    # 如果没有摘要，从内容中生成
    excerpt = article.excerpt
    if not excerpt and article.content:
        excerpt = article.content[:150] + "..." if len(article.content) > 150 else article.content

    # 构建文档
    now = datetime.utcnow()
    article_doc = {
        "id": article_id,
        "slug": slug,
        "title": article.title,
        "content": article.content,
        "excerpt": excerpt,
        "author": article.author,
        "category": article.category,
        "tags": article.tags,
        "meta_description": article.meta_description,
        "meta_keywords": article.meta_keywords,
        "is_published": True,
        "is_deleted": False,
        "created_at": now,
        "updated_at": now,
        "published_at": now,
        "view_count": 0,
    }

    await db.articles.insert_one(article_doc)
    return article_doc


async def get_article(article_id: str) -> Optional[dict]:
    """根据ID获取文章"""
    db = await get_database()
    return await db.articles.find_one({
        "id": article_id,
        "is_deleted": False
    })


async def get_article_by_slug(slug: str) -> Optional[dict]:
    """根据slug获取文章"""
    db = await get_database()
    return await db.articles.find_one({
        "slug": slug,
        "is_deleted": False
    })


async def get_articles(
    skip: int = 0,
    limit: int = 50,
    category: Optional[str] = None,
    published_only: bool = True
) -> List[dict]:
    """获取文章列表"""
    db = await get_database()

    # 构建查询条件
    query = {"is_deleted": False}
    if published_only:
        query["is_published"] = True
    if category:
        query["category"] = category

    # 查询并排序
    cursor = db.articles.find(query).sort("published_at", -1).skip(skip).limit(limit)
    return await cursor.to_list(length=limit)


async def search_articles(
    query_text: str,
    skip: int = 0,
    limit: int = 50
) -> List[dict]:
    """搜索文章"""
    db = await get_database()

    # 使用正则表达式搜索标题和内容
    query = {
        "is_deleted": False,
        "is_published": True,
        "$or": [
            {"title": {"$regex": query_text, "$options": "i"}},
            {"content": {"$regex": query_text, "$options": "i"}}
        ]
    }

    cursor = db.articles.find(query).sort("published_at", -1).skip(skip).limit(limit)
    return await cursor.to_list(length=limit)


async def update_article(article_id: str, article_update: ArticleUpdate) -> Optional[dict]:
    """更新文章"""
    db = await get_database()

    # 检查文章是否存在
    existing = await get_article(article_id)
    if not existing:
        return None

    # 构建更新数据
    update_data = article_update.model_dump(exclude_unset=True)

    # 如果更新标题，需要重新生成slug
    if "title" in update_data:
        new_slug = slugify(update_data["title"])
        base_slug = new_slug
        counter = 1
        while True:
            conflict = await db.articles.find_one({
                "slug": new_slug,
                "id": {"$ne": article_id}
            })
            if not conflict:
                break
            new_slug = f"{base_slug}-{counter}"
            counter += 1
        update_data["slug"] = new_slug

    # 更新时间
    update_data["updated_at"] = datetime.utcnow()

    # 执行更新
    await db.articles.update_one(
        {"id": article_id},
        {"$set": update_data}
    )

    return await get_article(article_id)


async def delete_article(article_id: str) -> bool:
    """删除文章（软删除）"""
    db = await get_database()

    result = await db.articles.update_one(
        {"id": article_id, "is_deleted": False},
        {"$set": {"is_deleted": True, "updated_at": datetime.utcnow()}}
    )

    return result.modified_count > 0


async def increase_view_count(article_id: str) -> Optional[dict]:
    """增加浏览次数"""
    db = await get_database()

    await db.articles.update_one(
        {"id": article_id},
        {"$inc": {"view_count": 1}}
    )

    return await get_article(article_id)


async def get_article_count(category: Optional[str] = None) -> int:
    """获取文章总数"""
    db = await get_database()

    query = {
        "is_deleted": False,
        "is_published": True
    }
    if category:
        query["category"] = category

    return await db.articles.count_documents(query)


async def get_categories() -> List[str]:
    """获取所有分类"""
    db = await get_database()

    categories = await db.articles.distinct("category", {
        "is_deleted": False,
        "is_published": True
    })

    return [cat for cat in categories if cat]
