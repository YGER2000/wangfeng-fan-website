# -*- coding: utf-8 -*-
"""
初始化游戏和投票数据的脚本
用于向数据库添加示例数据
"""

import sys
import os
import uuid
from datetime import datetime, timedelta

# 添加项目路径
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.database import SessionLocal, engine
from app.models.game import Game, Poll, PollOption, Base

# 创建表
Base.metadata.create_all(bind=engine)

db = SessionLocal()


def init_games():
    """初始化游戏数据"""
    print("初始化游戏数据...")

    games_data = [
        {
            'id': 'lyrics_guesser',
            'title': '歌词猜歌名',
            'description': '根据歌词片段，猜出汪峰的歌曲名称。需要熟悉汪峰的歌词才能快速作答。',
            'difficulty': 'easy',
            'icon_emoji': '🎵',
            'route_path': '/games/lyrics-guesser'
        },
        {
            'id': 'fill_lyrics',
            'title': '填词游戏',
            'description': '在缺少的歌词位置填入正确的词语。考查对歌词的深入了解。',
            'difficulty': 'medium',
            'icon_emoji': '✏️',
            'route_path': '/games/fill-lyrics'
        },
        {
            'id': 'song_matcher',
            'title': '歌曲配对',
            'description': '根据歌词提示，判断歌曲所属的专辑。适合专辑迷。',
            'difficulty': 'medium',
            'icon_emoji': '🎸',
            'route_path': '/games/song-matcher'
        },
    ]

    for game_data in games_data:
        # 检查是否已存在
        existing = db.query(Game).filter(Game.id == game_data['id']).first()
        if not existing:
            game = Game(**game_data)
            db.add(game)
            print(f"  ✓ 添加游戏: {game_data['title']}")
        else:
            print(f"  - 游戏已存在: {game_data['title']}")

    db.commit()


def init_polls():
    """初始化投票数据"""
    print("\n初始化投票数据...")

    now = datetime.utcnow()

    polls_data = [
        {
            'id': str(uuid.uuid4()),
            'title': '最喜欢的汪峰歌曲投票',
            'description': '您最喜欢的汪峰歌曲是哪一首？',
            'status': 'active',
            'start_date': now - timedelta(days=7),
            'end_date': now + timedelta(days=7),
            'is_published': True,
            'options': [
                '怒放的生命',
                '北京北京',
                '我真的需要你',
                '飞来飞去',
                '春天里',
                '生来彷徨',
            ]
        },
        {
            'id': str(uuid.uuid4()),
            'title': '最喜欢的汪峰专辑',
            'description': '您最喜欢的汪峰专辑是哪一个？',
            'status': 'active',
            'start_date': now - timedelta(days=3),
            'end_date': now + timedelta(days=11),
            'is_published': True,
            'options': [
                '鲍家街43号',
                '风暴来临',
                '花火',
                '爱是一颗幸福的子弹',
                '怒放的生命',
                '勇敢的心',
            ]
        },
        {
            'id': str(uuid.uuid4()),
            'title': '最想听的汪峰live版本',
            'description': '您最想听的汪峰歌曲live演绎？',
            'status': 'upcoming',
            'start_date': now + timedelta(days=14),
            'end_date': now + timedelta(days=21),
            'is_published': True,
            'options': [
                '怒放的生命 (凤凰传奇版)',
                '北京北京 (足球之夜)',
                '我真的需要你 (演唱会)',
                '飞来飞去 (跨年演唱会)',
            ]
        },
    ]

    for poll_data in polls_data:
        # 检查是否已存在
        existing = db.query(Poll).filter(Poll.id == poll_data['id']).first()
        if not existing:
            options = poll_data.pop('options')

            poll = Poll(**poll_data)
            db.add(poll)
            db.flush()  # 确保poll已保存

            # 添加选项
            for i, option_label in enumerate(options):
                option = PollOption(
                    id=str(uuid.uuid4()),
                    poll_id=poll.id,
                    label=option_label,
                    sort_order=i,
                    vote_count=0
                )
                db.add(option)

            print(f"  ✓ 添加投票: {poll_data['title']} (包含 {len(options)} 个选项)")
        else:
            print(f"  - 投票已存在: {poll_data['title']}")

    db.commit()


def main():
    """主函数"""
    print("开始初始化游戏和投票数据...\n")

    try:
        init_games()
        init_polls()
        print("\n✓ 初始化完成！")
    except Exception as e:
        print(f"\n✗ 初始化失败: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == '__main__':
    main()
