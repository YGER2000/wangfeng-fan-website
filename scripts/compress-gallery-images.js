#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置参数
const CONFIG = {
  maxSizeBytes: 3 * 1024 * 1024, // 3MB
  maxWidth: 1920, // 最大宽度
  maxHeight: 1080, // 最大高度
  quality: 85, // JPEG质量
  pngQuality: 80, // PNG质量
  webpQuality: 85, // WebP质量
  supportedFormats: ['.jpg', '.jpeg', '.png', '.webp'],
  galleryPath: path.join(__dirname, '../public/images/画廊'),
  backupPath: path.join(__dirname, '../backup/gallery-images-original')
};

// 创建备份目录
function createBackupDir() {
  if (!fs.existsSync(CONFIG.backupPath)) {
    fs.mkdirSync(CONFIG.backupPath, { recursive: true });
    console.log(`✅ 创建备份目录: ${CONFIG.backupPath}`);
  }
}

// 获取文件大小（MB）
function getFileSizeMB(filePath) {
  const stats = fs.statSync(filePath);
  return (stats.size / (1024 * 1024)).toFixed(2);
}

// 复制文件到备份目录
async function backupFile(sourcePath, relativePath) {
  const backupFilePath = path.join(CONFIG.backupPath, relativePath);
  const backupDir = path.dirname(backupFilePath);
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  if (!fs.existsSync(backupFilePath)) {
    fs.copyFileSync(sourcePath, backupFilePath);
    console.log(`📦 备份: ${relativePath}`);
  }
}

// 压缩单个图片
async function compressImage(inputPath, outputPath) {
  try {
    const ext = path.extname(inputPath).toLowerCase();
    const originalSize = fs.statSync(inputPath).size;
    
    // 使用临时文件避免输入输出同文件的问题
    const tempPath = outputPath + '.tmp';
    
    let pipeline = sharp(inputPath);
    
    // 获取图片信息
    const metadata = await pipeline.metadata();
    
    // 如果图片尺寸过大，先调整尺寸
    if (metadata.width > CONFIG.maxWidth || metadata.height > CONFIG.maxHeight) {
      pipeline = pipeline.resize(CONFIG.maxWidth, CONFIG.maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }
    
    // 根据格式进行压缩
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        pipeline = pipeline.jpeg({ 
          quality: CONFIG.quality,
          progressive: true,
          mozjpeg: true
        });
        break;
      case '.png':
        pipeline = pipeline.png({ 
          quality: CONFIG.pngQuality,
          compressionLevel: 9,
          progressive: true
        });
        break;
      case '.webp':
        pipeline = pipeline.webp({ 
          quality: CONFIG.webpQuality 
        });
        break;
      default:
        console.log(`⚠️  不支持的格式: ${ext}`);
        return false;
    }
    
    // 保存压缩后的图片到临时文件
    await pipeline.toFile(tempPath);
    
    // 检查压缩效果
    const tempSize = fs.statSync(tempPath).size;
    
    // 只有压缩效果好才替换原文件
    if (tempSize < originalSize) {
      fs.renameSync(tempPath, outputPath);
      const compressionRatio = ((originalSize - tempSize) / originalSize * 100).toFixed(1);
      console.log(`✅ ${path.basename(inputPath)}: ${getFileSizeMB(inputPath)}MB → ${getFileSizeMB(outputPath)}MB (压缩${compressionRatio}%)`);
      
      return {
        originalSize,
        newSize: tempSize,
        compressionRatio: parseFloat(compressionRatio)
      };
    } else {
      // 压缩效果不好，删除临时文件，保留原文件
      fs.unlinkSync(tempPath);
      console.log(`⚠️  ${path.basename(inputPath)}: 压缩后反而更大，保留原文件`);
      return false;
    }
  } catch (error) {
    // 清理临时文件
    const tempPath = outputPath + '.tmp';
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    console.error(`❌ 压缩失败 ${inputPath}:`, error.message);
    return false;
  }
}

// 递归获取所有图片文件
function getAllImageFiles(dir, baseDir = dir) {
  let files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files = files.concat(getAllImageFiles(fullPath, baseDir));
    } else if (stat.isFile()) {
      const ext = path.extname(item).toLowerCase();
      if (CONFIG.supportedFormats.includes(ext)) {
        const relativePath = path.relative(baseDir, fullPath);
        files.push({
          fullPath,
          relativePath,
          size: stat.size
        });
      }
    }
  }
  
  return files;
}

// 主函数
async function main() {
  console.log('🖼️  画廊图片压缩工具');
  console.log('====================');
  
  // 检查 sharp 是否安装
  try {
    await sharp({ create: { width: 1, height: 1, channels: 3, background: 'black' } })
      .png()
      .toBuffer();
  } catch (error) {
    console.error('❌ 请先安装 sharp: pnpm install sharp');
    console.error('详细错误:', error.message);
    process.exit(1);
  }
  
  // 检查画廊目录是否存在
  if (!fs.existsSync(CONFIG.galleryPath)) {
    console.error(`❌ 画廊目录不存在: ${CONFIG.galleryPath}`);
    process.exit(1);
  }
  
  // 创建备份目录
  createBackupDir();
  
  console.log(`📁 扫描目录: ${CONFIG.galleryPath}`);
  console.log(`🎯 目标大小: ${CONFIG.maxSizeBytes / (1024 * 1024)}MB`);
  console.log(`📐 最大尺寸: ${CONFIG.maxWidth}×${CONFIG.maxHeight}`);
  console.log('');
  
  // 获取所有图片文件
  const imageFiles = getAllImageFiles(CONFIG.galleryPath);
  
  // 筛选需要压缩的文件
  const filesToCompress = imageFiles.filter(file => file.size > CONFIG.maxSizeBytes);
  
  console.log(`📊 统计信息:`);
  console.log(`   总图片数: ${imageFiles.length}`);
  console.log(`   需要压缩: ${filesToCompress.length}`);
  console.log(`   无需处理: ${imageFiles.length - filesToCompress.length}`);
  console.log('');
  
  if (filesToCompress.length === 0) {
    console.log('🎉 所有图片都已符合大小要求！');
    return;
  }
  
  // 开始压缩
  console.log('🚀 开始压缩...');
  console.log('');
  
  let totalOriginalSize = 0;
  let totalNewSize = 0;
  let successCount = 0;
  
  for (const file of filesToCompress) {
    const { fullPath, relativePath } = file;
    
    try {
      // 备份原文件
      await backupFile(fullPath, relativePath);
      
      // 压缩图片（覆盖原文件）
      const result = await compressImage(fullPath, fullPath);
      
      if (result) {
        totalOriginalSize += result.originalSize;
        totalNewSize += result.newSize;
        successCount++;
      }
      
    } catch (error) {
      console.error(`❌ 处理失败 ${relativePath}:`, error.message);
    }
  }
  
  // 输出总结
  console.log('');
  console.log('📈 压缩完成！');
  console.log('====================');
  console.log(`✅ 成功压缩: ${successCount}/${filesToCompress.length} 个文件`);
  console.log(`💾 原始总大小: ${(totalOriginalSize / (1024 * 1024)).toFixed(2)}MB`);
  console.log(`💾 压缩后大小: ${(totalNewSize / (1024 * 1024)).toFixed(2)}MB`);
  console.log(`🎯 节省空间: ${((totalOriginalSize - totalNewSize) / (1024 * 1024)).toFixed(2)}MB`);
  console.log(`📊 总压缩率: ${((totalOriginalSize - totalNewSize) / totalOriginalSize * 100).toFixed(1)}%`);
  console.log('');
  console.log(`📦 原文件备份到: ${CONFIG.backupPath}`);
  console.log('');
  console.log('🎉 全部完成！现在可以重新加载网站查看效果。');
}

// 运行脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { compressImage, CONFIG };