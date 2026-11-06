import * as Lucide from "lucide-react";
import type { ComponentType, CSSProperties } from "react";

export type IconComponent = ComponentType<{
  className?: string;
  size?: number;
  style?: CSSProperties;
  strokeWidth?: number | string;
}>;

const lucideIcons = Lucide as unknown as Record<string, IconComponent>;

function toPascalCase(name: string): string {
  return name
    .split(/[-_\s]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");
}

/**
 * Resolves a lucide icon by the PascalCase export name ("ImageDown") or the
 * kebab-case alias themes and extensions use in manifests ("image-down").
 * Returns null when the name is not a lucide icon (e.g. an emoji).
 */
export function resolveLucideIcon(name: string | undefined | null): IconComponent | null {
  if (!name) return null;
  return lucideIcons[name] || lucideIcons[toPascalCase(name)] || null;
}
