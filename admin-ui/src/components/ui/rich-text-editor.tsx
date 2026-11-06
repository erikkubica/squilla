import { useEditor, useEditorState, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import LinkExtension from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { tableExtensions, normalizeEditorHTML } from "./rich-text-tables";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  FileCode,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link2,
  Unlink,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Heading3,
  SeparatorHorizontal,
  RemoveFormatting,
  Table as TableIcon,
  BetweenHorizontalEnd,
  BetweenVerticalEnd,
  TableRowsSplit,
  TableColumnsSplit,
  PanelTop,
  Grid2x2X,
} from "lucide-react";
import { useEffect, useCallback } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
        active
          ? "bg-accent"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
      style={active ? { color: "var(--accent-strong)" } : undefined}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="mx-1 h-6 w-px" style={{ background: "var(--border)" }} />;
}

function TableControls({ editor }: { editor: Editor }) {
  // Tiptap v3 doesn't re-render on selection changes by default, so track
  // "cursor is in a table" explicitly to show/hide the row/column actions.
  const inTable = useEditorState({
    editor,
    selector: ({ editor }) => editor.isActive("table"),
  });

  return (
    <>
      <ToolbarButton
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        active={inTable}
        disabled={inTable}
        title="Insert Table (3×3)"
      >
        <TableIcon className="h-4 w-4" />
      </ToolbarButton>
      {inTable && (
        <>
          <ToolbarButton onClick={() => editor.chain().focus().addRowAfter().run()} title="Add Row Below">
            <BetweenHorizontalEnd className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().deleteRow().run()} title="Delete Row">
            <TableRowsSplit className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().addColumnAfter().run()} title="Add Column Right">
            <BetweenVerticalEnd className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().deleteColumn().run()} title="Delete Column">
            <TableColumnsSplit className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeaderRow().run()} title="Toggle Header Row">
            <PanelTop className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().deleteTable().run()} title="Delete Table">
            <Grid2x2X className="h-4 w-4" />
          </ToolbarButton>
        </>
      )}
    </>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted px-2 py-1.5 rounded-t-lg">
      {/* Headings */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive("heading", { level: 1 })}
        title="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
        title="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive("heading", { level: 3 })}
        title="Heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Inline formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive("underline")}
        title="Underline"
      >
        <UnderlineIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
        title="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        active={editor.isActive("code")}
        title="Inline Code"
      >
        <Code className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        active={editor.isActive("codeBlock")}
        title="Code Block"
      >
        <FileCode className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Alignment */}
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        active={editor.isActive({ textAlign: "left" })}
        title="Align Left"
      >
        <AlignLeft className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        active={editor.isActive({ textAlign: "center" })}
        title="Align Center"
      >
        <AlignCenter className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        active={editor.isActive({ textAlign: "right" })}
        title="Align Right"
      >
        <AlignRight className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        title="Ordered List"
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
        title="Blockquote"
      >
        <Quote className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal Rule"
      >
        <SeparatorHorizontal className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Table */}
      <TableControls editor={editor} />

      <ToolbarDivider />

      {/* Link */}
      <ToolbarButton
        onClick={setLink}
        active={editor.isActive("link")}
        title="Add Link"
      >
        <Link2 className="h-4 w-4" />
      </ToolbarButton>
      {editor.isActive("link") && (
        <ToolbarButton
          onClick={() => editor.chain().focus().unsetLink().run()}
          title="Remove Link"
        >
          <Unlink className="h-4 w-4" />
        </ToolbarButton>
      )}

      <ToolbarDivider />

      {/* Clear & History */}
      <ToolbarButton
        onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        title="Clear Formatting"
      >
        <RemoveFormatting className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo"
      >
        <Undo className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo"
      >
        <Redo className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      // v3 StarterKit bundles Link + Underline; disable them so the
      // explicitly configured instances below are the only ones.
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: false,
        underline: false,
      }),
      Underline,
      LinkExtension.configure({
        openOnClick: false,
        // Keep links as authored: no forced target/rel/class on save.
        // Editor styling comes from `.vibe-rte-content a` below.
        HTMLAttributes: { target: null, rel: null, class: null },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder: placeholder || "Start writing...",
      }),
      ...tableExtensions,
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(normalizeEditorHTML(editor.getHTML()));
    },
    editorProps: {
      attributes: {
        class: "vibe-rte-content",
      },
    },
  });

  // Sync external value changes
  useEffect(() => {
    if (editor && value !== normalizeEditorHTML(editor.getHTML())) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <style>{`
        .vibe-rte-content {
          padding: 0.75rem 1rem;
          min-height: 200px;
          outline: none;
          font-size: 0.9375rem;
          line-height: 1.7;
          color: #334155;
        }
        .vibe-rte-content > * + * { margin-top: 0.75em; }
        .vibe-rte-content p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: #94a3b8;
          float: left;
          height: 0;
          pointer-events: none;
        }
        /* Headings */
        .vibe-rte-content h1 { font-size: 1.875rem; font-weight: 700; line-height: 1.2; color: #0f172a; margin-top: 1.25em; margin-bottom: 0.5em; }
        .vibe-rte-content h2 { font-size: 1.5rem; font-weight: 600; line-height: 1.3; color: #0f172a; margin-top: 1.25em; margin-bottom: 0.5em; }
        .vibe-rte-content h3 { font-size: 1.25rem; font-weight: 600; line-height: 1.4; color: #1e293b; margin-top: 1em; margin-bottom: 0.4em; }
        /* Lists */
        .vibe-rte-content ul { list-style-type: disc; padding-left: 1.5em; }
        .vibe-rte-content ol { list-style-type: decimal; padding-left: 1.5em; }
        .vibe-rte-content li { margin-top: 0.25em; }
        .vibe-rte-content li p { margin: 0; }
        /* Blockquote */
        .vibe-rte-content blockquote {
          border-left: 3px solid #818cf8;
          background: #eef2ff;
          padding: 0.75rem 1rem;
          margin: 0.75em 0;
          border-radius: 0 0.5rem 0.5rem 0;
          color: #3730a3;
          font-style: italic;
        }
        .vibe-rte-content blockquote p { margin: 0; }
        /* Code (inline) */
        .vibe-rte-content code {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 0.25rem;
          padding: 0.125rem 0.375rem;
          font-size: 0.85em;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          color: #be185d;
        }
        /* Code block */
        .vibe-rte-content pre {
          background: #1e293b;
          border-radius: 0.5rem;
          padding: 0.875rem 1rem;
          margin: 0.75em 0;
          overflow-x: auto;
        }
        .vibe-rte-content pre code {
          background: none;
          border: none;
          padding: 0;
          color: #e2e8f0;
          font-size: 0.85em;
        }
        /* Horizontal rule */
        .vibe-rte-content hr {
          border: none;
          border-top: 2px solid #e2e8f0;
          margin: 1.25em 0;
        }
        /* Links */
        .vibe-rte-content a {
          color: #4f46e5;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .vibe-rte-content a:hover { color: #3730a3; }
        /* Strong / Em */
        .vibe-rte-content strong { font-weight: 600; color: #0f172a; }
        .vibe-rte-content em { font-style: italic; }
        .vibe-rte-content s { text-decoration: line-through; color: #94a3b8; }
        /* Text alignment */
        .vibe-rte-content .has-text-align-center { text-align: center; }
        .vibe-rte-content .has-text-align-right { text-align: right; }
        .vibe-rte-content .has-text-align-left { text-align: left; }
        /* Tables — scroll horizontally in narrow panes instead of squashing columns */
        .vibe-rte-content .rte-table-scroll {
          overflow-x: auto;
          margin: 0.75em 0;
        }
        .vibe-rte-content table {
          width: 100%;
          border-collapse: collapse;
          table-layout: auto;
          margin: 0;
        }
        .vibe-rte-content th,
        .vibe-rte-content td {
          border: 1px solid #cbd5e1;
          padding: 0.375rem 0.625rem;
          vertical-align: top;
          position: relative;
          min-width: 7rem;
          word-break: normal;
          overflow-wrap: normal;
          white-space: normal;
        }
        .vibe-rte-content th code,
        .vibe-rte-content td code { white-space: nowrap; }
        .vibe-rte-content th {
          background: #f1f5f9;
          font-weight: 600;
          text-align: left;
          color: #0f172a;
        }
        .vibe-rte-content th p,
        .vibe-rte-content td p { margin: 0; }
        .vibe-rte-content th > * + *,
        .vibe-rte-content td > * + * { margin-top: 0.5em; }
        .vibe-rte-content .selectedCell::after {
          content: "";
          position: absolute;
          inset: 0;
          background: rgba(99, 102, 241, 0.15);
          pointer-events: none;
          z-index: 2;
        }
        /* Classed div boxes (e.g. notes) */
        .vibe-rte-content div[class]:not(.rte-table-scroll) {
          border: 1px dashed #cbd5e1;
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: #f8fafc;
        }
        .vibe-rte-content div[class]:not(.rte-table-scroll) > * + * { margin-top: 0.5em; }
      `}</style>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
