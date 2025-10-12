#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
删除指定分类的文章脚本
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# 添加项目路径
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# 导入数据库配置
from backend.app.database import (
    DATABASE_USER, DATABASE_PASSWORD, DATABASE_HOST, 
    DATABASE_PORT, DATABASE_NAME
)

def delete_articles_by_category():
    """删除指定分类的文章"""
    # 构建数据库连接字符串
    database_url = f"mysql+pymysql://{DATABASE_USER}:{DATABASE_PASSWORD}@{DATABASE_HOST}:{DATABASE_PORT}/{DATABASE_NAME}?charset=utf8mb4"
    
    # 创建数据库引擎
    engine = create_engine(database_url, echo=True)
    
    # 创建会话
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # 要删除的分类
        categories_to_delete = [
            '峰迷荟萃',  # FengMiLiaoFeng.tsx 对应的分类
            '峰言峰语',  # FengYanFengYu.tsx 对应的分类
            '资料科普'   # ShuJuKePuNew.tsx 对应的分类
        ]
        
        print("准备删除以下分类的文章:")
        for category in categories_to_delete:
            print(f"  - {category}")
        
        # 查询将要删除的文章数量
        count_query = text("""
            SELECT COUNT(*) as count 
            FROM articles 
            WHERE category_primary IN :categories
        """)
        
        result = session.execute(count_query, {
            'categories': categories_to_delete
        })
        row = result.fetchone()
        count = row[0] if row else 0
        
        print(f"\n总共找到 {count} 篇文章将被删除。")
        
        if count == 0:
            print("没有找到匹配的文章，退出。")
            return
        
        # 确认删除
        confirm = input("\n确认删除这些文章吗？(输入 'yes' 确认): ")
        if confirm.lower() != 'yes':
            print("取消删除操作。")
            return
        
        # 先查询将要删除的文章数量
        count_query = text("""
            SELECT COUNT(*) as count 
            FROM articles 
            WHERE category_primary IN :categories
        """)
        
        result = session.execute(count_query, {
            'categories': categories_to_delete
        })
        row = result.fetchone()
        count_before = row[0] if row else 0
        
        # 执行删除操作
        delete_query = text("""
            DELETE FROM articles 
            WHERE category_primary IN :categories
        """)
        
        session.execute(delete_query, {
            'categories': categories_to_delete
        })
        
        # 提交事务
        session.commit()
        
        print(f"\n成功删除 {count_before} 篇文章。")
        
    except Exception as e:
        print(f"删除文章时出错: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    delete_articles_by_category()