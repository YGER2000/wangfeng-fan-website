import { useMemo, useRef, useEffect, useState } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { buildApiUrl } from '@/config/api';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: number | string;
  articleId?: string;         // 文章 ID（可选，新建文章时为空）
  categoryPrimary?: string;   // 一级分类（用于生成 OSS 路径）
}

/**
 * 基于 Quill 的富文本编辑器
 * 完全所见即所得，像 Word 一样简单易用
 * 支持上传图片到阿里云 OSS，使用可读性命名
 */
const RichTextEditor = ({ value, onChange, height, articleId, categoryPrimary }: RichTextEditorProps) => {
  const quillRef = useRef<ReactQuill>(null);
  const [imageSequence, setImageSequence] = useState(1); // 图片序号计数器

  // 上传图片到服务器（新端点 - 支持 OSS 可读性命名）
  const uploadImageToServer = async (file: File): Promise<string> => {
    // 如果没有 articleId 或 categoryPrimary，回退到旧的上传接口
    if (!articleId || !categoryPrimary) {
      console.warn('⚠️ 缺少 articleId 或 categoryPrimary，使用旧的上传端点');
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(buildApiUrl('/upload/image'), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '上传失败');
      }

      const data = await response.json();
      return data.url;
    }

    // 使用新的文章配图上传端点
    const formData = new FormData();
    formData.append('file', file);
    formData.append('article_id', articleId);
    formData.append('category_primary', categoryPrimary);
    formData.append('sequence', String(imageSequence));

    const token = localStorage.getItem('token');
    const response = await fetch(buildApiUrl('/articles/upload/image'), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '上传失败');
    }

    const data = await response.json();

    // 自动递增序号
    setImageSequence(prev => prev + 1);

    // 返回 medium 尺寸的 URL（适合网页显示）
    return data.medium_url || data.file_url;
  };

  // 图片上传处理器
  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      // 检查文件大小（限制为 20MB）
      if (file.size > 20 * 1024 * 1024) {
        alert('图片大小不能超过 20MB');
        return;
      }

      try {
        const quill = quillRef.current?.getEditor();
        if (!quill) return;

        const range = quill.getSelection(true);

        // 插入一个临时占位符
        quill.insertText(range.index, '上传中...', { color: '#8B5CF6' });
        quill.setSelection(range.index + 6, 0);

        // 上传图片到服务器
        const imageUrl = await uploadImageToServer(file);

        // 删除占位符
        quill.deleteText(range.index, 6);

        // 插入图片
        quill.insertEmbed(range.index, 'image', imageUrl);
        quill.setSelection(range.index + 1, 0);

      } catch (error) {
        console.error('图片上传失败:', error);
        alert(`图片上传失败: ${error instanceof Error ? error.message : '未知错误'}`);

        // 删除占位符
        const quill = quillRef.current?.getEditor();
        if (quill) {
          const range = quill.getSelection(true);
          quill.deleteText(range.index - 6, 6);
        }
      }
    };
  };

  // 工具栏配置
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        // 标题
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

        // 字体大小
        [{ 'size': ['small', false, 'large', 'huge'] }],

        // 文本样式
        ['bold', 'italic', 'underline', 'strike'],

        // 文字颜色和背景色
        [{ 'color': [] }, { 'background': [] }],

        // 列表
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],

        // 缩进
        [{ 'indent': '-1'}, { 'indent': '+1' }],

        // 对齐方式
        [{ 'align': [] }],

        // 引用和代码块
        ['blockquote', 'code-block'],

        // 链接和图片
        ['link', 'image'],

        // 清除格式
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    },
    clipboard: {
      matchVisual: false // 粘贴时保持格式
    }
  }), []);

  // 支持的格式
  const formats = [
    'header',
    'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet', 'indent',
    'align',
    'blockquote', 'code-block',
    'link', 'image'
  ];

  useEffect(() => {
    const editorInstance = quillRef.current?.getEditor();
    if (!editorInstance) return;
    const toolbarModule = editorInstance.getModule('toolbar') as { container?: HTMLElement } | undefined;
    const toolbar = toolbarModule?.container;
    if (!toolbar) return;

    const baseTips: Record<string, string> = {
      'ql-header': '标题级别',
      'ql-size': '字号',
      'ql-bold': '加粗',
      'ql-italic': '斜体',
      'ql-underline': '下划线',
      'ql-strike': '删除线',
      'ql-color': '文字颜色',
      'ql-background': '背景颜色',
      'ql-align': '对齐方式',
      'ql-blockquote': '引用',
      'ql-code-block': '代码块',
      'ql-link': '插入链接',
      'ql-image': '插入图片',
      'ql-clean': '清除格式'
    };

    const applyTooltip = (element: HTMLElement) => {
      let tooltip = '';

      const classList = Array.from(element.classList);
      for (const cls of classList) {
        if (baseTips[cls]) {
          tooltip = baseTips[cls];
          break;
        }
      }

      if (!tooltip && element.classList.contains('ql-list')) {
        const value = (element as HTMLButtonElement).value || element.getAttribute('value');
        tooltip = value === 'ordered' ? '有序列表' : '无序列表';
      }

      if (!tooltip && element.classList.contains('ql-indent')) {
        const value = (element as HTMLButtonElement).value || element.getAttribute('value');
        tooltip = value === '+1' ? '增加缩进' : '减少缩进';
      }

      if (!tooltip && element.classList.contains('ql-toolbar')) {
        tooltip = '';
      }

      if (tooltip) {
        element.setAttribute('title', tooltip);
      }
    };

    toolbar.querySelectorAll('button, select').forEach((item) => {
      applyTooltip(item as HTMLElement);
    });

    toolbar.querySelectorAll('.ql-picker').forEach((picker) => {
      const pickerEl = picker as HTMLElement;
      const label = pickerEl.querySelector('.ql-picker-label') as HTMLElement | null;
      if (!label) return;

      let tooltip = '';
      const classList = Array.from(pickerEl.classList);
      for (const cls of classList) {
        if (baseTips[cls]) {
          tooltip = baseTips[cls];
          break;
        }
      }

      if (!tooltip && pickerEl.classList.contains('ql-color')) {
        tooltip = '文字颜色';
      }

      if (!tooltip && pickerEl.classList.contains('ql-background')) {
        tooltip = '背景颜色';
      }

      if (tooltip) {
        label.setAttribute('title', tooltip);
      }
    });
  }, []);

  const resolvedHeight = useMemo(() => {
    if (height === undefined) {
      return '40vh';
    }
    return typeof height === 'number' ? `${height}px` : height;
  }, [height]);

  return (
    <div
      className="rich-text-editor-wrapper h-full"
      style={{ height: resolvedHeight }}
    >
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder="开始输入你的内容... 就像使用 Word 一样简单"
        style={{ height: '100%' }}
      />

      <style>{`
        /* 编辑器容器 */
        .rich-text-editor-wrapper {
          display: flex;
          flex-direction: column;
        }

        .rich-text-editor-wrapper .quill {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        /* 工具栏样式 - 汪峰紫主题 */
        .rich-text-editor-wrapper .ql-toolbar {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%) !important;
          border: 1px solid rgba(139, 92, 246, 0.2) !important;
          border-radius: 8px 8px 0 0 !important;
          padding: 12px !important;
          flex-shrink: 0;
        }

        .rich-text-editor-wrapper .ql-toolbar.ql-snow {
          border-bottom: 2px solid rgba(139, 92, 246, 0.3) !important;
        }

        /* 工具栏按钮 */
        .rich-text-editor-wrapper .ql-toolbar button {
          transition: all 0.2s ease !important;
          border-radius: 4px !important;
        }

        .rich-text-editor-wrapper .ql-toolbar button:hover {
          background: rgba(139, 92, 246, 0.1) !important;
        }

        .rich-text-editor-wrapper .ql-toolbar button.ql-active {
          background: rgba(139, 92, 246, 0.15) !important;
        }

        .rich-text-editor-wrapper .ql-toolbar .ql-stroke {
          stroke: #8B5CF6 !important;
        }

        .rich-text-editor-wrapper .ql-toolbar .ql-fill {
          fill: #8B5CF6 !important;
        }

        .rich-text-editor-wrapper .ql-toolbar button:hover .ql-stroke {
          stroke: #7C3AED !important;
        }

        .rich-text-editor-wrapper .ql-toolbar button:hover .ql-fill {
          fill: #7C3AED !important;
        }

        .rich-text-editor-wrapper .ql-toolbar button.ql-active .ql-stroke {
          stroke: #7C3AED !important;
        }

        .rich-text-editor-wrapper .ql-toolbar button.ql-active .ql-fill {
          fill: #7C3AED !important;
        }

        /* 下拉选择器 */
        .rich-text-editor-wrapper .ql-toolbar select,
        .rich-text-editor-wrapper .ql-toolbar .ql-picker {
          border: 1px solid rgba(139, 92, 246, 0.2) !important;
          border-radius: 4px !important;
          transition: all 0.2s ease !important;
        }

        .rich-text-editor-wrapper .ql-toolbar select:hover,
        .rich-text-editor-wrapper .ql-toolbar .ql-picker:hover {
          border-color: rgba(139, 92, 246, 0.4) !important;
          background: rgba(139, 92, 246, 0.05) !important;
        }

        .rich-text-editor-wrapper .ql-picker-label {
          color: #8B5CF6 !important;
        }

        .rich-text-editor-wrapper .ql-picker-options {
          background: white !important;
          border: 1px solid rgba(139, 92, 246, 0.3) !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15) !important;
        }

        .rich-text-editor-wrapper .ql-picker-item:hover {
          background: rgba(139, 92, 246, 0.1) !important;
          color: #7C3AED !important;
        }

        /* 编辑区域 */
        .rich-text-editor-wrapper .ql-container {
          border: none !important;
          flex: 1;
          overflow-y: auto;
          background: transparent;
        }

        .rich-text-editor-wrapper .ql-editor {
          padding: 32px 48px !important;
          font-size: 16px !important;
          line-height: 1.8 !important;
          color: #374151;
          min-height: 100%;
        }

        .rich-text-editor-wrapper .ql-editor * {
          color: inherit;
        }

        .rich-text-editor-wrapper .ql-editor.ql-blank::before {
          color: #9CA3AF;
          font-style: italic;
          left: 48px;
        }

        /* 编辑区域内容样式 */
        .rich-text-editor-wrapper .ql-editor h1 {
          font-size: 2em;
          font-weight: 700;
          margin: 1em 0 0.5em;
          color: #111827;
        }

        .rich-text-editor-wrapper .ql-editor h2 {
          font-size: 1.5em;
          font-weight: 600;
          margin: 0.83em 0 0.5em;
          color: #111827;
        }

        .rich-text-editor-wrapper .ql-editor h3 {
          font-size: 1.17em;
          font-weight: 600;
          margin: 1em 0 0.5em;
          color: #1F2937;
        }

        .rich-text-editor-wrapper .ql-editor p {
          margin-bottom: 1em;
        }

        .rich-text-editor-wrapper .ql-editor blockquote {
          border-left: 4px solid #8B5CF6;
          padding-left: 16px;
          margin: 1em 0;
          color: #6B7280;
          font-style: italic;
        }

        .rich-text-editor-wrapper .ql-editor code {
          background: rgba(139, 92, 246, 0.1);
          color: #7C3AED;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        }

        .rich-text-editor-wrapper .ql-editor pre {
          background: #1F2937;
          color: #E5E7EB;
          padding: 16px;
          border-radius: 8px;
          overflow-x: auto;
        }

        .rich-text-editor-wrapper .ql-editor a {
          color: #8B5CF6;
          text-decoration: underline;
        }

        .rich-text-editor-wrapper .ql-editor a:hover {
          color: #7C3AED;
        }

        .rich-text-editor-wrapper .ql-editor img {
          max-width: 50%;
          height: auto;
          border-radius: 8px;
          margin: 1em auto;
          display: block;
        }

        .rich-text-editor-wrapper .ql-editor ul,
        .rich-text-editor-wrapper .ql-editor ol {
          padding-left: 1.5em;
          margin: 1em 0;
        }

        /* 深色模式 */
        :is(.dark, html.starry-fantasy, body.starry-fantasy) .rich-text-editor-wrapper .ql-toolbar {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%) !important;
          border-color: rgba(139, 92, 246, 0.3) !important;
        }

        :is(.dark, html.starry-fantasy, body.starry-fantasy) .rich-text-editor-wrapper .ql-toolbar.ql-snow {
          border-bottom-color: rgba(139, 92, 246, 0.4) !important;
        }

        :is(.dark, html.starry-fantasy, body.starry-fantasy) .rich-text-editor-wrapper .ql-toolbar .ql-stroke {
          stroke: #A78BFA !important;
        }

        :is(.dark, html.starry-fantasy, body.starry-fantasy) .rich-text-editor-wrapper .ql-toolbar .ql-fill {
          fill: #A78BFA !important;
        }

        :is(.dark, html.starry-fantasy, body.starry-fantasy) .rich-text-editor-wrapper .ql-toolbar button:hover .ql-stroke {
          stroke: #C4B5FD !important;
        }

        :is(.dark, html.starry-fantasy, body.starry-fantasy) .rich-text-editor-wrapper .ql-toolbar button:hover .ql-fill {
          fill: #C4B5FD !important;
        }

        :is(.dark, html.starry-fantasy, body.starry-fantasy) .rich-text-editor-wrapper .ql-picker-label {
          color: #A78BFA !important;
        }

        :is(.dark, html.starry-fantasy, body.starry-fantasy) .rich-text-editor-wrapper .ql-picker-options {
          background: #1F2937 !important;
          border-color: rgba(139, 92, 246, 0.4) !important;
        }

        :is(.dark, html.starry-fantasy, body.starry-fantasy) .rich-text-editor-wrapper .ql-picker-item {
          color: #E5E7EB !important;
        }

        :is(.dark, html.starry-fantasy, body.starry-fantasy) .rich-text-editor-wrapper .ql-picker-item:hover {
          background: rgba(139, 92, 246, 0.2) !important;
          color: #C4B5FD !important;
        }

        :is(.dark, html.starry-fantasy, body.starry-fantasy) .rich-text-editor-wrapper .ql-container {
          background: rgba(17, 24, 39, 0.75);
          border-color: rgba(139, 92, 246, 0.3) !important;
        }

        :is(.dark, html.starry-fantasy, body.starry-fantasy) .rich-text-editor-wrapper .ql-editor {
          color: #F9FAFB;
        }

        :is(.dark, html.starry-fantasy, body.starry-fantasy) .rich-text-editor-wrapper .ql-editor.ql-blank::before {
          color: rgba(248, 250, 252, 0.5);
        }

        :is(.dark, html.starry-fantasy, body.starry-fantasy) .rich-text-editor-wrapper .ql-editor h1,
        :is(.dark, html.starry-fantasy, body.starry-fantasy) .rich-text-editor-wrapper .ql-editor h2,
        :is(.dark, html.starry-fantasy, body.starry-fantasy) .rich-text-editor-wrapper .ql-editor h3 {
          color: #F9FAFB;
        }

        :is(.dark, html.starry-fantasy, body.starry-fantasy) .rich-text-editor-wrapper .ql-editor blockquote {
          border-left-color: #A78BFA;
          color: #9CA3AF;
        }

        :is(.dark, html.starry-fantasy, body.starry-fantasy) .rich-text-editor-wrapper .ql-editor code {
          background: rgba(139, 92, 246, 0.2);
          color: #C4B5FD;
        }

        :is(.dark, html.starry-fantasy, body.starry-fantasy) .rich-text-editor-wrapper .ql-editor pre {
          background: #0F172A;
          color: #F1F5F9;
        }

        :is(.dark, html.starry-fantasy, body.starry-fantasy) .rich-text-editor-wrapper .ql-editor a {
          color: #A78BFA;
        }

        :is(.dark, html.starry-fantasy, body.starry-fantasy) .rich-text-editor-wrapper .ql-editor a:hover {
          color: #C4B5FD;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
