# -*- coding: utf-8 -*-
"""
B站视频信息抓取工具
用于从B站API获取视频封面、标题等信息
"""
import re
import requests
from typing import Optional, Dict
from urllib.parse import urlparse, parse_qs


def extract_bvid(url_or_bvid: str) -> Optional[str]:
    """
    从B站视频链接或BV号中提取BV号

    支持的格式:
    - BV1xx4y1x7xx (纯BV号)
    - https://www.bilibili.com/video/BV1xx4y1x7xx
    - https://b23.tv/xxxxx (短链接)
    - bilibili.com/video/BV1xx4y1x7xx

    Args:
        url_or_bvid: B站视频链接或BV号

    Returns:
        提取出的BV号，失败返回None
    """
    # 如果已经是BV号格式，直接返回
    bv_pattern = r'^(BV[a-zA-Z0-9]+)$'
    match = re.match(bv_pattern, url_or_bvid)
    if match:
        return match.group(1)

    # 从URL中提取BV号
    # 匹配 /video/BVxxxxx 格式
    url_pattern = r'(?:bilibili\.com/video/|b23\.tv/)?(BV[a-zA-Z0-9]+)'
    match = re.search(url_pattern, url_or_bvid)
    if match:
        return match.group(1)

    # 处理短链接 b23.tv
    if 'b23.tv' in url_or_bvid:
        try:
            # 短链接需要请求获取重定向后的真实链接
            response = requests.head(url_or_bvid, allow_redirects=True, timeout=5)
            real_url = response.url
            match = re.search(r'BV[a-zA-Z0-9]+', real_url)
            if match:
                return match.group(0)
        except Exception as e:
            print(f"解析短链接失败: {e}")
            return None

    return None


def get_video_info(bvid: str) -> Optional[Dict]:
    """
    从B站API获取视频信息

    Args:
        bvid: B站视频BV号

    Returns:
        视频信息字典，包含:
        - title: 标题
        - description: 描述
        - cover: 封面图URL
        - author: 作者
        - pubdate: 发布时间戳
        失败返回None
    """
    if not bvid:
        return None

    # B站API endpoint
    api_url = f"https://api.bilibili.com/x/web-interface/view?bvid={bvid}"

    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://www.bilibili.com/'
        }

        response = requests.get(api_url, headers=headers, timeout=10)
        response.raise_for_status()

        data = response.json()

        # 检查返回状态
        if data.get('code') != 0:
            print(f"B站API返回错误: {data.get('message')}")
            return None

        video_data = data.get('data', {})

        return {
            'title': video_data.get('title', ''),
            'description': video_data.get('desc', ''),
            'cover': video_data.get('pic', ''),  # 封面图URL
            'author': video_data.get('owner', {}).get('name', ''),
            'pubdate': video_data.get('pubdate', 0),  # Unix时间戳
            'duration': video_data.get('duration', 0),  # 视频时长(秒)
            'view': video_data.get('stat', {}).get('view', 0),  # 播放量
        }

    except requests.exceptions.RequestException as e:
        print(f"请求B站API失败: {e}")
        return None
    except Exception as e:
        print(f"解析B站视频信息失败: {e}")
        return None


def get_video_cover(url_or_bvid: str) -> Optional[str]:
    """
    快捷方法：直接从URL或BV号获取视频封面

    Args:
        url_or_bvid: B站视频链接或BV号

    Returns:
        封面图URL，失败返回None
    """
    bvid = extract_bvid(url_or_bvid)
    if not bvid:
        return None

    info = get_video_info(bvid)
    if info:
        return info.get('cover')

    return None


# 测试代码
if __name__ == "__main__":
    # 测试BV号提取
    test_cases = [
        "BV1xx4y1x7xx",
        "https://www.bilibili.com/video/BV1xx4y1x7xx",
        "https://www.bilibili.com/video/BV1xx4y1x7xx?p=1",
        "bilibili.com/video/BV1xx4y1x7xx",
    ]

    print("=== 测试BV号提取 ===")
    for test in test_cases:
        bvid = extract_bvid(test)
        print(f"{test} -> {bvid}")

    print("\n=== 测试获取视频信息 ===")
    # 使用一个真实的BV号测试（汪峰的某个视频）
    test_bvid = "BV1xx4y1x7xx"  # 替换为实际的BV号
    info = get_video_info(test_bvid)
    if info:
        print(f"标题: {info['title']}")
        print(f"封面: {info['cover']}")
        print(f"作者: {info['author']}")
    else:
        print("获取视频信息失败")
