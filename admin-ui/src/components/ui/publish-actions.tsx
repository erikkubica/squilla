import type { ReactNode } from "react";

interface PublishActionsProps {
  /** Action items in declaration order. Falsy entries are skipped. */
  children: ReactNode;
}

/**
 * PublishActions — the standardised button grid in editors' Publish sidebar.
 *
 * Drop in any number of `<Button>` children:
 *  - 1 child  → renders full-width
 *  - 2+ kids  → renders a 2-column grid (Save + Publish on row one,
 *               Preview + Delete on row two, etc.)
 *
 * Every editor's primary actions share the same rhythm so the publish
 * card feels identical across nodes, terms, taxonomies, templates, and
 * extension editors. Children should each be `<Button className="w-full">`.
 */
export function PublishActions({ children }: PublishActionsProps) {
  const items = Array.isArray(children)
    ? children.filter(Boolean)
    : children
      ? [children]
      : [];

  if (items.length === 0) return null;

  if (items.length === 1) {
    return <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{items}</div>;
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 6,
      }}
    >
      {items}
    </div>
  );
}
