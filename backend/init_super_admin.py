#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
初始化超级管理员账户

使用方法：
cd backend
python3 init_super_admin.py
"""

import sys
from pathlib import Path

# 添加 backend 目录到 Python 路径
sys.path.insert(0, str(Path(__file__).parent))

from app.database import SessionLocal
from app.models.user_db import User
from app.core.security import get_password_hash

def init_super_admin():
    """初始化超级管理员账户"""
    db = SessionLocal()

    try:
        # 检查超级管理员是否已存在
        existing_admin = db.query(User).filter(
            User.role == 'super_admin'
        ).first()

        if existing_admin:
            print(f"⚠️  超级管理员已存在:")
            print(f"   用户名: {existing_admin.username}")
            print(f"   邮箱: {existing_admin.email}")
            print(f"   角色: {existing_admin.role}")

            # 自动重置密码为 123456
            existing_admin.hashed_password = get_password_hash('123456')
            db.commit()
            print("\n✅ 密码已自动重置为: 123456")
            return

        # 创建超级管理员
        super_admin = User(
            username='忧郁的眼睛o',
            email='admin@wangfeng.fan',
            hashed_password=get_password_hash('123456'),
            role='super_admin',
            is_active=True,
            status='active'
        )

        db.add(super_admin)
        db.commit()
        db.refresh(super_admin)

        print("=" * 60)
        print("✅ 超级管理员创建成功！")
        print("=" * 60)
        print(f"用户名: {super_admin.username}")
        print(f"邮箱: {super_admin.email}")
        print(f"密码: 123456")
        print(f"角色: {super_admin.role}")
        print("=" * 60)

    except Exception as e:
        db.rollback()
        print(f"❌ 创建失败: {e}")
        raise
    finally:
        db.close()

if __name__ == '__main__':
    print("初始化超级管理员账户...")
    init_super_admin()
