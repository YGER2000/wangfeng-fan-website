# -*- coding: utf-8 -*-
"""
文件上传路由
"""
from fastapi import APIRouter, File, UploadFile, HTTPException
from typing import Dict

from app.services.storage import get_storage

router = APIRouter(prefix="/api/upload", tags=["upload"])


@router.post("/image", response_model=Dict[str, str])
async def upload_image(file: UploadFile = File(...)):
    """
    上传图片

    - 支持格式: JPG, PNG, GIF, WEBP
    - 自动压缩到 1MB 以内
    - 返回图片访问 URL
    """
    # 检查文件类型
allowed_types = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/heic",
    "image/heif",
    "image/bmp",
]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"不支持的文件类型: {file.content_type}。支持: JPG, PNG, GIF, WEBP"
        )

    # 检查文件大小（限制 20MB 原始文件）
    content = await file.read()
    if len(content) > 20 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="文件过大，最大支持 20MB"
        )

    try:
        # 获取存储实例
        storage = get_storage()

        # 上传并压缩图片
        url = storage.upload_image(content, file.filename or "image")

        return {
            "url": url,
            "filename": file.filename,
            "message": "上传成功"
        }

    except Exception as e:
        print(f"❌ 上传失败: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"上传失败: {str(e)}"
        )


@router.delete("/image")
async def delete_image(url: str):
    """
    删除图片

    - 根据 URL 删除图片
    """
    try:
        storage = get_storage()
        success = storage.delete_image(url)

        if success:
            return {"message": "删除成功"}
        else:
            raise HTTPException(status_code=404, detail="图片不存在或删除失败")

    except Exception as e:
        print(f"❌ 删除失败: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"删除失败: {str(e)}"
        )
