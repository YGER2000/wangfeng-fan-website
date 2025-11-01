# -*- coding: utf-8 -*-
"""文章封面生成与解析工具"""
import base64
import html
import re
from typing import Optional


IMG_TAG_REGEX = re.compile(r'<img[^>]+src=["\']([^"\']+)["\']', re.IGNORECASE)
MARKDOWN_IMG_REGEX = re.compile(r'!\[.*?\]\(([^)]+)\)')


def extract_first_image(content: Optional[str]) -> Optional[str]:
    """
    从文章内容中提取第一张图片的 URL。

    支持 HTML <img> 标签与 Markdown 图片语法。
    """
    if not content:
        return None

    html_match = IMG_TAG_REGEX.search(content)
    if html_match and html_match.group(1):
        return html_match.group(1).strip()

    markdown_match = MARKDOWN_IMG_REGEX.search(content)
    if markdown_match and markdown_match.group(1):
        return markdown_match.group(1).strip()

    return None


def generate_placeholder_cover(title: Optional[str]) -> str:
    """
    基于文章标题生成紫色色调的渐变封面（SVG Base64）。

    参数:
        title: 文章标题

    返回:
        data URI 形式的 SVG 图片
    """
    safe_title = html.escape((title or '汪峰原创').strip())
    truncated_title = safe_title[:40] if len(safe_title) > 40 else safe_title

    svg_template = f'''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7C3AED"/>
      <stop offset="50%" stop-color="#8B5CF6"/>
      <stop offset="100%" stop-color="#C084FC"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#grad)"/>
  <g fill="rgba(255,255,255,0.15)">
    <circle cx="240" cy="180" r="160"/>
    <circle cx="1080" cy="540" r="220"/>
    <circle cx="980" cy="220" r="120"/>
    <circle cx="320" cy="520" r="200"/>
  </g>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
        font-family="Helvetica Neue, PingFang SC, Microsoft YaHei, sans-serif"
        font-size="72" fill="#FFFFFF" opacity="0.92">
    {truncated_title}
  </text>
</svg>
'''.strip()

    encoded = base64.b64encode(svg_template.encode('utf-8')).decode('ascii')
    return f'data:image/svg+xml;base64,{encoded}'


def resolve_article_cover(
    provided_cover: Optional[str],
    content: Optional[str]
) -> Optional[str]:
    """
    解析文章封面:
    1. 若手动上传封面，优先使用。
    2. 否则尝试从正文中提取第一张图片。

    返回:
        封面URL，若无法确定则为 None
    """
    if provided_cover:
        return provided_cover

    return extract_first_image(content)
