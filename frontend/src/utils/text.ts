/**
 * 文本处理工具函数
 */

/**
 * 移除HTML标签，保留纯文本内容
 * @param html HTML字符串
 * @returns 纯文本内容
 */
export function stripHtmlTags(html: string): string {
  if (!html) return '';
  // 移除所有HTML标签
  return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * 生成文章摘要：移除HTML标签后取前N个字符
 * @param content 富文本内容
 * @param length 截取长度，默认150字符
 * @returns 处理后的摘要
 */
export function generateExcerpt(content: string, length: number = 150): string {
  if (!content) return '';

  // 先移除HTML标签
  const plainText = stripHtmlTags(content);

  // 如果纯文本长度大于指定长度，截取并添加省略号
  if (plainText.length > length) {
    return plainText.substring(0, length) + '...';
  }

  return plainText;
}

/**
 * 截取字符串，保留指定长度的纯文本（用于显示预览）
 * @param text 文本内容
 * @param length 截取长度
 * @returns 截取后的文本
 */
export function truncate(text: string, length: number = 100): string {
  if (!text) return '';

  const plain = stripHtmlTags(text);

  if (plain.length > length) {
    return plain.substring(0, length) + '...';
  }

  return plain;
}
