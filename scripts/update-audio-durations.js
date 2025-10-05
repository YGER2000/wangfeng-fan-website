#!/usr/bin/env node

import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { parseFile } from 'music-metadata';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

console.log('🎵 开始扫描音频文件时长...\n');

async function getAudioDuration(filePath) {
  try {
    const metadata = await parseFile(filePath);
    return Math.round(metadata.format.duration || 0);
  } catch (error) {
    console.error(`❌ 无法读取文件: ${filePath}`);
    console.error(`   错误: ${error.message}`);
    return null;
  }
}

async function updateAlbumDurations() {
  // 读取albums.json文件
  const albumsPath = join(projectRoot, 'public/data/albums.json');
  
  let albumsData;
  try {
    const albumsContent = await readFile(albumsPath, 'utf-8');
    albumsData = JSON.parse(albumsContent);
  } catch (error) {
    console.error('❌ 无法读取albums.json文件:', error.message);
    return;
  }

  console.log(`📁 找到 ${albumsData.albums.length} 个专辑`);
  
  let totalSongs = 0;
  let updatedSongs = 0;
  let errorSongs = 0;

  // 遍历每个专辑
  for (const album of albumsData.albums) {
    console.log(`\n📀 处理专辑: ${album.name} (${album.year})`);
    
    // 遍历专辑中的每首歌
    for (const song of album.songs) {
      totalSongs++;
      
      // 构建音频文件的完整路径
      const audioPath = join(projectRoot, 'public', song.filePath);
      
      console.log(`   🎵 ${song.title}`);
      console.log(`      路径: ${song.filePath}`);
      
      // 检查文件是否存在
      if (!existsSync(audioPath)) {
        console.log(`      ⚠️  文件不存在，跳过`);
        errorSongs++;
        continue;
      }
      
      // 获取真实时长
      const duration = await getAudioDuration(audioPath);
      
      if (duration !== null) {
        const oldDuration = song.duration;
        song.duration = duration;
        
        // 转换为分:秒格式显示
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (oldDuration !== duration) {
          console.log(`      ✅ 更新时长: ${oldDuration}s → ${duration}s (${timeStr})`);
          updatedSongs++;
        } else {
          console.log(`      ✓  时长正确: ${duration}s (${timeStr})`);
        }
      } else {
        console.log(`      ❌ 读取失败，保持原值: ${song.duration}s`);
        errorSongs++;
      }
    }
  }

  // 保存更新后的数据
  try {
    await writeFile(albumsPath, JSON.stringify(albumsData, null, 2), 'utf-8');
    console.log(`\n✅ 成功更新albums.json文件`);
  } catch (error) {
    console.error(`\n❌ 保存文件失败:`, error.message);
    return;
  }

  // 输出统计信息
  console.log(`\n📊 扫描完成！`);
  console.log(`   总歌曲数: ${totalSongs}`);
  console.log(`   更新成功: ${updatedSongs}`);
  console.log(`   读取错误: ${errorSongs}`);
  console.log(`   未改变: ${totalSongs - updatedSongs - errorSongs}`);
  
  if (updatedSongs > 0) {
    console.log(`\n🎉 已更新 ${updatedSongs} 首歌曲的时长！`);
  }
  
  if (errorSongs > 0) {
    console.log(`\n⚠️  ${errorSongs} 首歌曲读取失败，请检查文件路径是否正确`);
  }
}

// 运行脚本
updateAlbumDurations().catch(console.error);