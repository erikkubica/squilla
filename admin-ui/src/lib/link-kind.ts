// What a link points at, worked out from its URL, so the link field can
// show "Page · About us" or "Email · hello@…" instead of a raw string.
// Mirrored in extensions/visual-editor/editor-ui/src/fields/linkKind.ts.

export type LinkKind = "empty" | "page" | "anchor" | "email" | "phone" | "chat" | "map" | "external";

export interface LinkInfo {
  kind: LinkKind;
  /** Short type name: "Page", "Website", "Section", "Email", "Phone". */
  label: string;
  /** The readable target: path, host, address, number or #id. */
  detail: string;
}

export function linkInfo(url: string): LinkInfo {
  const u = url.trim();
  if (!u) return { kind: "empty", label: "No link yet", detail: "" };
  if (u.startsWith("#")) return { kind: "anchor", label: "Section", detail: u };
  if (/^mailto:/i.test(u)) return { kind: "email", label: "Email", detail: u.replace(/^mailto:/i, "").split("?")[0] ?? "" };
  if (/^tel:/i.test(u)) return { kind: "phone", label: "Phone", detail: u.replace(/^tel:/i, "") };
  if (u.startsWith("/")) return { kind: "page", label: "Page", detail: u };
  try {
    const parsed = new URL(/^[a-z][a-z0-9+.-]*:/i.test(u) ? u : `https://${u}`);
    if (typeof window !== "undefined" && parsed.host === window.location.host) {
      return { kind: "page", label: "Page", detail: parsed.pathname + parsed.search + parsed.hash };
    }
    const host = parsed.host.replace(/^www\./, "");
    const detail = host + (parsed.pathname === "/" ? "" : parsed.pathname);
    if (/^(wa\.me|api\.whatsapp\.com|chat\.whatsapp\.com|whatsapp\.com)$/i.test(host)) return { kind: "chat", label: "WhatsApp", detail };
    if (/^(m\.me|messenger\.com|t\.me|zalo\.me)$/i.test(host)) return { kind: "chat", label: "Chat", detail };
    if (/^maps\.app\.goo\.gl$/i.test(host) || /^goo\.gl$/i.test(host) && parsed.pathname.startsWith("/maps") || /(^|\.)google\.[a-z.]+$/i.test(host) && parsed.pathname.startsWith("/maps")) {
      return { kind: "map", label: "Map", detail };
    }
    return { kind: "external", label: "Website", detail };
  } catch {
    return { kind: "external", label: "Website", detail: u };
  }
}

/** Turn what someone typed into a URL, or null when it reads like a
 *  search ("about us") rather than an address. */
export function interpretURL(input: string): string | null {
  const q = input.trim();
  if (!q) return null;
  if (/^(https?:\/\/|\/|#|mailto:|tel:)/i.test(q)) return q;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(q)) return `mailto:${q}`;
  if (/^\+?[\d][\d\s().-]{5,}$/.test(q)) return `tel:${q.replace(/[\s().-]/g, "")}`;
  if (/^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}(:\d+)?(\/\S*)?$/i.test(q)) return `https://${q}`;
  return null;
}
