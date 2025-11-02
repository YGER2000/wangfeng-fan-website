# 文章草稿保存功能 - 核心bug修复

## 🔴 问题诊断

用户报告：**保存为草稿实际上是提交审核**

### 根本原因

在 `ArticleCreate.tsx` 中，`handleSave` 函数定义了第三个参数 `isDraft`：

```typescript
const handleSave = async (article: Article, coverImage?: File, isDraft: boolean = false) => {
  // ...
  review_status: isDraft ? 'draft' : 'pending',
```

但是在 `ArticleEditor.tsx` 中调用 `onSave` 时，**没有传递这个参数**：

```typescript
// ❌ 错误 - 只传递了2个参数
await onSave(fullArticle, coverImageFile || undefined);

// ✅ 正确 - 应该传递3个参数
await onSave(fullArticle, coverImageFile || undefined, isDraft);
```

---

## 🔧 修复方案

### 修复1: handleSaveDraft 函数

**文件**: `frontend/src/components/ui/ArticleEditor.tsx`
**行号**: 565
**修改前**:
```typescript
await onSave(fullArticle, coverImageFile || undefined);
```

**修改后**:
```typescript
await onSave(fullArticle, coverImageFile || undefined, true);
```

---

### 修复2: handlePublish 函数

**文件**: `frontend/src/components/ui/ArticleEditor.tsx`
**行号**: 516
**修改前**:
```typescript
await onSave(fullArticle, coverImageFile || undefined);
```

**修改后**:
```typescript
await onSave(fullArticle, coverImageFile || undefined, false);
```

---

## 📊 修复覆盖

| 组件 | 函数 | isDraft参数 | 状态 |
|------|------|-----------|------|
| ArticleEditor | handleSaveDraft | true ✅ | 固定 |
| ArticleEditor | handlePublish | false ✅ | 固定 |
| VideoCreate | handleSaveDraft | 'draft' ✅ | 已正确 |
| VideoCreate | handleSubmit | 'pending' ✅ | 已正确 |
| GalleryEditor | handleSaveDraft | 'draft' ✅ | 已正确 |

---

## ✅ 修复后流程

```
用户创建文章
  ↓
点击"暂存草稿"
  ↓
ArticleEditor.handleSaveDraft()
  ↓
onSave(article, coverImage, true)  ← isDraft = true
  ↓
ArticleCreate.handleSave(article, coverImage, isDraft=true)
  ↓
review_status: isDraft ? 'draft' : 'pending'
  ↓
review_status = 'draft' ✅
  ↓
保存到数据库
  ↓
返回列表，显示"草稿"状态
```

---

## 🧪 验证步骤

1. **刷新浏览器**（前端代码已更新）
2. **创建新文章**
3. **点击"暂存草稿"按钮**
4. **检查浏览器控制台日志**
   - 应该看到: `文章已保存为草稿: {...}`
   - 应该有: `review_status: "draft"`
5. **查看"我的文章"列表**
   - ✅ 应该显示"草稿"状态（灰色）
   - ❌ 不应该显示"待审核"状态

---

## 🔍 为什么会出现这个bug?

1. **默认参数为false**: `isDraft: boolean = false`
   - 如果不传递第三个参数，默认为 `false`
   - 导致 `review_status = 'pending'` 而不是 `'draft'`

2. **两个函数都没有传递参数**
   - handleSaveDraft 应该传 `true`
   - handlePublish 应该传 `false`

3. **缺少参数验证**
   - 即使有错误也不容易发现

---

## 📝 关键代码片段

### ArticleCreate.tsx - handleSave 函数

```typescript
const handleSave = async (article: Article, coverImage?: File, isDraft: boolean = false) => {
  try {
    // ... 上传封面逻辑 ...

    const articleData = {
      title: article.title,
      content: article.content,
      excerpt: article.excerpt,
      author: article.author,
      category_primary: article.category_primary,
      category_secondary: article.category_secondary,
      tags: article.tags || [],
      cover_url: coverUrl,
      // ✅ 根据isDraft参数设置review_status
      review_status: isDraft ? 'draft' : 'pending',
      is_published: false,
    };

    const savedArticle = await articleAPI.create(articleData, token);
    console.log(isDraft ? '文章已保存为草稿:' : '文章已提交审核:', savedArticle);
  } catch (error) {
    console.error('提交文章失败:', error);
    throw error;
  }
};
```

### ArticleEditor.tsx - 修复后的调用

```typescript
// handleSaveDraft
await onSave(fullArticle, coverImageFile || undefined, true);

// handlePublish
await onSave(fullArticle, coverImageFile || undefined, false);
```

---

## 🚀 部署检查列表

- [x] ArticleEditor.handleSaveDraft 传递 true
- [x] ArticleEditor.handlePublish 传递 false
- [ ] 前端开发服务器重新加载代码
- [ ] 测试创建文章并保存为草稿
- [ ] 验证数据库中 review_status = 'draft'
- [ ] 检查列表显示正确的"草稿"状态

---

## 💡 总结

**问题**: 保存为草稿被当作提交审核
**原因**: 没有传递 `isDraft` 参数，默认为 false
**解决**: 在 ArticleEditor 的两个 onSave 调用中传递正确的 isDraft 值
**状态**: ✅ 已修复

---

**修复日期**: 2025年11月2日
**修复范围**: ArticleCreate / ArticleEditor
**受影响用户**: 创建文章的用户

