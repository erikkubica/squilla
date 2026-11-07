import * as React from "react";
import { useEffect, useState } from "react";
import { getNodeTypes } from "../api";
import { Glyph, humanize, KernelSvg } from "../ui";
import { useIconLookup } from "./IconField";

// Content-type names and icons (the same lucide icons the admin sidebar
// uses), fetched once and rendered through the kernel's icon endpoint.

export interface TypeMeta {
  label: string;
  plural: string;
  /** "lucide:panel-top", or "" when the type has no icon. */
  icon: string;
}

function lucideValue(name?: string): string {
  if (!name) return "";
  const kebab = name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([a-zA-Z])(\d)/g, "$1-$2")
    .toLowerCase();
  return `lucide:${kebab}`;
}

let typesPromise: Promise<Map<string, TypeMeta>> | null = null;

function loadTypes(): Promise<Map<string, TypeMeta>> {
  if (!typesPromise) {
    typesPromise = getNodeTypes()
      .then((list) => {
        const m = new Map<string, TypeMeta>();
        for (const t of list) {
          const label = t.label || humanize(t.slug);
          m.set(t.slug, { label, plural: t.label_plural || `${label}s`, icon: lucideValue(t.icon) });
        }
        return m;
      })
      .catch(() => {
        typesPromise = null;
        return new Map<string, TypeMeta>();
      });
  }
  return typesPromise;
}

export function useNodeTypes(): Map<string, TypeMeta> {
  const [types, setTypes] = useState<Map<string, TypeMeta>>(new Map());
  useEffect(() => {
    let live = true;
    void loadTypes().then((m) => live && setTypes(m));
    return () => {
      live = false;
    };
  }, []);
  // Resolve every type's icon in one request so rows render together.
  useIconLookup([...types.values()].map((t) => t.icon).filter(Boolean));
  return types;
}

export function typeMeta(types: Map<string, TypeMeta>, slug: string): TypeMeta {
  return types.get(slug) ?? { label: humanize(slug), plural: `${humanize(slug)}s`, icon: "" };
}

/** A content type's icon, falling back to a plain document glyph. */
export function TypeIcon({ types, slug, size = 16 }: { types: Map<string, TypeMeta>; slug: string; size?: number }): React.JSX.Element {
  const icon = typeMeta(types, slug).icon;
  const found = useIconLookup(icon ? [icon] : []).get(icon);
  if (found) {
    return (
      <span className="vedit-type-icon" style={{ width: size, height: size }}>
        <KernelSvg svg={found.svg} />
      </span>
    );
  }
  return <Glyph name="file" size={size} />;
}
