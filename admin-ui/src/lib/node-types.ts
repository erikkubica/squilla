import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { getNodeTypes } from "@/api/client";
import { resolveLucideIcon, type IconComponent } from "@/lib/lucide-icon";

// Content-type names and icons for pickers and search results, fetched
// once per admin session.

export interface TypeMeta {
  label: string;
  plural: string;
  Icon: IconComponent;
}

function humanize(slug: string): string {
  return slug.replace(/[-_]+/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

let typesPromise: Promise<Map<string, TypeMeta>> | null = null;

function loadTypes(): Promise<Map<string, TypeMeta>> {
  if (!typesPromise) {
    typesPromise = getNodeTypes()
      .then((list) => {
        const m = new Map<string, TypeMeta>();
        for (const t of list) {
          const label = t.label || humanize(t.slug);
          m.set(t.slug, { label, plural: t.label_plural || `${label}s`, Icon: resolveLucideIcon(t.icon) ?? (FileText as IconComponent) });
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
  return types;
}

export function typeMeta(types: Map<string, TypeMeta>, slug: string): TypeMeta {
  return types.get(slug) ?? { label: humanize(slug), plural: `${humanize(slug)}s`, Icon: FileText as IconComponent };
}
