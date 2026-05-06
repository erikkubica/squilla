import * as React from "react";
import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";

interface Props {
  value: string;
  onChange: (next: string) => void;
}

/**
 * Tiptap-backed WYSIWYG. Outputs HTML on every transaction. We pass a
 * stable container and update content imperatively when `value` arrives
 * from outside (e.g. discard-changes), to avoid Tiptap reinitialising
 * mid-typing.
 */
export function RichText({ value, onChange }: Props): React.JSX.Element {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({}),
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener noreferrer" } }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: { attributes: { class: "vedit-tiptap-content" } },
  });

  // External value changes (discard / load) — only push if the editor
  // doesn't already match, otherwise we wipe the user's caret position.
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if ((value || "") !== current) editor.commands.setContent(value || "", false);
  }, [editor, value]);

  if (!editor) return <div className="vedit-tiptap-loading">Loading editor…</div>;

  return (
    <div className="vedit-tiptap">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor }: { editor: NonNullable<ReturnType<typeof useEditor>> }): React.JSX.Element {
  const can = (cmd: () => boolean): boolean => {
    try {
      return cmd();
    } catch {
      return false;
    }
  };

  return (
    <div className="vedit-tiptap-toolbar">
      <ToolbarButton active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} label="B" title="Bold" bold />
      <ToolbarButton active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} label="i" title="Italic" italic />
      <ToolbarButton active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} label="S" title="Strike" />
      <ToolbarButton active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()} label="</>" title="Inline code" />
      <Sep />
      <ToolbarButton active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} label="H2" title="Heading 2" />
      <ToolbarButton active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} label="H3" title="Heading 3" />
      <ToolbarButton active={editor.isActive("paragraph")} onClick={() => editor.chain().focus().setParagraph().run()} label="P" title="Paragraph" />
      <Sep />
      <ToolbarButton active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} label="•" title="Bullet list" />
      <ToolbarButton active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} label="1." title="Ordered list" />
      <ToolbarButton active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} label="❝" title="Blockquote" />
      <ToolbarButton active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()} label="{}" title="Code block" />
      <Sep />
      <ToolbarButton
        active={editor.isActive("link")}
        onClick={() => {
          const prev = editor.getAttributes("link").href as string | undefined;
          const url = window.prompt("Link URL", prev || "https://");
          if (url === null) return;
          if (url === "") {
            editor.chain().focus().unsetLink().run();
            return;
          }
          editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
        }}
        label="🔗"
        title="Link"
      />
      <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} label="―" title="Horizontal rule" />
      <Sep />
      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} label="↶" title="Undo" disabled={!can(() => editor.can().undo())} />
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} label="↷" title="Redo" disabled={!can(() => editor.can().redo())} />
    </div>
  );
}

function ToolbarButton({
  active,
  onClick,
  label,
  title,
  bold,
  italic,
  disabled,
}: {
  active?: boolean;
  onClick: () => void;
  label: string;
  title: string;
  bold?: boolean;
  italic?: boolean;
  disabled?: boolean;
}): React.JSX.Element {
  return (
    <button
      type="button"
      className="vedit-tiptap-btn"
      data-active={active ? "true" : "false"}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      disabled={disabled}
      style={{ fontWeight: bold ? 700 : undefined, fontStyle: italic ? "italic" : undefined }}
    >
      {label}
    </button>
  );
}

function Sep(): React.JSX.Element {
  return <span className="vedit-tiptap-sep" aria-hidden="true" />;
}
