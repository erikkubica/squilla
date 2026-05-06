// Thin API client for the editor. Reuses the admin SPA's endpoints
// — the session cookie is `Path=/`, SameSite=Strict, and CSRF is
// enforced by the JSONOnlyMutations middleware — so there's no new
// auth surface here.

export interface BlockField {
  name: string;
  title?: string;
  type: string;
  required?: boolean;
  description?: string;
  initialValue?: unknown;
  fields?: BlockField[];
  options?: Array<{ value: string; label: string }>;
}

export interface BlockType {
  id: number;
  slug: string;
  /** Display name of the block. The kernel returns this as `label`,
   *  not `name` — typing it as both ways for safety. */
  label?: string;
  name?: string;
  /** The kernel's GET /admin/api/block-types returns the field
   *  schema under the JSON key `fields` (the Go column name), not
   *  `field_schema`. We accept either to remain forward-compatible. */
  fields?: BlockField[];
  field_schema?: BlockField[];
  html_template: string;
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
      const body = (await res.json()) as ApiEnvelope<unknown>;
      if (body?.error?.message) msg = body.error.message;
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
  return env.data;
}

/** Fetch full block-type record by id. The list endpoint strips
 *  `html_template` for payload size; live preview needs it, so we
 *  lazy-load by id when first rendering a block's preview. */
export async function getBlockType(id: number): Promise<BlockType> {
  const env = await api<ApiEnvelope<BlockType>>(`/admin/api/block-types/${id}`);
  return env.data;
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

interface PreviewResponse {
  html: string;
  head?: string;
  body_class?: string;
}

/**
 * Render a single block's template against the supplied field values.
 * Reuses the existing /admin/api/block-types/preview endpoint that
 * powers the admin SPA's block-template editor — same execution path,
 * same FuncMap, no new server-side surface.
 *
 * Returns just the HTML string. Caller is responsible for splicing
 * it into the DOM (use replaceBlockRange in blockIndex.ts).
 */
export async function previewBlock(
  htmlTemplate: string,
  fields: Record<string, unknown>,
): Promise<string> {
  const res = await fetch("/admin/api/block-types/preview", {
    method: "POST",
    credentials: "same-origin",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ html_template: htmlTemplate, test_data: fields }),
  });
  if (!res.ok) throw new Error(`preview ${res.status}`);
  const body = (await res.json()) as PreviewResponse;
  return body.html ?? "";
}
