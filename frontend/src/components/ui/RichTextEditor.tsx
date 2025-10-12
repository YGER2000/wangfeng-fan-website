import { useMemo, useRef, useEffect } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: number;
}

/**
 * 基于 Quill 的富文本编辑器
 * 完全所见即所得，像 Word 一样简单易用
 */
const RichTextEditor = ({ value, onChange, height = 700 }: RichTextEditorProps) => {
  const quillRef = useRef<ReactQuill>(null);

  // 上传图片到服务器
  const uploadImageToServer = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('http://localhost:1994/api/upload/image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '上传失败');
    }

    const data = await response.json();
    return data.url;
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

  return (
    <div
      className="rich-text-editor-wrapper"
      style={{ height: `${height}px` }}
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
          border: 1px solid rgba(139, 92, 246, 0.2) !important;
          border-radius: 0 0 8px 8px !important;
          flex: 1;
          overflow-y: auto;
          background: white;
        }

        .rich-text-editor-wrapper .ql-editor {
          padding: 32px 48px !important;
          font-size: 16px !important;
          line-height: 1.8 !important;
          color: #374151;
          min-height: 100%;
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
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1em 0;
        }

        .rich-text-editor-wrapper .ql-editor ul,
        .rich-text-editor-wrapper .ql-editor ol {
          padding-left: 1.5em;
          margin: 1em 0;
        }

        /* 深色模式 */
        .dark .rich-text-editor-wrapper .ql-toolbar {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%) !important;
          border-color: rgba(139, 92, 246, 0.3) !important;
        }

        .dark .rich-text-editor-wrapper .ql-toolbar.ql-snow {
          border-bottom-color: rgba(139, 92, 246, 0.4) !important;
        }

        .dark .rich-text-editor-wrapper .ql-toolbar .ql-stroke {
          stroke: #A78BFA !important;
        }

        .dark .rich-text-editor-wrapper .ql-toolbar .ql-fill {
          fill: #A78BFA !important;
        }

        .dark .rich-text-editor-wrapper .ql-toolbar button:hover .ql-stroke {
          stroke: #C4B5FD !important;
        }

        .dark .rich-text-editor-wrapper .ql-toolbar button:hover .ql-fill {
          fill: #C4B5FD !important;
        }

        .dark .rich-text-editor-wrapper .ql-picker-label {
          color: #A78BFA !important;
        }

        .dark .rich-text-editor-wrapper .ql-picker-options {
          background: #1F2937 !important;
          border-color: rgba(139, 92, 246, 0.4) !important;
        }

        .dark .rich-text-editor-wrapper .ql-picker-item {
          color: #E5E7EB !important;
        }

        .dark .rich-text-editor-wrapper .ql-picker-item:hover {
          background: rgba(139, 92, 246, 0.2) !important;
          color: #C4B5FD !important;
        }

        .dark .rich-text-editor-wrapper .ql-container {
          background: #111827;
          border-color: rgba(139, 92, 246, 0.3) !important;
        }

        .dark .rich-text-editor-wrapper .ql-editor {
          color: #E5E7EB;
        }

        .dark .rich-text-editor-wrapper .ql-editor.ql-blank::before {
          color: #6B7280;
        }

        .dark .rich-text-editor-wrapper .ql-editor h1,
        .dark .rich-text-editor-wrapper .ql-editor h2,
        .dark .rich-text-editor-wrapper .ql-editor h3 {
          color: #F9FAFB;
        }

        .dark .rich-text-editor-wrapper .ql-editor blockquote {
          border-left-color: #A78BFA;
          color: #9CA3AF;
        }

        .dark .rich-text-editor-wrapper .ql-editor code {
          background: rgba(139, 92, 246, 0.2);
          color: #C4B5FD;
        }

        .dark .rich-text-editor-wrapper .ql-editor pre {
          background: #0F172A;
          color: #F1F5F9;
        }

        .dark .rich-text-editor-wrapper .ql-editor a {
          color: #A78BFA;
        }

        .dark .rich-text-editor-wrapper .ql-editor a:hover {
          color: #C4B5FD;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
