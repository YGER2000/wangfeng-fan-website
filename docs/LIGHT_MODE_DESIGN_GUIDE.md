# 浅色模式设计指南

## 🎨 后台管理系统浅色模式配色规范

### ⚠️ 重要原则

**顶部导航栏始终深色，其他区域跟随主题切换**：
- 顶部导航栏/头部区域始终保持深色（黑色背景 + 紫色元素），确保品牌识别度和视觉一致性
- 侧边栏、主内容区等其他界面元素根据用户选择的主题自动切换
- 浅色模式下使用白色/浅灰色背景，深色模式下使用黑色/紫色背景
- 这种设计兼顾了品牌识别度和用户体验

### 基础配色

#### 背景层次
- **页面背景**: `bg-white` - 纯白色
- **卡片/模块背景**: `bg-gray-50` 或 `bg-white` - 浅灰或白色
- **表头/区块标题背景**: `bg-gray-100` - 稍深的灰色
- **输入框背景**: `bg-white` - 白色
- **禁用状态背景**: `bg-gray-100`

#### 边框
- **主边框**: `border-gray-200` - 浅灰色边框
- **分割线**: `divide-gray-200` - 浅灰色分割线
- **输入框边框**: `border-gray-300` - 中等灰色边框
- **焦点边框**: `border-wangfeng-purple` - 紫色高亮边框

#### 文字颜色
- **标题/主文字**: `text-gray-900` - 深灰色（接近黑色）
- **正文**: `text-gray-700` - 中深灰色
- **次要信息**: `text-gray-600` - 中灰色
- **辅助说明**: `text-gray-500` - 浅灰色
- **占位符**: `text-gray-400` - 很浅的灰色
- **禁用文字**: `text-gray-400`

#### 交互状态
- **Hover 背景**: `hover:bg-gray-100` - 浅灰色悬停
- **Active 背景**: `active:bg-gray-200` - 稍深的激活态
- **选中行**: `bg-gray-100` - 浅灰色高亮

#### 按钮
- **主按钮**: `bg-wangfeng-purple text-white hover:bg-wangfeng-dark`
- **次要按钮**: `bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300`
- **危险按钮**: `bg-red-500 text-white hover:bg-red-600`

---

## 📋 标准组件模板

### 1. 卡片容器
```tsx
<div className={cn(
  "rounded-xl border transition-all",
  isLight
    ? "bg-white border-gray-200"
    : "bg-black/60 border-wangfeng-purple/40"
)}>
```

### 2. 表格
```tsx
// 表格容器
<div className={cn(
  "overflow-hidden border rounded-xl",
  isLight
    ? "bg-gray-50 border-gray-200"
    : "bg-black/40 border-wangfeng-purple/30"
)}>

// 表头
<thead className={cn(
  "border-b sticky top-0",
  isLight
    ? "bg-gray-100 border-gray-300"
    : "bg-black/40 border-wangfeng-purple/30"
)}>

// 表头文字
<th className={cn(
  "px-6 py-4 text-left text-sm font-medium",
  isLight ? "text-gray-700" : "text-gray-300"
)}>

// 表格行
<tbody className={cn(
  "divide-y",
  isLight ? "divide-gray-200" : "divide-wangfeng-purple/20"
)}>

// 行悬停效果
<tr className={cn(
  "transition-colors",
  isLight
    ? "hover:bg-gray-100"
    : "hover:bg-wangfeng-purple/10"
)}>

// 单元格文字
<td className={cn(
  "px-6 py-4",
  isLight ? "text-gray-700" : "text-gray-300"
)}>
```

### 3. 表单输入框
```tsx
<input className={cn(
  "w-full px-4 py-2 rounded-lg border transition-all",
  isLight
    ? "bg-white border-gray-300 text-gray-900 focus:border-wangfeng-purple"
    : "bg-black/30 border-wangfeng-purple/30 text-white focus:border-wangfeng-purple"
)} />
```

### 4. 下拉选择框
```tsx
<select className={cn(
  "w-full px-4 py-2 rounded-lg border transition-all",
  isLight
    ? "bg-white border-gray-300 text-gray-900"
    : "bg-black/30 border-wangfeng-purple/30 text-white"
)} />
```

### 5. 文本域
```tsx
<textarea className={cn(
  "w-full px-4 py-2 rounded-lg border transition-all",
  isLight
    ? "bg-white border-gray-300 text-gray-900 focus:border-wangfeng-purple"
    : "bg-black/30 border-wangfeng-purple/30 text-white focus:border-wangfeng-purple"
)} />
```

### 6. 标签文字
```tsx
<label className={cn(
  "block text-sm font-medium mb-2",
  isLight ? "text-gray-700" : "text-wangfeng-purple"
)} />
```

### 7. 占位符/辅助文字
```tsx
<p className={cn(
  "text-sm mt-1",
  isLight ? "text-gray-500" : "text-gray-400"
)} />
```

---

## 🔧 使用方法

### 1. 导入必要的依赖
```tsx
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
```

### 2. 获取主题状态
```tsx
const { theme } = useTheme();
const isLight = theme === 'white';
```

### 3. 应用条件样式
使用 `cn()` 函数配合三元运算符应用不同的样式类。

---

## ✅ 检查清单

在实现浅色模式时，确保以下元素都已适配：

- [ ] 页面主容器背景
- [ ] 卡片/模块背景
- [ ] 表格容器、表头、单元格
- [ ] 所有边框和分割线
- [ ] 标题、正文、辅助文字
- [ ] 输入框、下拉框、文本域
- [ ] 按钮（主按钮、次要按钮）
- [ ] Hover/Active 状态
- [ ] 标签文字
- [ ] 占位符文字
- [ ] 图标颜色

---

## 📌 注意事项

1. **保持一致性**: 所有后台页面必须使用相同的配色方案
2. **可读性优先**: 浅色模式下文字必须清晰可读，避免对比度过低
3. **紫色高亮**: 重要数据、链接、主按钮继续使用紫色 (`wangfeng-purple`)
4. **主题响应**: 所有界面元素都应该根据 `theme` 状态自动切换样式
5. **测试**: 每次修改后切换主题测试两种模式的显示效果

## 🔄 实现状态

### 布局说明
项目中有两个后台管理布局：
- **NewAdminLayout** (`/admin/*`): 当前使用的主后台布局，包含现代化的侧边栏导航
- **AdminLayout** (`/admin-old/*`): 旧版后台布局，保留用于兼容性

### 已完成
- ✅ **NewAdminLayout**:
  - 顶部导航栏始终保持深色（黑色背景 + 紫色元素）
  - 侧边栏支持浅色/深色模式切换
  - 主内容区支持浅色/深色模式切换
- ✅ **AdminLayout**:
  - 顶部搜索栏始终保持深色
  - 侧边栏支持浅色/深色模式切换
  - 背景支持浅色/深色模式切换
- ✅ 顶部导航栏/头部区域始终保持深色，确保品牌识别度和视觉一致性

### 主题切换规则

#### 始终深色的元素
- **NewAdminLayout 顶部导航栏**: `bg-black/90` + `border-wangfeng-purple/30`
- **AdminLayout 头部搜索区**: `bg-black/50` + `border-wangfeng-purple/30`

#### 响应主题切换的元素
- 浅色模式 (`theme === 'white'`):
  - 背景: `bg-white` 或 `bg-gray-50`
  - 边框: `border-gray-200` 或 `border-gray-300`
  - 文字: `text-gray-700` 到 `text-gray-900`
  - 悬停: `hover:bg-gray-100`
- 深色模式 (默认):
  - 背景: `bg-black/60` 或 `bg-black/50`
  - 边框: `border-wangfeng-purple/30` 或 `border-wangfeng-purple/40`
  - 文字: `text-gray-300` 到 `text-wangfeng-light`
  - 悬停: `hover:bg-wangfeng-purple/10`

---

## 🎯 参考示例

- **Dashboard**: `/admin/dashboard` - 标准卡片样式
- **ArticleList**: `/admin/articles/list` - 表格样式
