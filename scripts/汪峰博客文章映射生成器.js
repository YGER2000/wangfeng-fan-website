#!/usr/bin/env node

/**
 * 汪峰博客文章映射生成器
 * 
 * 这个脚本会扫描 public/content/峰言峰语/汪峰博客 目录下的所有 .md 文件，
 * 生成文章映射数据，以便前端页面正确展示博客内容。
 * 
 * 使用方法：
 * node scripts/汪峰博客文章映射生成器.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置路径
const BLOG_DIR = path.join(__dirname, '../public/content/峰言峰语/汪峰博客');
const OUTPUT_FILE = path.join(__dirname, '../public/data/feng-yan-feng-yu-articles.json');

/**
 * 解析文件名获取文章信息
 * 文件名格式：YYYY-MM-DD HH:MM 标题.md
 */
function parseFilename(filename) {
  // 移除扩展名
  const nameWithoutExt = filename.replace('.md', '');
  
  // 使用正则表达式匹配日期、时间和标题
  const match = nameWithoutExt.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2})\s+(.+)$/);
  
  if (match) {
    const [, date, time, title] = match;
    return {
      date,
      time,
      title: title.trim(),
      fullDatetime: `${date} ${time}`
    };
  }
  
  // 如果无法解析，返回默认值
  console.warn(`无法解析文件名: ${filename}`);
  return {
    date: '',
    time: '',
    title: nameWithoutExt,
    fullDatetime: ''
  };
}

/**
 * 读取并解析 Markdown 文件
 */
function parseMarkdownFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // 解析标题（第一行的 # 标题）
    const lines = content.split('\n');
    let title = '';
    let publishTime = '';
    let originalUrl = '';
    let bodyContent = '';
    
    let inFrontMatter = false;
    let bodyStart = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 提取标题
      if (line.startsWith('# ') && !title) {
        title = line.substring(2).trim();
        continue;
      }
      
      // 提取发布时间
      if (line.startsWith('**发布时间**:')) {
        publishTime = line.replace('**发布时间**:', '').trim();
        continue;
      }
      
      // 提取原文链接
      if (line.startsWith('**原文链接**:')) {
        originalUrl = line.replace('**原文链接**:', '').trim();
        continue;
      }
      
      // 找到分隔线后开始提取正文
      if (line === '---' && !bodyStart) {
        bodyStart = true;
        continue;
      }
      
      // 提取正文内容
      if (bodyStart && line) {
        bodyContent += line + '\n';
      }
    }
    
    // 生成摘要（取正文前150个字符）
    const excerpt = bodyContent.trim().substring(0, 150) + (bodyContent.length > 150 ? '...' : '');
    
    return {
      title,
      publishTime,
      originalUrl,
      content: bodyContent.trim(),
      excerpt
    };
  } catch (error) {
    console.error(`读取文件失败: ${filePath}`, error);
    return null;
  }
}

/**
 * 生成文章ID
 */
function generateId(title, date) {
  return `${date}-${title}`.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-').toLowerCase();
}

/**
 * 生成文章slug
 */
function generateSlug(title, date) {
  const cleanTitle = title
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fa5-]/g, '')
    .replace(/\s+/g, '-');
  return `${date}-${cleanTitle}`;
}

/**
 * 扫描博客目录并生成文章映射
 */
function generateArticleMapping() {
  console.log('开始扫描汪峰博客目录...');
  
  // 检查目录是否存在
  if (!fs.existsSync(BLOG_DIR)) {
    console.error(`错误: 博客目录不存在 ${BLOG_DIR}`);
    process.exit(1);
  }
  
  // 读取目录中的所有文件
  const files = fs.readdirSync(BLOG_DIR);
  const mdFiles = files.filter(file => file.endsWith('.md') && !file.startsWith('.'));
  
  console.log(`找到 ${mdFiles.length} 个博客文章文件`);
  
  const articles = [];
  let successCount = 0;
  let errorCount = 0;
  
  mdFiles.forEach((filename, index) => {
    console.log(`处理文件 ${index + 1}/${mdFiles.length}: ${filename}`);
    
    const filePath = path.join(BLOG_DIR, filename);
    const fileInfo = parseFilename(filename);
    const articleData = parseMarkdownFile(filePath);
    
    if (articleData) {
      const article = {
        id: generateId(articleData.title || fileInfo.title, fileInfo.date),
        title: articleData.title || fileInfo.title,
        date: fileInfo.date || articleData.publishTime,
        time: fileInfo.time,
        fullDatetime: fileInfo.fullDatetime,
        author: '汪峰',
        category: '汪峰博客',
        subcategory: 'blog',
        tags: ['博客', '个人感悟'],
        excerpt: articleData.excerpt,
        content: articleData.content,
        slug: generateSlug(articleData.title || fileInfo.title, fileInfo.date),
        featured: false,
        source: '新浪博客',
        originalUrl: articleData.originalUrl,
        filePath: `/content/峰言峰语/汪峰博客/${filename}`,
        year: fileInfo.date ? fileInfo.date.split('-')[0] : '',
        // 添加一些统计信息
        wordCount: articleData.content.length,
        readingTime: Math.ceil(articleData.content.length / 400) // 假设阅读速度为每分钟400字
      };
      
      articles.push(article);
      successCount++;
    } else {
      console.error(`处理文件失败: ${filename}`);
      errorCount++;
    }
  });
  
  // 按日期排序（最新的在前）
  articles.sort((a, b) => {
    const dateA = new Date(a.fullDatetime || a.date);
    const dateB = new Date(b.fullDatetime || b.date);
    return dateB.getTime() - dateA.getTime();
  });
  
  // 确保输出目录存在
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // 生成最终的映射数据
  const mappingData = {
    metadata: {
      category: '峰言峰语',
      subcategory: '汪峰博客',
      description: '汪峰个人博客文章合集，记录音乐路上的思考与感悟',
      totalArticles: articles.length,
      dateRange: {
        earliest: articles[articles.length - 1]?.date || '',
        latest: articles[0]?.date || ''
      },
      generatedAt: new Date().toISOString(),
      version: '1.0'
    },
    statistics: {
      totalProcessed: mdFiles.length,
      successCount,
      errorCount,
      yearsSpanned: [...new Set(articles.map(a => a.year))].filter(Boolean),
      totalWords: articles.reduce((sum, article) => sum + article.wordCount, 0)
    },
    articles
  };
  
  // 写入JSON文件
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(mappingData, null, 2), 'utf-8');
  
  console.log('\n映射生成完成！');
  console.log(`成功处理: ${successCount} 篇文章`);
  console.log(`处理失败: ${errorCount} 篇文章`);
  console.log(`输出文件: ${OUTPUT_FILE}`);
  console.log(`时间跨度: ${mappingData.metadata.dateRange.earliest} 至 ${mappingData.metadata.dateRange.latest}`);
  console.log(`总字数: ${mappingData.statistics.totalWords} 字`);
  
  return mappingData;
}

// 主函数
function main() {
  try {
    console.log('汪峰博客文章映射生成器启动...\n');
    
    const result = generateArticleMapping();
    
    console.log('\n生成的文章列表（前10篇）：');
    result.articles.slice(0, 10).forEach((article, index) => {
      console.log(`${index + 1}. ${article.date} ${article.time || ''} - ${article.title}`);
    });
    
    if (result.articles.length > 10) {
      console.log(`... 还有 ${result.articles.length - 10} 篇文章`);
    }
    
    console.log('\n🎉 文章映射生成完成！现在可以在前端页面查看汪峰的博客文章了。');
    
  } catch (error) {
    console.error('生成映射时发生错误:', error);
    process.exit(1);
  }
}

// 直接执行主函数
main();

export {
  generateArticleMapping,
  parseFilename,
  parseMarkdownFile
};