import { useEffect, useRef, useState, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Save, Loader2, Eye } from "@squilla/icons";
import {
  Button,
  Input,
  Label,
  Textarea,
  Titlebar,
  SidebarCard,
  PublishActions,
  TabsCard,
  MetaRow,
  MetaList,
  LanguagePicker,
  CodeEditor,
} from "@squilla/ui";
import { toast } from "sonner";
import {
  getEmailTemplate,
  createEmailTemplate,
  updateEmailTemplate,
  getLanguages,
} from "@squilla/api";

interface EmailTemplate {
  id: number;
  slug: string;
  name: string;
  language_id: number | null;
  subject_template: string;
  body_template: string;
  test_data: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

interface Language {
  id: number;
  code: string;
  name: string;
  flag: string;
}

const UNIVERSAL_CODE = "__universal__";

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function resolvePath(data: Record<string, any>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc === null || acc === undefined) return undefined;
    return (acc as Record<string, unknown>)[key];
  }, data);
}

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

function renderPreview(bodyTemplate: string, testData: Record<string, any>): string {
  return bodyTemplate.replace(
    /\{\{\s*\.([\w.]+)(?:\s*\|\s*(?:raw|safeHTML|safeURL))?\s*\}\}/g,
    (_match: string, path: string) => {
      const value = resolvePath(testData, path);
      return value !== undefined && value !== null ? String(value) : `{{.${path}}}`;
    },
  );
}

export default function EmailTemplateEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id && id !== "new";

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const [languages, setLanguages] = useState<Language[]>([]);
  const [baseLayout, setBaseLayout] = useState("");
  const [original, setOriginal] = useState<EmailTemplate | null>(null);

  // Form state
  const [formSlug, setFormSlug] = useState("");
  const [formName, setFormName] = useState("");
  const [formLanguageCode, setFormLanguageCode] = useState<string>(UNIVERSAL_CODE);
  const [formSubject, setFormSubject] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formTestData, setFormTestData] = useState("{}");

  const [autoSlug, setAutoSlug] = useState(!isEdit);

  // The languages prop for LanguagePicker. Includes a synthetic "Universal"
  // entry so operators can fall back to the language-agnostic template.
  const languageOptions: Language[] = [
    { id: 0, code: UNIVERSAL_CODE, name: "Universal (fallback)", flag: "" },
    ...languages,
  ];

  useEffect(() => {
    let cancelled = false;
    getLanguages()
      .then((langs: Language[]) => {
        if (!cancelled) setLanguages(langs);
      })
      .catch(() => {});
    fetch("/admin/api/ext/email-manager/layouts", { credentials: "include" })
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        const layouts = json.data || [];
        const universal = layouts.find((l: any) => l.language_id === null);
        if (universal) {
          if (universal.body_template) {
            setBaseLayout(universal.body_template);
          } else {
            fetch(`/admin/api/ext/email-manager/layouts/${universal.id}`, {
              credentials: "include",
            })
              .then((r) => r.json())
              .then((j) => {
                if (!cancelled && j.data?.body_template) setBaseLayout(j.data.body_template);
              })
              .catch(() => {});
          }
        }
      })
      .catch(() => {});

    if (!isEdit) return;
    setLoading(true);
    getEmailTemplate(Number(id))
      .then((tpl: EmailTemplate) => {
        if (cancelled) return;
        setOriginal(tpl);
        setFormSlug(tpl.slug || "");
        setFormName(tpl.name || "");
        // Resolve numeric language_id back to a code. We do this via the
        // languages array once it loads — but we already have language_id
        // here, so cache it and resolve in a separate effect below.
        setFormLanguageCode(tpl.language_id ? `__id_${tpl.language_id}` : UNIVERSAL_CODE);
        setFormSubject(tpl.subject_template || "");
        setFormBody(tpl.body_template || "");
        let td = tpl.test_data;
        if (typeof td === "string") {
          try {
            td = JSON.parse(td);
          } catch {
            td = {};
          }
        }
        setFormTestData(JSON.stringify(td || {}, null, 2));
      })
      .catch(() => {
        toast.error("Failed to load email template");
        navigate("/admin/ext/email-manager/templates", { replace: true });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, isEdit, navigate]);

  // Once languages have loaded, resolve any pending `__id_N` placeholder set
  // during initial load into a proper code. Necessary because the template
  // GET fires before getLanguages resolves.
  useEffect(() => {
    if (!formLanguageCode.startsWith("__id_") || languages.length === 0) return;
    const numId = Number(formLanguageCode.slice("__id_".length));
    const lang = languages.find((l) => l.id === numId);
    setFormLanguageCode(lang ? lang.code : UNIVERSAL_CODE);
  }, [languages, formLanguageCode]);

  function handleNameChange(val: string): void {
    setFormName(val);
    if (autoSlug) setFormSlug(slugify(val));
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();

    if (!formSlug.trim() || !formName.trim()) {
      toast.error("Slug and name are required");
      return;
    }

    if (!formSubject.trim()) {
      toast.error("Subject template is required");
      return;
    }

    let testData: Record<string, any> = {};
    try {
      testData = JSON.parse(formTestData);
    } catch {
      toast.error("Test data must be valid JSON");
      return;
    }

    // Map code back to language_id for the API.
    let languageId: number | null = null;
    if (formLanguageCode !== UNIVERSAL_CODE && !formLanguageCode.startsWith("__id_")) {
      const lang = languages.find((l) => l.code === formLanguageCode);
      languageId = lang ? lang.id : null;
    }

    const data: Partial<EmailTemplate> & { language_id?: number | null } = {
      slug: formSlug.trim(),
      name: formName.trim(),
      language_id: languageId,
      subject_template: formSubject,
      body_template: formBody,
      test_data: testData,
    };

    setSaving(true);
    try {
      if (isEdit) {
        await updateEmailTemplate(Number(id), data);
        toast.success("Email template updated successfully");
      } else {
        const created = await createEmailTemplate(data);
        toast.success("Email template created successfully");
        navigate(`/admin/ext/email-manager/templates/${created.id}`, { replace: true });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save email template";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  function getPreviewHtml(): string {
    try {
      const testData = JSON.parse(formTestData);
      const body = renderPreview(formBody, testData);
      if (baseLayout) {
        const wrapped = baseLayout.replace(/\{\{\s*\.email_body\s*\}\}/g, body);
        return renderPreview(wrapped, testData);
      }
      return body;
    } catch {
      return formBody;
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--accent-strong)" }} />
      </div>
    );
  }

  const contentTab = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="tpl-subject" className="text-sm font-medium text-foreground">
          Subject Template
        </Label>
        <Input
          id="tpl-subject"
          placeholder="e.g. Welcome to {{.site_name}}"
          value={formSubject}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormSubject(e.target.value)}
          className="rounded-lg border-border"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">Body Template</Label>
        <CodeEditor
          value={formBody}
          onChange={setFormBody}
          height="400px"
          placeholder={
            '<div style="font-family: sans-serif;">\n  <h2>Hello {{.user_full_name}}</h2>\n  <p>Welcome to {{.site_name}}</p>\n</div>'
          }
        />
      </div>
    </div>
  );

  const testDataTab = (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">Test Data (JSON)</Label>
      <Textarea
        value={formTestData}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormTestData(e.target.value)}
        className="min-h-[300px] font-mono text-sm rounded-lg border-border"
        placeholder='{"user_full_name": "John", "site_name": "My Site"}'
      />
      <p className="text-[11px]" style={{ color: "var(--fg-subtle)" }}>
        Sample data used for the preview tab. Must be valid JSON.
      </p>
    </div>
  );

  const previewTab = (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm" style={{ color: "var(--fg-muted)" }}>
        <Eye className="h-4 w-4" />
        Rendered using the active universal base layout and your test data.
      </div>
      <div
        className="rounded-lg border bg-card overflow-auto"
        style={{ height: 500, borderColor: "var(--border-input)" }}
      >
        <PreviewIframe html={getPreviewHtml()} title="Email Preview" />
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSave} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      {/* Main column */}
      <div className="space-y-4 min-w-0">
        <Titlebar
          title={formName}
          onTitleChange={handleNameChange}
          titleLabel="Name"
          titlePlaceholder="e.g. Welcome Email"
          slug={formSlug}
          onSlugChange={(v: string) => {
            setAutoSlug(false);
            setFormSlug(slugify(v));
          }}
          slugPrefix=""
          autoSlug={autoSlug}
          onAutoSlugToggle={() => setAutoSlug(!autoSlug)}
          id={isEdit && id ? Number(id) : undefined}
          onBack={() => navigate("/admin/ext/email-manager/templates")}
        />

        <TabsCard
          tabs={[
            { value: "content", label: "Content", content: contentTab },
            { value: "test-data", label: "Test Data", content: testDataTab },
            { value: "preview", label: "Preview", content: previewTab },
          ]}
        />
      </div>

      {/* Sidebar */}
      <aside className="lg:sticky lg:top-4 lg:self-start">
        <SidebarCard title="Publish">
          <LanguagePicker
            languages={languageOptions}
            value={
              formLanguageCode.startsWith("__id_") ? UNIVERSAL_CODE : formLanguageCode
            }
            onChange={setFormLanguageCode}
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
          </PublishActions>

          {isEdit && original && (original.created_at || original.updated_at) && (
            <MetaList>
              {original.created_at && (
                <MetaRow
                  label="Created"
                  value={new Date(original.created_at).toLocaleDateString("en-GB")}
                />
              )}
              {original.updated_at && (
                <MetaRow
                  label="Updated"
                  value={new Date(original.updated_at).toLocaleDateString("en-GB")}
                />
              )}
            </MetaList>
          )}
        </SidebarCard>
      </aside>
    </form>
  );
}
