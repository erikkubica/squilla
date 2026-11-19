// Client for the redirects admin API (/admin/api/ext/redirects/*).

export const API = "/admin/api/ext/redirects";

export type MatchType = "exact" | "prefix" | "regex";

export interface Rule {
  id: number;
  source: string;
  match_type: MatchType;
  target: string;
  status_code: number;
  enabled: boolean;
  keep_query: boolean;
  note: string;
  origin: "manual" | "auto";
  hits: number;
  last_hit_at: string;
}

export type RuleInput = Pick<Rule, "source" | "match_type" | "target" | "status_code" | "enabled" | "keep_query" | "note">;

export interface RuleList {
  rows: Rule[];
  total: number;
  counts: { all?: number; manual?: number; auto?: number; disabled?: number };
}

export interface TestHop {
  rule_id: number;
  source: string;
  match_type: MatchType;
  status_code: number;
  location: string;
}

export interface TestResult {
  matched: boolean;
  loop: boolean;
  hops: TestHop[];
}

export interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: { line: number; message: string }[];
}

/** ApiError carries the server's message and per-field validation errors. */
export class ApiError extends Error {
  fields: Record<string, string>;
  constructor(message: string, fields: Record<string, string> = {}) {
    super(message);
    this.fields = fields;
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(API + path, {
    method,
    credentials: "include",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.message || `Request failed (${res.status})`, data.fields);
  return data as T;
}

export const listRules = (qs: URLSearchParams) => request<RuleList>("GET", `/rules?${qs.toString()}`);
export const createRule = (rule: RuleInput) => request<{ ok: true }>("POST", "/rules", rule);
export const updateRule = (id: number, rule: RuleInput) => request<{ ok: true }>("PUT", `/rules/${id}`, rule);
export const deleteRule = (id: number) => request<{ ok: true }>("DELETE", `/rules/${id}`);
export const bulkRules = (ids: number[], action: "enable" | "disable" | "delete") =>
  request<{ affected: number }>("POST", "/rules/bulk", { ids, action });
export const testURL = (url: string) => request<TestResult>("POST", "/test", { url });
export const importCSV = (csv: string, update_existing: boolean) =>
  request<ImportResult>("POST", "/import", { csv, update_existing });
export interface BrokenLink {
  path: string;
  hits: number;
  visitors: number;
  suggestion?: { url: string; title: string };
}

/** 404 addresses reported by the analytics extension; available=false when it is not active. */
export interface BrokenLinks {
  available: boolean;
  from?: string;
  to?: string;
  days?: number;
  rows: BrokenLink[];
  /** Addresses a redirect already covers. */
  covered?: number;
  /** Addresses a published page serves again. */
  live?: number;
  /** Addresses whose redirect exists but is switched off. */
  disabled?: number;
  /** True when more addresses exist than were scanned. */
  truncated?: boolean;
  /** The page list was incomplete: some addresses may be live pages, and no targets are suggested. */
  partial?: boolean;
  /** Analytics has in-page measurement on, so "confirmed visits" means something. */
  confirm_available?: boolean;
  /** Analytics answered but failed. */
  error?: string;
}

export interface BatchResult {
  created: number;
  errors: { index: number; source: string; message: string }[];
  /** Created, but the target redirects again (two hops). */
  warnings: { index: number; source: string; message: string }[];
}

export const getBrokenLinks = (days: number, verified: boolean, countOnly = false) =>
  request<BrokenLinks>("GET", `/broken-links?days=${days}${verified ? "&verified=1" : ""}${countOnly ? "&count_only=1" : ""}`);
export const createRules = (rules: Partial<RuleInput>[]) => request<BatchResult>("POST", "/rules/batch", { rules });
export const getSettings = () => request<{ auto_create: boolean }>("GET", "/settings");
export const saveSettings = (auto_create: boolean) => request<{ auto_create: boolean }>("PUT", "/settings", { auto_create });

export const STATUS_LABELS: Record<number, string> = {
  301: "301 Permanent",
  302: "302 Temporary",
  307: "307 Temporary (keeps method)",
  308: "308 Permanent (keeps method)",
  410: "410 Gone (no target)",
};

/**
 * Width for a dialog wider than the default. Set inline because the shell's
 * stylesheet loads after this extension's, so its own max-width utility on
 * DialogContent would win over a `sm:max-w-*` class emitted here.
 */
export const dialogWidth = (px: number) => ({ maxWidth: `min(${px}px, calc(100% - 2rem))` });
