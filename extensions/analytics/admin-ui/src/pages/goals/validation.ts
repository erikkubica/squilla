// Pure validation for goal and tracked-link forms.
import type { GoalInput, LinkInput } from "../../api/types";

export const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function validateGoal(g: GoalInput): Partial<Record<keyof GoalInput, string>> {
  const e: Partial<Record<keyof GoalInput, string>> = {};
  if (!g.name.trim()) e.name = "Give the goal a name.";
  if (g.kind === "link") {
    if (!g.link_slug) e.link_slug = "Choose a tracked link.";
  } else if (!g.path_pattern.trim()) {
    e.path_pattern = "Enter a path, e.g. /thank-you or /forms/submit/*.";
  } else if (!g.path_pattern.startsWith("/")) {
    e.path_pattern = "Paths start with /.";
  }
  return e;
}

export function validateLink(l: LinkInput): Partial<Record<keyof LinkInput, string>> {
  const e: Partial<Record<keyof LinkInput, string>> = {};
  if (!SLUG_RE.test(l.slug)) e.slug = "Use lowercase letters, numbers and dashes.";
  if (!l.label.trim()) e.label = "Add a label you will recognise in reports.";
  try {
    const u = new URL(l.destination);
    if (u.protocol !== "https:" && u.protocol !== "http:") e.destination = "Use an http(s) URL.";
  } catch {
    e.destination = "Enter a full URL, e.g. https://wa.me/84…";
  }
  return e;
}

export function publicLinkUrl(slug: string, origin = typeof window !== "undefined" ? window.location.origin : ""): string {
  return `${origin}/go/${slug}`;
}
