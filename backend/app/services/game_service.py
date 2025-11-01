# -*- coding: utf-8 -*-
import json
import random
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import os

# 游戏相关的业务逻辑


class LyricsGuesser:
    """歌词猜歌名游戏"""

    def __init__(self, lyrics_file_path: str = "frontend/public/data/song-lyrics.json"):
        self.lyrics_file_path = lyrics_file_path
        self.songs_data = self._load_songs()

    def _load_songs(self) -> List[Dict[str, Any]]:
        """从JSON加载歌曲数据"""
        try:
            # 获取项目根目录
            project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
            file_path = os.path.join(project_root, self.lyrics_file_path)

            if not os.path.exists(file_path):
                return []

            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            # 将所有歌曲扁平化
            songs = []
            for album in data.get('albums', []):
                for song in album.get('songs', []):
                    songs.append({
                        'id': song['id'],
                        'title': song['title'],
                        'lyrics': song['lyrics'],
                        'album': album['name']
                    })
            return songs
        except Exception as e:
            print(f"加载歌词文件失败: {e}")
            return []

    def generate_question(self) -> Optional[Dict[str, Any]]:
        """生成一个游戏问题"""
        if not self.songs_data:
            return None

        song = random.choice(self.songs_data)
        lyrics_lines = [line.strip() for line in song['lyrics'].split('\n') if line.strip()]

        if len(lyrics_lines) < 2:
            return self.generate_question()

        # 随机选择1-3行歌词
        num_lines = min(random.randint(1, 3), len(lyrics_lines))
        selected_lyrics = random.sample(lyrics_lines, num_lines)

        # 获取4个选项（包括正确答案）
        options = self._get_options(song['title'], 4)

        return {
            'type': 'lyrics_guesser',
            'lyrics': '\n'.join(selected_lyrics),
            'options': options,
            'correct_answer': song['title'],
            'song_id': song['id'],
            'album': song['album']
        }

    def _get_options(self, correct_answer: str, count: int) -> List[str]:
        """获取选项（包括正确答案）"""
        if not self.songs_data:
            return [correct_answer]

        options = {correct_answer}
        all_titles = {song['title'] for song in self.songs_data}
        all_titles.discard(correct_answer)

        # 添加随机的错误选项
        wrong_options = random.sample(list(all_titles), min(count - 1, len(all_titles)))
        options.update(wrong_options)

        # 随机打乱顺序
        options_list = list(options)
        random.shuffle(options_list)
        return options_list


class FillLyrics:
    """填词游戏"""

    def __init__(self, lyrics_file_path: str = "frontend/public/data/song-lyrics.json"):
        self.lyrics_file_path = lyrics_file_path
        self.songs_data = self._load_songs()

    def _load_songs(self) -> List[Dict[str, Any]]:
        """从JSON加载歌曲数据"""
        try:
            project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
            file_path = os.path.join(project_root, self.lyrics_file_path)

            if not os.path.exists(file_path):
                return []

            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            songs = []
            for album in data.get('albums', []):
                for song in album.get('songs', []):
                    songs.append({
                        'id': song['id'],
                        'title': song['title'],
                        'lyrics': song['lyrics'],
                        'album': album['name']
                    })
            return songs
        except Exception as e:
            print(f"加载歌词文件失败: {e}")
            return []

    def generate_question(self) -> Optional[Dict[str, Any]]:
        """生成填词问题"""
        if not self.songs_data:
            return None

        song = random.choice(self.songs_data)
        lyrics_lines = [line.strip() for line in song['lyrics'].split('\n') if line.strip() and len(line.strip()) > 2]

        if not lyrics_lines:
            return self.generate_question()

        # 选择一行歌词
        selected_line = random.choice(lyrics_lines)

        # 分割成词语，找到合适的词语挖空
        words = selected_line.split()
        if len(words) < 2:
            return self.generate_question()

        # 随机选择一个词语挖空
        blank_index = random.randint(0, len(words) - 1)
        correct_answer = words[blank_index]

        # 创建有空白的句子
        display_line = ' '.join([f'__' if i == blank_index else word for i, word in enumerate(words)])

        # 获取选项
        options = self._get_options(correct_answer, 4)

        return {
            'type': 'fill_lyrics',
            'incomplete_lyrics': display_line,
            'full_line': selected_line,
            'options': options,
            'correct_answer': correct_answer,
            'song_title': song['title'],
            'song_id': song['id'],
            'album': song['album']
        }

    def _get_options(self, correct_answer: str, count: int) -> List[str]:
        """获取选项"""
        options = {correct_answer}

        # 从所有歌词中收集词语
        all_words = set()
        for song in self.songs_data:
            words = song['lyrics'].split()
            for word in words:
                word = word.strip('，。！？；：""''').strip()
                if len(word) > 0 and word != correct_answer:
                    all_words.add(word)

        # 添加随机词语作为错误选项
        if all_words:
            wrong_options = random.sample(list(all_words), min(count - 1, len(all_words)))
        else:
            wrong_options = []

        options.update(wrong_options)
        options_list = list(options)
        random.shuffle(options_list)
        return options_list


class SongMatcher:
    """歌曲配对游戏 - 配对歌曲与专辑或歌词"""

    def __init__(self, lyrics_file_path: str = "frontend/public/data/song-lyrics.json"):
        self.lyrics_file_path = lyrics_file_path
        self.songs_data = self._load_songs()

    def _load_songs(self) -> List[Dict[str, Any]]:
        """从JSON加载歌曲数据"""
        try:
            project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
            file_path = os.path.join(project_root, self.lyrics_file_path)

            if not os.path.exists(file_path):
                return []

            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            songs = []
            for album in data.get('albums', []):
                for song in album.get('songs', []):
                    songs.append({
                        'id': song['id'],
                        'title': song['title'],
                        'lyrics': song['lyrics'],
                        'album': album['name']
                    })
            return songs
        except Exception as e:
            print(f"加载歌词文件失败: {e}")
            return []

    def generate_question(self) -> Optional[Dict[str, Any]]:
        """生成配对问题"""
        if not self.songs_data or len(self.songs_data) < 2:
            return None

        # 随机选择一首歌
        song = random.choice(self.songs_data)

        # 获取该歌曲的歌词片段作为提示
        lyrics_lines = [line.strip() for line in song['lyrics'].split('\n') if line.strip()]
        if not lyrics_lines:
            return self.generate_question()

        lyric_hint = random.choice(lyrics_lines[:5])  # 选择前面的歌词作为提示

        # 生成4个选项（包括正确的专辑）
        albums = list(set(s['album'] for s in self.songs_data))
        if song['album'] not in albums:
            albums.append(song['album'])

        if len(albums) < 4:
            return self.generate_question()

        # 选择正确答案和3个错误答案
        options = [song['album']]
        other_albums = [a for a in albums if a != song['album']]
        wrong_options = random.sample(other_albums, min(3, len(other_albums)))
        options.extend(wrong_options)
        random.shuffle(options)

        return {
            'type': 'song_matcher',
            'song_title': song['title'],
            'lyric_hint': lyric_hint,
            'question_type': 'which_album',  # 这是哪个专辑
            'options': options,
            'correct_answer': song['album'],
            'song_id': song['id']
        }


# 创建全局游戏实例
lyrics_guesser = LyricsGuesser()
fill_lyrics = FillLyrics()
song_matcher = SongMatcher()
