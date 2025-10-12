import '@mdxeditor/editor/style.css';
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
  tablePlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  CreateLink,
  InsertImage,
  InsertTable,
  InsertThematicBreak,
  ListsToggle,
  Separator,
  CodeToggle,
  InsertCodeBlock,
  type MDXEditorMethods
} from '@mdxeditor/editor';
import { useRef } from 'react';

interface TyporaStyleEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: number;
}

/**
 * Typora 风格的所见即所得 Markdown 编辑器
 * 使用 MDXEditor 实现，带有工具栏和实时渲染
 */
const TyporaStyleEditor = ({ value, onChange, height = 700 }: TyporaStyleEditorProps) => {
  const editorRef = useRef<MDXEditorMethods>(null);

  return (
    <div
      className="typora-style-editor-wrapper"
      style={{
        height: `${height}px`,
        overflow: 'auto'
      }}
    >
      <MDXEditor
        ref={editorRef}
        markdown={value}
        onChange={onChange}
        placeholder="开始输入你的内容..."
        contentEditableClassName="prose dark:prose-invert max-w-none"
        plugins={[
          // 标题插件 - 支持 H1-H6
          headingsPlugin({ allowedHeadingLevels: [1, 2, 3, 4, 5, 6] }),

          // 列表插件（不包含任务列表/checkbox）
          listsPlugin(),

          // 引用插件
          quotePlugin(),

          // 分隔线插件
          thematicBreakPlugin(),

          // Markdown 快捷键
          markdownShortcutPlugin(),

          // 链接插件
          linkPlugin(),
          linkDialogPlugin({
            linkAutocompleteSuggestions: []
          }),

          // 图片插件
          imagePlugin({
            imageUploadHandler: async (image) => {
              // 这里可以实现图片上传逻辑
              // 现在返回本地 URL
              return URL.createObjectURL(image);
            },
            imageAutocompleteSuggestions: []
          }),

          // 表格插件
          tablePlugin(),

          // 代码块插件
          codeBlockPlugin({ defaultCodeBlockLanguage: 'txt' }),
          codeMirrorPlugin({
            codeBlockLanguages: {
              txt: 'Plain Text',
              js: 'JavaScript',
              ts: 'TypeScript',
              jsx: 'JSX',
              tsx: 'TSX',
              css: 'CSS',
              html: 'HTML',
              python: 'Python',
              java: 'Java',
              go: 'Go',
              rust: 'Rust',
              bash: 'Bash',
              json: 'JSON',
              markdown: 'Markdown',
            }
          }),

          // 工具栏插件
          toolbarPlugin({
            toolbarContents: () => (
              <>
                <UndoRedo />
                <Separator />
                <BlockTypeSelect />
                <Separator />
                <BoldItalicUnderlineToggles />
                <CodeToggle />
                <Separator />
                <CreateLink />
                <InsertImage />
                <Separator />
                <ListsToggle />
                <Separator />
                <InsertTable />
                <InsertCodeBlock />
              </>
            )
          })
        ]}
      />

      <style>{`
        .typora-style-editor-wrapper {
          --mdx-editor-bg: transparent;
          --mdx-editor-fg: inherit;
        }

        .typora-style-editor-wrapper .mdxeditor {
          background: transparent !important;
          color: inherit !important;
          font-family: inherit !important;
        }

        .typora-style-editor-wrapper .mdxeditor-toolbar {
          background: rgba(139, 92, 246, 0.05) !important;
          border-bottom: 1px solid rgba(139, 92, 246, 0.2) !important;
          padding: 8px 12px !important;
          border-radius: 8px 8px 0 0 !important;
        }

        .typora-style-editor-wrapper .mdxeditor-toolbar button,
        .typora-style-editor-wrapper .mdxeditor-toolbar select {
          color: #8B5CF6 !important;
          transition: all 0.2s !important;
          border: 1px solid rgba(139, 92, 246, 0.2) !important;
        }

        .typora-style-editor-wrapper .mdxeditor-toolbar button:hover,
        .typora-style-editor-wrapper .mdxeditor-toolbar select:hover {
          background: rgba(139, 92, 246, 0.1) !important;
          color: #7C3AED !important;
          border-color: rgba(139, 92, 246, 0.4) !important;
        }

        .typora-style-editor-wrapper .mdxeditor-toolbar button[data-toolbar-item-active="true"] {
          background: rgba(139, 92, 246, 0.15) !important;
          color: #7C3AED !important;
        }

        .typora-style-editor-wrapper .mdxeditor-root-contenteditable {
          padding: 32px 48px !important;
          font-size: 16px !important;
          line-height: 1.8 !important;
        }

        .typora-style-editor-wrapper .prose {
          max-width: 100% !important;
        }

        /* 下拉菜单样式 */
        .typora-style-editor-wrapper [role="menu"],
        .typora-style-editor-wrapper [role="dialog"] {
          background: white !important;
          border: 1px solid rgba(139, 92, 246, 0.3) !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15) !important;
          z-index: 9999 !important;
        }

        .typora-style-editor-wrapper [role="menuitem"] {
          color: #374151 !important;
          padding: 8px 12px !important;
        }

        .typora-style-editor-wrapper [role="menuitem"]:hover {
          background: rgba(139, 92, 246, 0.1) !important;
          color: #8B5CF6 !important;
        }

        /* 隐藏 checkbox (任务列表) */
        .typora-style-editor-wrapper input[type="checkbox"] {
          display: none !important;
        }

        /* 深色模式适配 */
        .dark .typora-style-editor-wrapper .mdxeditor-toolbar {
          background: rgba(139, 92, 246, 0.1) !important;
          border-bottom-color: rgba(139, 92, 246, 0.3) !important;
        }

        .dark .typora-style-editor-wrapper .mdxeditor-toolbar button,
        .dark .typora-style-editor-wrapper .mdxeditor-toolbar select {
          color: #A78BFA !important;
          border-color: rgba(139, 92, 246, 0.3) !important;
        }

        .dark .typora-style-editor-wrapper .mdxeditor-toolbar button:hover,
        .dark .typora-style-editor-wrapper .mdxeditor-toolbar select:hover {
          background: rgba(139, 92, 246, 0.2) !important;
          color: #C4B5FD !important;
        }

        .dark .typora-style-editor-wrapper [role="menu"],
        .dark .typora-style-editor-wrapper [role="dialog"] {
          background: #1f2937 !important;
          border-color: rgba(139, 92, 246, 0.4) !important;
        }

        .dark .typora-style-editor-wrapper [role="menuitem"] {
          color: #e5e7eb !important;
        }

        .dark .typora-style-editor-wrapper [role="menuitem"]:hover {
          background: rgba(139, 92, 246, 0.2) !important;
          color: #C4B5FD !important;
        }
      `}</style>
    </div>
  );
};

export default TyporaStyleEditor;
