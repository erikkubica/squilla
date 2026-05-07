import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Save, Eye, Trash2, Globe, RotateCcw, Mail, Loader2 } from "@squilla/icons";
import {
  ListPageShell,
  ListHeader,
  ListToolbar,
  ListSearch,
  ListCard,
  ListTable,
  Th,
  SortableTh,
  Tr,
  Td,
  Chip,
  RowActions,
  EmptyState,
  LoadingRow,
  ListFooter,
  Button,
  Label,
  Titlebar,
  SidebarCard,
  PublishActions,
  TabsCard,
  MetaRow,
  MetaList,
  LanguagePicker,
  CodeEditor,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@squilla/ui";
import { toast } from "sonner";
import { getLanguages } from "@squilla/api";

interface EmailLayout {
  id: number;
  name: string;
  language_id: number | null;
  body_template: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface Language {
  id: number;
  code: string;
  name: string;
  flag: string;
}

const API_BASE = "/admin/api/ext/email-manager";

interface LayoutListMeta {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  total_all?: number;
}

async function fetchLayoutList(qs: URLSearchParams): Promise<{ data: EmailLayout[]; meta: LayoutListMeta }> {
  const url = `${API_BASE}/layouts${qs.toString() ? `?${qs.toString()}` : ""}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch layouts");
  return res.json();
}

async function fetchLayout(id: number): Promise<EmailLayout> {
  const res = await fetch(`${API_BASE}/layouts/${id}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch layout");
  const json = await res.json();
  return json.data;
}

async function saveLayout(id: number | null, data: Partial<EmailLayout>): Promise<EmailLayout> {
  const url = id ? `${API_BASE}/layouts/${id}` : `${API_BASE}/layouts`;
  const method = id ? "PUT" : "POST";
  const res = await fetch(url, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || "Failed to save layout");
  }
  const json = await res.json();
  return json.data;
}

async function deleteLayout(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/layouts/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete layout");
}

const DEFAULT_LAYOUT = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=0" />
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9; padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; border-radius:12px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color:#2563eb; padding:24px 32px; text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:22px; font-weight:600; letter-spacing:-0.02em;">{{.site.site_name}}</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="background-color:#ffffff; padding:32px;">
              {{.email_body}}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc; padding:20px 32px; text-align:center; border-top:1px solid #e2e8f0;">
              <p style="margin:0; color:#94a3b8; font-size:13px;">&copy; {{.site.site_name}}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const SAMPLE_EMAIL_BODY = `<h2 style="margin:0 0 16px; color:#1e293b; font-size:20px;">Welcome!</h2>
<p style="margin:0 0 12px; color:#475569; font-size:15px; line-height:1.6;">
  This is a sample email body that will replace <code>{{.email_body}}</code> in the layout.
</p>
<p style="margin:0; color:#475569; font-size:15px; line-height:1.6;">
  Use base layouts to wrap all outgoing emails with consistent branding.
</p>`;

// PreviewIframe writes the HTML via contentWindow.document instead of the
// `srcDoc` attribute. Chromium has a long-standing rendering glitch where
// `srcDoc` content loads in the DOM but never paints (the document exists
// but is detached from the compositor) when combined with a strict
// `sandbox=""`. document.write() puts us on a code path that always paints.
function PreviewIframe({ html, title }: { html: string; title: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const win = ref.current?.contentWindow;
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
  }, [html]);
  return <iframe ref={ref} title={title} className="w-full h-full border-0" />;
}

export default function EmailBaseLayout() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const perPage = Math.max(1, Math.min(100, Number(searchParams.get("per_page") || "25")));
  const urlSearch = searchParams.get("search") || "";
  const filterLanguage = searchParams.get("language") || "all";
  const sortBy = searchParams.get("sort") || "";
  const sortOrder = (searchParams.get("order") as "asc" | "desc") || "asc";

  const [searchInput, setSearchInput] = useState(urlSearch);
  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput === (searchParams.get("search") || "")) return;
      setSearchParams((prev: URLSearchParams) => {
        if (searchInput) prev.set("search", searchInput);
        else prev.delete("search");
        prev.delete("page");
        return prev;
      });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const [layouts, setLayouts] = useState<EmailLayout[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAll, setTotalAll] = useState(0);

  // Editor state
  const [editing, setEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formLanguageId, setFormLanguageId] = useState<string>("__universal__");
  const [formBody, setFormBody] = useState("");
  const [formTestData, setFormTestData] = useState<string>(
    JSON.stringify(
      {
        site: { site_name: "My Site", site_url: "#" },
        user: { full_name: "Jane Doe", email: "jane@example.com" },
        recipient: { full_name: "Jane Doe", email: "jane@example.com" },
      },
      null,
      2,
    ),
  );

  async function loadLayouts() {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (urlSearch) qs.set("search", urlSearch);
      if (filterLanguage && filterLanguage !== "all") qs.set("language", filterLanguage);
      if (sortBy) {
        qs.set("sort", sortBy);
        qs.set("order", sortOrder);
      }
      qs.set("page", String(page));
      qs.set("per_page", String(perPage));
      const res = await fetchLayoutList(qs);
      setLayouts(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.total_pages);
      setTotalAll(res.meta.total_all ?? res.meta.total);
    } catch {
      toast.error("Failed to load base layouts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLayouts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage, urlSearch, filterLanguage, sortBy, sortOrder]);

  useEffect(() => {
    getLanguages()
      .then((langs: Language[]) => setLanguages(langs))
      .catch(() => {});
  }, []);

  function setLanguageFilter(next: string) {
    setSearchParams((prev: URLSearchParams) => {
      if (!next || next === "all") prev.delete("language");
      else prev.set("language", next);
      prev.delete("page");
      return prev;
    });
  }
  function setSort(col: string, order: "asc" | "desc") {
    setSearchParams((prev: URLSearchParams) => {
      prev.set("sort", col);
      prev.set("order", order);
      prev.delete("page");
      return prev;
    });
  }
  function setPageNum(next: number) {
    setSearchParams((prev: URLSearchParams) => {
      if (next <= 1) prev.delete("page");
      else prev.set("page", String(next));
      return prev;
    });
  }
  function setPerPageNum(next: number) {
    setSearchParams((prev: URLSearchParams) => {
      if (next === 25) prev.delete("per_page");
      else prev.set("per_page", String(next));
      prev.delete("page");
      return prev;
    });
  }

  async function openEditor(layout?: EmailLayout) {
    if (layout) {
      setEditId(layout.id);
      setFormName(layout.name || "");
      setFormLanguageId(layout.language_id ? String(layout.language_id) : "__universal__");
      setEditing(true);
      // Fetch full layout with body_template (stripped from list response).
      try {
        const full = await fetchLayout(layout.id);
        setFormBody(full.body_template || "");
      } catch {
        setFormBody("");
        toast.error("Failed to load layout body");
      }
    } else {
      setEditId(null);
      setFormName("");
      setFormLanguageId("__universal__");
      setFormBody(DEFAULT_LAYOUT);
      setEditing(true);
    }
  }

  function closeEditor() {
    setEditing(false);
    setEditId(null);
    setFormName("");
    setFormLanguageId("__universal__");
    setFormBody("");
  }

  async function handleSave() {
    if (!formName.trim()) {
      toast.error("Name is required");
      return;
    }

    setSaving(true);
    try {
      const data: Partial<EmailLayout> = {
        name: formName.trim(),
        language_id: formLanguageId === "__universal__" ? null : Number(formLanguageId),
        body_template: formBody,
      };
      await saveLayout(editId, data);
      toast.success(editId ? "Layout updated successfully" : "Layout created successfully");
      closeEditor();
      await loadLayouts();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save layout";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(layout: EmailLayout) {
    if (layout.is_default) return;
    if (!confirm(`Delete layout "${layout.name}"? This action cannot be undone.`)) return;
    try {
      await deleteLayout(layout.id);
      toast.success("Layout deleted successfully");
      if (editing && editId === layout.id) {
        closeEditor();
      }
      await loadLayouts();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete layout";
      toast.error(message);
    }
  }

  function getPreviewHtml(): string {
    let parsed: Record<string, any> = {};
    try {
      parsed = JSON.parse(formTestData);
    } catch {
      parsed = {};
    }
    const sampleData: Record<string, any> = {
      email_body: SAMPLE_EMAIL_BODY,
      site: { name: "My Site", url: "#", site_name: "My Site", site_url: "#" },
      user: { full_name: "Jane Doe", name: "Jane Doe", email: "jane@example.com" },
      recipient: { full_name: "Jane Doe", name: "Jane Doe", email: "jane@example.com" },
      ...parsed,
    };
    return formBody.replace(
      /\{\{\s*\.([\w.]+)(?:\s*\|\s*(?:raw|safeHTML|safeURL))?\s*\}\}/g,
      (_match, path: string) => {
        const value = path
          .split(".")
          .reduce<unknown>((acc, key) => (acc == null ? undefined : (acc as Record<string, unknown>)[key]), sampleData);
        return value !== undefined && value !== null ? String(value) : `{{.${path}}}`;
      },
    );
  }

  function formatDate(dateStr: string): string {
    try {
      return new Date(dateStr).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  }

  function getLanguageText(languageId: number | null): string {
    if (!languageId) return "Universal";
    const lang = languages.find((l) => l.id === languageId);
    if (!lang) return "Unknown";
    return `${lang.flag} ${lang.name}`;
  }

  // --- Editor View ---
  if (editing) {
    const currentLayout = editId ? layouts.find((l) => l.id === editId) : null;
    const isDefault = !!currentLayout?.is_default;

    // Convert the legacy numeric language_id state into the string code that
    // LanguagePicker expects, with a synthetic "Universal" entry as fallback.
    const universalCode = "__universal__";
    const languageOptions = [
      { id: 0, code: universalCode, name: "Universal (fallback)", flag: "" },
      ...languages,
    ];
    const currentCode =
      formLanguageId === universalCode
        ? universalCode
        : languages.find((l) => String(l.id) === formLanguageId)?.code || universalCode;

    function setLanguageByCode(code: string): void {
      if (code === universalCode) {
        setFormLanguageId(universalCode);
        return;
      }
      const lang = languages.find((l) => l.code === code);
      setFormLanguageId(lang ? String(lang.id) : universalCode);
    }

    const layoutTab = (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-foreground">Body Template</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setFormBody(DEFAULT_LAYOUT)}
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Reset to Default
          </Button>
        </div>
        <CodeEditor
          value={formBody}
          onChange={setFormBody}
          height="500px"
          placeholder="<!DOCTYPE html>..."
        />
        <p className="text-[11px]" style={{ color: "var(--fg-subtle)" }}>
          The wrapper HTML applied to all outgoing emails. Use{" "}
          <code>{"{{.email_body}}"}</code> as the slot for the rendered template body.
        </p>
      </div>
    );

    const testDataTab = (
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">Test Data (JSON)</Label>
        <Textarea
          value={formTestData}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormTestData(e.target.value)}
          className="min-h-[300px] font-mono text-sm rounded-lg border-border"
          placeholder='{"site": {"site_name": "My Site"}}'
        />
        <p className="text-[11px]" style={{ color: "var(--fg-subtle)" }}>
          Sample variables used for the preview tab. Must be valid JSON.
        </p>
      </div>
    );

    const previewTab = (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--fg-muted)" }}>
          <Eye className="h-4 w-4" />
          Renders the layout with a sample body and your test data.
        </div>
        <div
          className="rounded-lg border bg-card overflow-auto"
          style={{ height: 500, borderColor: "var(--border-input)" }}
        >
          <PreviewIframe html={getPreviewHtml()} title="Layout Preview" />
        </div>
      </div>
    );

    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]"
      >
        {/* Main column */}
        <div className="space-y-4 min-w-0">
          <Titlebar
            title={formName}
            onTitleChange={setFormName}
            titleLabel="Name"
            titlePlaceholder="e.g. Default Layout"
            id={editId ?? undefined}
            onBack={closeEditor}
          />

          <TabsCard
            tabs={[
              { value: "layout", label: "Layout", content: layoutTab },
              { value: "test-data", label: "Test Data", content: testDataTab },
              { value: "preview", label: "Preview", content: previewTab },
            ]}
          />
        </div>

        {/* Sidebar */}
        <aside className="lg:sticky lg:self-start">
          <SidebarCard title="Publish">
            {isDefault && (
              <div
                className="rounded-md px-3 py-2 text-xs"
                style={{ background: "var(--accent-weak)", color: "var(--accent-strong)" }}
              >
                Default layout — cannot be deleted.
              </div>
            )}

            <LanguagePicker
              languages={languageOptions}
              value={currentCode}
              onChange={setLanguageByCode}
            />

            <PublishActions>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                )}
                {saving ? "Saving..." : "Save"}
              </Button>
              {editId && currentLayout && !isDefault && (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  style={{ color: "var(--danger)" }}
                  onClick={() => handleDelete(currentLayout)}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Delete
                </Button>
              )}
            </PublishActions>

            {editId && currentLayout && (currentLayout.created_at || currentLayout.updated_at) && (
              <MetaList>
                {currentLayout.created_at && (
                  <MetaRow
                    label="Created"
                    value={new Date(currentLayout.created_at).toLocaleDateString("en-GB")}
                  />
                )}
                {currentLayout.updated_at && (
                  <MetaRow
                    label="Updated"
                    value={new Date(currentLayout.updated_at).toLocaleDateString("en-GB")}
                  />
                )}
              </MetaList>
            )}
          </SidebarCard>
        </aside>
      </form>
    );
  }

  // --- List View ---
  return (
    <ListPageShell>
      <ListHeader
        title="Base Layouts"
        description="HTML wrappers applied to outgoing emails. The universal layout is used as fallback when no language-specific layout exists."
        tabs={[{ value: "all", label: "All", count: totalAll }]}
        activeTab="all"
        newLabel="New Layout"
        onNew={() => openEditor()}
      />

      <ListToolbar>
        <ListSearch
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Search layouts…"
        />
        <Select value={filterLanguage} onValueChange={setLanguageFilter}>
          <SelectTrigger className="w-[180px] rounded-lg border-border h-9">
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All languages</SelectItem>
            <SelectItem value="__universal__">Universal</SelectItem>
            {languages.map((l) => (
              <SelectItem key={l.code} value={l.code}>
                {l.flag ? `${l.flag} ${l.name}` : l.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </ListToolbar>

      <ListCard>
        {loading ? (
          <LoadingRow />
        ) : layouts.length === 0 ? (
          <EmptyState
            icon={Mail}
            title="No base layouts found"
            description={urlSearch || filterLanguage !== "all" ? "Try a different search or filter." : 'Click "New Layout" to get started.'}
          />
        ) : (
          <ListTable>
            <thead>
              <tr>
                <SortableTh column="name" sortBy={sortBy} sortOrder={sortOrder} onSort={setSort} defaultOrder="asc">Name</SortableTh>
                <Th width={200}>Language</Th>
                <SortableTh column="created_at" sortBy={sortBy} sortOrder={sortOrder} onSort={setSort} defaultOrder="desc" width={130}>Created</SortableTh>
                <SortableTh column="updated_at" sortBy={sortBy} sortOrder={sortOrder} onSort={setSort} defaultOrder="desc" width={130}>Updated</SortableTh>
                <Th width={90} align="right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {layouts.map((layout) => (
                <Tr key={layout.id}>
                  <Td>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditor(layout)}
                        className="cursor-pointer text-left truncate"
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: "var(--fg)",
                          letterSpacing: "-0.005em",
                          transition: "color 100ms",
                          background: "transparent",
                          border: "none",
                          padding: 0,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-strong)")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg)")}
                      >
                        {layout.name}
                      </button>
                      {layout.is_default && <Chip>Default</Chip>}
                    </div>
                  </Td>
                  <Td>
                    {layout.language_id ? (
                      <Chip>{getLanguageText(layout.language_id)}</Chip>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <Globe className="h-3.5 w-3.5" />
                        Universal
                      </span>
                    )}
                  </Td>
                  <Td className="font-mono text-[12px] text-muted-foreground">
                    {formatDate(layout.created_at)}
                  </Td>
                  <Td className="font-mono text-[12px] text-muted-foreground">
                    {formatDate(layout.updated_at)}
                  </Td>
                  <Td align="right" className="whitespace-nowrap">
                    <RowActions
                      onEdit={() => openEditor(layout)}
                      onDelete={layout.is_default ? undefined : () => handleDelete(layout)}
                      disableDelete={layout.is_default}
                    />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </ListTable>
        )}
      </ListCard>

      <ListFooter
        page={page}
        totalPages={totalPages}
        total={total}
        perPage={perPage}
        onPage={setPageNum}
        onPerPage={setPerPageNum}
        label="layouts"
      />
    </ListPageShell>
  );
}
