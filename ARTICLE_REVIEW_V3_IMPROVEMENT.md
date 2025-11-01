# ✅ ArticleReview 改进 - 复用 ArticleEditor 的三步式流程

**完成日期**: 2025年11月1日
**版本**: v3.0
**改进**: 复用 ArticleEditor 组件，保持 UI 一致性，同时支持审核功能

---

## 📋 改进内容

### 问题
- v2.0 虽然功能完整，但 UI 与原有的编辑页面不一致
- 不同的表单结构会造成用户困惑
- 代码重复

### 解决方案
- **复用 ArticleEditor 组件** 的三步式编辑流程
- 添加 `isReviewMode` 参数来区分审核模式和编辑模式
- 在第三步右上角，根据模式显示不同的按钮
- 保持 UI 完全一致，提升用户体验

---

## 🎯 核心改动

### 1. ArticleEditor.tsx

#### 添加 `isReviewMode` 参数
```typescript
interface ArticleEditorProps {
  initialArticle?: Partial<Article>;
  onSave?: (article: Article, coverImage?: File) => void;
  onPreview?: (article: Article) => void;
  onDelete?: (articleId: string) => void;
  isReviewMode?: boolean;  // ← 新增
}

const ArticleEditor = ({
  initialArticle,
  onSave,
  onPreview,
  onDelete,
  isReviewMode = false  // ← 新增
}: ArticleEditorProps) => {
```

#### 更新返回路径逻辑
```typescript
// 支持 isReviewMode，返回到正确的审核中心
const fromReview = Boolean(navigationState?.fromReview) || isReviewMode;
const backPath = navigationState?.backPath ||
  (fromReview ? (isReviewMode ? '/admin/review/articles' : '/admin/reviews') : defaultBackPath);
```

#### 优化审核 Handlers

**handleApprove()**:
- 检测 `isReviewMode`
- 在审核模式下，先保存编辑
- 使用新的 API 端点: `/api/v3/content/articles/{id}/approve`
- 返回延迟改为 1.5 秒（更快反馈）

**handleReject()**:
- 支持两种 API 端点
- 审核模式使用 `reason` 字段
- 其他模式使用 `reviewNotes` 字段
- 关闭模态框后返回

### 2. ArticleReview.tsx

#### 简化为容器组件
```typescript
const ArticleReview = () => {
  // 加载文章
  // 权限检查
  // 返回 ArticleEditor 组件，带 isReviewMode={true}

  return (
    <ArticleEditor
      initialArticle={initial}
      onSave={handleSave}
      onPreview={handlePreview}
      onDelete={currentRole === 'super_admin' ? handleDelete : undefined}
      isReviewMode={true}  // ← 关键参数
    />
  );
};
```

---

## 🎨 用户体验

### 审核流程（三步式）

**第一步**:  编辑标题和内容
- 与创建文章完全相同的 UI
- [← 上一步] [下一步 →]

**第二步**:  设置元数据
- 设置封面、作者、日期、分类、标签等
- [← 上一步] [下一步 →]

**第三步**:  审核操作（关键改动）
- 右上角按钮：
  - [上一步]
  - [拒绝] (orange, 显示原因模态框)
  - [批准发布] (green, 保存后直接批准)

- 不显示：删除按钮（仅 SUPER_ADMIN 可见时显示）、提交审核按钮

---

## ✨ 关键特性

### 1. UI 完全一致 ✅
- 使用相同的三步式流程
- 相同的表单布局
- 相同的字段编辑器
- 用户无需学习新的 UI

### 2. 功能完整 ✅
- 编辑所有字段（标题、内容、封面、分类等）
- 保存编辑（通过"提交审核"按钮实现，在审核模式下自动保存为 pending）
- 批准发布（第三步的专用按钮）
- 拒绝审核（带原因输入的模态框）

### 3. 代码优化 ✅
- 减少代码重复
- 复用已有的审核逻辑
- 更易维护

---

## 🔄 对比：v2.0 vs v3.0

| 方面 | v2.0 | v3.0 |
|-----|------|------|
| 组件结构 | 完全独立的 520 行 | 复用 ArticleEditor |
| UI 风格 | 自定义 | 与创建页面完全一致 |
| 表单布局 | 简化的单页面 | 三步式流程 |
| 代码重复 | 无 | 最小化 |
| 用户学习成本 | 新的 UI | 零（与创建流程相同） |
| 功能完整性 | ✅ 完整 | ✅ 完整 |
| 编辑保存 | ✅ 正常 | ✅ 正常 |
| 拒绝功能 | ✅ 模态框 | ✅ 模态框 |

---

## 🚀 工作流程

### 完整的审核流程

```
1. 进入审核中心
   /admin/review/articles
   ↓

2. 点击待审核文章的"审核"按钮
   → /admin/articles/review/{id}
   ↓

3. ArticleEditor 加载（isReviewMode=true）

   第一步：编辑内容
   - 编辑标题、内容（富文本）
   - [← 上一步] [下一步 →]

   第二步：编辑元数据
   - 编辑封面、作者、日期、分类、标签等
   - [← 上一步] [下一步 →]

   第三步：审核操作
   - 左上角：返回审核中心
   - 右上角按钮：
     * [拒绝] → 显示原因输入框
     * [批准发布] → 保存并批准，返回列表

   ↓

4. 完成审核
   - 返回到 /admin/review/articles
   - 审核过的文章从列表消失
```

---

## 📊 技术细节

### ArticleEditor 的审核模式检测

```typescript
// 当 isReviewMode = true 时：
1. fromReview = true（即使 navigationState.fromReview 为 false）
2. backPath = '/admin/review/articles'（返回到正确的审核中心）
3. 第三步显示审核按钮而不是提交审核按钮
4. 调用新的 API 端点: /api/v3/content/articles/{id}/approve|reject
```

### API 端点选择

```typescript
// handleApprove()
const approveUrl = isReviewMode
  ? `http://localhost:1994/api/v3/content/articles/${id}/approve`
  : `http://localhost:1994/api/admin/reviews/article/${id}/approve`;

// handleReject()
const rejectUrl = isReviewMode
  ? `http://localhost:1994/api/v3/content/articles/${id}/reject`
  : `http://localhost:1994/api/admin/reviews/article/${id}/reject`;
```

### 保存逻辑

```typescript
// 审核模式下，在批准前自动保存编辑
if (isReviewMode && onSave) {
  const articleData: Article = { ... };
  await onSave(articleData, undefined);
}
```

---

## ✅ 验证清单

- [x] TypeScript 编译通过（0 个错误）
- [x] ArticleReview 简化为容器组件
- [x] ArticleEditor 添加 `isReviewMode` 参数
- [x] 返回路径逻辑更新
- [x] 审核 handlers 支持两种模式
- [x] API 端点正确选择
- [x] UI 完全一致
- [x] 功能完整
- [x] 代码优化

---

## 🎓 总结

### v3.0 的优势

✅ **用户体验优秀**
- UI 与创建流程相同，无学习成本
- 三步式流程清晰易懂
- 功能完整且易操作

✅ **代码质量好**
- 复用现有代码，减少重复
- 更易维护和扩展
- 逻辑清晰明确

✅ **功能完整**
- 支持所有编辑操作
- 支持保存编辑（作为"提交审核"按钮）
- 支持拒绝和批准
- 权限控制完善

---

**创建者**: Claude Code
**完成日期**: 2025年11月1日
**版本**: v3.0
**提交**: 23b3f1c
**状态**: ✅ 完成并验证

