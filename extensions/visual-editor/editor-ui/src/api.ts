// Thin API client for the editor. Reuses the admin SPA's endpoints
// — the session cookie is `Path=/`, SameSite=Strict, and CSRF is
// enforced by the JSONOnlyMutations middleware — so there's no new
// auth surface here.

export interface BlockField {
  name: string;
  title?: string;
  /** Some hand-written schemas say `label` instead of `title`. */
  label?: string;
  type: string;
  required?: boolean;
  /** Editor help shown under the label. Block schemas use `hint`;
   *  `description` is the older key and still honoured. */
  hint?: string;
  description?: string;
  placeholder?: string;
  initialValue?: unknown;
  /** Percent of the row the field takes (25, 33, 50, 66, 75, 100). */
  width?: number;
  fields?: BlockField[];
  /** Canonical kernel format is a plain string array. We accept the
   *  legacy {value,label} object form too so older schemas keep
   *  rendering, but theme_loader_register now rejects object options
   *  on activation. */
  options?: Array<string | { value: string; label: string }>;
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
  max_length?: number;
  prepend?: string;
  append?: string;
  multiple?: boolean;
  /** icon fields: restrict the icon sets offered (e.g. ["lucide"]). */
  providers?: string[];
}

export interface BlockType {
  id: number;
  slug: string;
  /** Display name of the block. The kernel returns this as `label`,
   *  not `name` — typing it as both ways for safety. */
  label?: string;
  name?: string;
  /** Lucide icon name ("map-pin"), an emoji, or "square" (the default). */
  icon?: string;
  description?: string;
  /** The kernel's GET /admin/api/block-types returns the field
   *  schema under the JSON key `fields` (the Go column name), not
   *  `field_schema`. We accept either to remain forward-compatible. */
  fields?: BlockField[];
  field_schema?: BlockField[];
}

/** Display label for a block type, falling back through label → name →
 *  slug → "(unnamed)". The trailing fallback prevents downstream
 *  `.localeCompare` / `.toLowerCase` crashes when a block-types entry
 *  arrives with all three fields blank. */
export function blockTypeLabel(bt: BlockType | null | undefined): string {
  if (!bt) return "(unnamed)";
  return bt.label || bt.name || bt.slug || "(unnamed)";
}

/** Normalized field schema, accepting either kernel API key name. */
export function blockTypeFields(bt: BlockType): BlockField[] {
  return bt.fields ?? bt.field_schema ?? [];
}

export interface BlocksDataEntry {
  type: string;
  fields: Record<string, unknown>;
}

export interface ContentNode {
  id: number;
  title: string;
  slug: string;
  node_type: string;
  language_code: string;
  status?: string;
  blocks_data: BlocksDataEntry[] | null;
  full_url: string;
}

interface ApiEnvelope<T> {
  data: T;
  error?: { code?: string; message?: string };
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: "same-origin",
    ...init,
    headers: {
      Accept: "application/json",
      // PATCH / POST go through the admin's JSONOnlyMutations gate:
      // any non-GET request must be application/json.
      ...(init?.method && init.method !== "GET"
        ? { "Content-Type": "application/json" }
        : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      const body = (await res.json()) as ApiEnvelope<unknown> & { message?: string };
      if (body?.error?.message) msg = body.error.message;
      else if (typeof body?.message === "string") msg = body.message;
    } catch {
      // body wasn't JSON; keep the status text
    }
    throw new Error(msg);
  }
  return (await res.json()) as T;
}

export async function getNode(id: number): Promise<ContentNode> {
  const env = await api<ApiEnvelope<ContentNode>>(`/admin/api/nodes/${id}`);
  return env.data;
}

export async function getBlockTypes(): Promise<BlockType[]> {
  const env = await api<ApiEnvelope<BlockType[]>>("/admin/api/block-types?per_page=1000");
  return env.data ?? [];
}

export async function updateNodeBlocks(
  id: number,
  blocksData: BlocksDataEntry[],
): Promise<void> {
  await api<ApiEnvelope<ContentNode>>(`/admin/api/nodes/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ blocks_data: blocksData }),
  });
}

/**
 * Render blocks for this node through the kernel's public block pipeline
 * (POST /admin/api/nodes/:id/render-blocks): the same theme settings,
 * `request`, `node`, reference/term hydration and asset resolution a
 * visitor's page render uses. The page's own path and query are sent so
 * pagination and term-archive blocks render for the URL being edited.
 * Returns one HTML string per block, in order. Nothing is saved.
 */
export async function renderBlocks(nodeId: number, blocks: BlocksDataEntry[]): Promise<string[]> {
  const query: Record<string, string> = {};
  new URLSearchParams(window.location.search).forEach((v, k) => {
    query[k] = v;
  });
  const env = await api<ApiEnvelope<{ html: string[] }>>(`/admin/api/nodes/${nodeId}/render-blocks`, {
    method: "POST",
    body: JSON.stringify({ blocks, path: window.location.pathname, query }),
  });
  return env.data?.html ?? [];
}

/** The kernel renders a failing block as `<!-- block error: slug — message -->`
 *  (both parts HTML-escaped). Returns the readable message, or null. */
export function blockRenderError(html: string): string | null {
  const m = html.match(/<!-- block error: ([\s\S]*?) -->/);
  if (!m) return null;
  const t = document.createElement("textarea");
  t.innerHTML = m[1] ?? "";
  return t.value;
}

export interface MediaItem {
  id: number;
  url: string;
  original_name?: string;
  mime_type?: string;
  alt_text?: string;
  width?: number;
  height?: number;
}

export async function listMedia(opts: { search?: string; mime?: string; perPage?: number } = {}): Promise<MediaItem[]> {
  const qs = new URLSearchParams();
  qs.set("per_page", String(opts.perPage ?? 50));
  if (opts.search) qs.set("search", opts.search);
  if (opts.mime) qs.set("mime_type", opts.mime);
  const env = await api<ApiEnvelope<MediaItem[]>>(`/admin/api/ext/media-manager/?${qs.toString()}`);
  return env.data ?? [];
}

export interface NodeSummary {
  id: number;
  title: string;
  slug: string;
  node_type: string;
  full_url?: string;
  status?: string;
  /** Raw featured_image JSON: an {url, alt} object or a bare URL string. */
  featured_image?: unknown;
}

/** Best-effort thumbnail URL from a node's featured_image payload. */
export function nodeThumb(img: unknown): string {
  // theme-asset:<key> refs only resolve server-side at render time.
  if (typeof img === "string") return img.startsWith("theme-asset:") ? "" : img;
  if (img && typeof img === "object" && typeof (img as { url?: unknown }).url === "string") {
    return (img as { url: string }).url;
  }
  return "";
}

export async function searchNodes(opts: { search?: string; nodeType?: string; limit?: number } = {}): Promise<NodeSummary[]> {
  const qs = new URLSearchParams();
  qs.set("limit", String(opts.limit ?? 25));
  if (opts.search) qs.set("q", opts.search);
  if (opts.nodeType) qs.set("node_type", opts.nodeType);
  const env = await api<ApiEnvelope<NodeSummary[]>>(`/admin/api/nodes/search?${qs.toString()}`);
  return env.data ?? [];
}

export interface TermSummary {
  id: number;
  slug: string;
  name: string;
  taxonomy?: string;
  node_type?: string;
}

export async function listTerms(nodeType: string, taxonomy: string, opts: { search?: string; perPage?: number } = {}): Promise<TermSummary[]> {
  const qs = new URLSearchParams();
  qs.set("per_page", String(opts.perPage ?? 100));
  if (opts.search) qs.set("search", opts.search);
  const env = await api<ApiEnvelope<TermSummary[]>>(
    `/admin/api/terms/${encodeURIComponent(nodeType)}/${encodeURIComponent(taxonomy)}?${qs.toString()}`,
  );
  return env.data ?? [];
}

// --- Icons (kernel-bundled sets, GET /admin/api/icons) ----------------------

export interface IconProvider {
  id: string;
  label: string;
  count: number;
}

export interface IconItem {
  provider: string;
  name: string;
  /** "provider:name" — the stored field value */
  value: string;
  /** complete inline <svg> markup generated by the kernel from its
   *  embedded icon sets (never user input) */
  svg: string;
}

export async function getIconProviders(): Promise<IconProvider[]> {
  const env = await api<ApiEnvelope<{ providers: IconProvider[] }>>("/admin/api/icons");
  return env.data?.providers ?? [];
}

export async function searchIcons(provider: string, q: string, page: number, perPage = 96): Promise<{ icons: IconItem[]; total: number }> {
  const qs = new URLSearchParams({ provider, page: String(page), per_page: String(perPage) });
  if (q) qs.set("q", q);
  const env = await api<ApiEnvelope<{ icons: IconItem[]; total: number }>>(`/admin/api/icons?${qs.toString()}`);
  return { icons: env.data?.icons ?? [], total: env.data?.total ?? 0 };
}

/** Resolves stored icon values (bare names resolve to material). Unknown
 *  values are omitted from the result. The endpoint takes 50 at a time. */
export async function lookupIcons(values: string[]): Promise<IconItem[]> {
  const out: IconItem[] = [];
  for (let i = 0; i < values.length; i += 50) {
    const chunk = values.slice(i, i + 50);
    const qs = new URLSearchParams({ values: chunk.join(",") });
    const env = await api<ApiEnvelope<{ icons: IconItem[] }>>(`/admin/api/icons?${qs.toString()}`);
    out.push(...(env.data?.icons ?? []));
  }
  return out;
}

/** Admin editor URL for a node — mirrors nodeEditorURL in the kernel's
 *  admin_bar.go and the routes in admin-ui/src/App.tsx. */
export function adminEditURL(nodeType: string, id: number): string {
  if (nodeType === "page") return `/admin/pages/${id}/edit`;
  if (nodeType === "post") return `/admin/posts/${id}/edit`;
  return `/admin/content/${encodeURIComponent(nodeType)}/${id}/edit`;
}
