#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script to parse Wang Feng's lyrics collection and convert to JSON format.
"""

import json
import re
from typing import List, Dict, Any


def parse_lyrics_file(file_path: str) -> Dict[str, List[Dict[str, Any]]]:
    """
    Parse the lyrics text file and extract albums, songs, and lyrics.

    Args:
        file_path: Path to the lyrics text file

    Returns:
        Dictionary containing albums list with songs and lyrics
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    albums = []
    current_album = None
    current_song = None
    current_lyrics = []

    lines = content.split('\n')
    i = 0

    while i < len(lines):
        line = lines[i].strip()

        # Check if this is an album header (e.g., "第一张 鲍家街43号")
        album_match = re.match(r'^第.+张\s+(.+)$', line)
        if album_match:
            # Save previous song if exists
            if current_song and current_album:
                current_song['lyrics'] = '\n'.join(current_lyrics).strip()
                current_album['songs'].append(current_song)
                current_lyrics = []
                current_song = None

            # Save previous album if exists
            if current_album:
                albums.append(current_album)

            # Start new album
            album_name = album_match.group(1).strip()
            album_id = f"album_{len(albums) + 1}"
            current_album = {
                'id': album_id,
                'name': album_name,
                'songs': []
            }
            i += 1
            continue

        # Check if this is a song header (e.g., "1.	我真的需要")
        song_match = re.match(r'^(\d+)\.\s*(.+)$', line)
        if song_match and current_album:
            # Save previous song if exists
            if current_song:
                current_song['lyrics'] = '\n'.join(current_lyrics).strip()
                current_album['songs'].append(current_song)
                current_lyrics = []

            # Start new song
            song_number = song_match.group(1)
            song_title = song_match.group(2).strip()
            song_id = f"{current_album['id']}_song_{song_number}"
            current_song = {
                'id': song_id,
                'title': song_title,
                'lyrics': ''
            }
            i += 1
            continue

        # If we're currently parsing a song, add this line to lyrics
        if current_song:
            # Skip empty lines at the start of lyrics
            if line or current_lyrics:
                current_lyrics.append(line)

        i += 1

    # Save the last song and album
    if current_song and current_album:
        current_song['lyrics'] = '\n'.join(current_lyrics).strip()
        current_album['songs'].append(current_song)

    if current_album:
        albums.append(current_album)

    return {'albums': albums}


def main():
    """Main function to parse lyrics and save to JSON."""
    input_file = '/Users/yger/WithFaith/wangfeng-fan-website/data/汪峰歌词集.txt'
    output_file = '/Users/yger/WithFaith/wangfeng-fan-website/frontend/public/data/song-lyrics.json'

    print(f"Reading lyrics from: {input_file}")

    try:
        # Parse the lyrics file
        data = parse_lyrics_file(input_file)

        # Print statistics
        total_songs = sum(len(album['songs']) for album in data['albums'])
        print(f"\nParsing complete!")
        print(f"Total albums: {len(data['albums'])}")
        print(f"Total songs: {total_songs}")

        # Print album summary
        print("\nAlbum summary:")
        for i, album in enumerate(data['albums'], 1):
            print(f"  {i}. {album['name']} - {len(album['songs'])} songs")

        # Save to JSON file
        print(f"\nSaving to: {output_file}")
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        print("✓ JSON file created successfully!")

        # Validate JSON
        with open(output_file, 'r', encoding='utf-8') as f:
            json.load(f)
        print("✓ JSON validation passed!")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return 1

    return 0


if __name__ == '__main__':
    exit(main())
