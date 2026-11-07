/** Shared formatting for the forms admin pages. */

export function relativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diffSec < 60) return "just now";
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} h ago`;
  const days = Math.floor(hr / 24);
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const mon = Math.floor(days / 30);
  if (mon < 12) return `${mon} mo ago`;
  return `${Math.floor(mon / 12)} y ago`;
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

/** Short date for inbox rows: time today, "12 Nov" this year, full date otherwise. */
export function inboxDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  if (d.getFullYear() === now.getFullYear()) return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function str(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number") return String(v);
  return "";
}

const NAME_KEYS = /^(full_?name|your_?name|name|first_?name|contact_?name)$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SKIP_PREVIEW = /^(consent|gdpr|privacy|terms|website_url|honeypot|_.*)$/i;

/** Who sent it, read from the usual field names. */
export function sender(data: Record<string, unknown>): { name: string; email: string } {
  let name = "";
  let email = "";
  for (const [k, v] of Object.entries(data || {})) {
    const s = str(v);
    if (!s) continue;
    if (!name && NAME_KEYS.test(k)) name = s;
    if (!email && (/e-?mail/i.test(k) || EMAIL_RE.test(s)) && EMAIL_RE.test(s)) email = s;
  }
  if (!name) {
    const first = str((data as any)?.first_name);
    const last = str((data as any)?.last_name);
    name = [first, last].filter(Boolean).join(" ");
  }
  return { name, email };
}

/** One line of the message: the longest free-text answer, else the other answers joined. */
export function preview(data: Record<string, unknown>, skip: string[] = []): string {
  const entries = Object.entries(data || {}).filter(([k, v]) => !SKIP_PREVIEW.test(k) && !skip.includes(str(v)) && str(v) && str(v) !== "true" && str(v) !== "false");
  const msg = entries.find(([k, v]) => /message|comment|note|question|request|enquiry|inquiry|details/i.test(k) && str(v));
  if (msg) return str(msg[1]).replace(/\s+/g, " ");
  const long = entries.map(([, v]) => str(v)).filter((s) => s.length > 40).sort((a, b) => b.length - a.length)[0];
  if (long) return long.replace(/\s+/g, " ");
  return entries.map(([, v]) => str(v)).join(" · ");
}

export function initials(name: string, email: string): string {
  const src = name || email.split("@")[0] || "?";
  const parts = src.replace(/[^\p{L}\p{N}\s]/gu, " ").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Device summary from a user agent, e.g. "Chrome on macOS". */
export function deviceFromUA(ua: string): string {
  if (!ua) return "";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\//.test(ua)
      ? "Opera"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Chrome\//.test(ua)
          ? "Chrome"
          : /Safari\//.test(ua)
            ? "Safari"
            : "";
  const os = /iPhone|iPad/.test(ua)
    ? "iOS"
    : /Android/.test(ua)
      ? "Android"
      : /Mac OS X/.test(ua)
        ? "macOS"
        : /Windows/.test(ua)
          ? "Windows"
          : /Linux/.test(ua)
            ? "Linux"
            : "";
  return [browser, os].filter(Boolean).join(" on ") || "Unknown";
}

export async function copyText(text: string, toast: any, what = "Copied") {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(what);
  } catch {
    toast.error("Could not copy");
  }
}
