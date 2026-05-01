import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Mail, Globe } from "@squilla/icons";
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
  TitleCell,
  Chip,
  RowActions,
  EmptyState,
  LoadingRow,
  ListFooter,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@squilla/ui";
import { toast } from "sonner";
import { deleteEmailTemplate, getLanguages } from "@squilla/api";

interface EmailTemplate {
  id: number;
  slug: string;
  name: string;
  language_id: number | null;
  subject_template: string;
  body_template: string;
  test_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface Language {
  id: number;
  code: string;
  name: string;
  flag: string;
}

interface TemplateListMeta {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  total_all?: number;
}

async function fetchTemplateList(qs: URLSearchParams): Promise<{ data: EmailTemplate[]; meta: TemplateListMeta }> {
  const url = `/admin/api/ext/email-manager/templates${qs.toString() ? `?${qs.toString()}` : ""}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load templates");
  return res.json();
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB");
}

export default function EmailTemplates() {
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

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAll, setTotalAll] = useState(0);

  const [showDelete, setShowDelete] = useState(false);
  const [deletingTemplate, setDeletingTemplate] = useState<EmailTemplate | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function fetchTemplates() {
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
      const res = await fetchTemplateList(qs);
      setTemplates(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.total_pages);
      setTotalAll(res.meta.total_all ?? res.meta.total);
    } catch {
      toast.error("Failed to load email templates");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage, urlSearch, filterLanguage, sortBy, sortOrder]);

  useEffect(() => {
    getLanguages(true)
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
  function setPage(next: number) {
    setSearchParams((prev: URLSearchParams) => {
      if (next <= 1) prev.delete("page");
      else prev.set("page", String(next));
      return prev;
    });
  }
  function setPerPage(next: number) {
    setSearchParams((prev: URLSearchParams) => {
      if (next === 25) prev.delete("per_page");
      else prev.set("per_page", String(next));
      prev.delete("page");
      return prev;
    });
  }

  function openDeleteDialog(tpl: EmailTemplate) {
    setDeletingTemplate(tpl);
    setShowDelete(true);
  }

  async function handleDelete() {
    if (!deletingTemplate) return;
    setDeleting(true);
    try {
      await deleteEmailTemplate(deletingTemplate.id);
      toast.success("Email template deleted successfully");
      setShowDelete(false);
      setDeletingTemplate(null);
      await fetchTemplates();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete email template";
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  }

  function languageChip(languageId: number | null) {
    if (languageId == null) {
      return (
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <Globe className="h-3.5 w-3.5" />
          Universal
        </span>
      );
    }
    const lang = languages.find((l) => l.id === languageId);
    if (!lang) return <Chip>#{languageId}</Chip>;
    return <Chip>{lang.flag ? `${lang.flag} ${lang.name}` : lang.name}</Chip>;
  }

  return (
    <ListPageShell>
      <ListHeader
        title="Email Templates"
        tabs={[{ value: "all", label: "All", count: totalAll }]}
        activeTab="all"
        newLabel="Add Template"
        newHref="/admin/ext/email-manager/templates/new"
      />

      <ListToolbar>
        <ListSearch
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Search templates…"
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
        ) : templates.length === 0 ? (
          <EmptyState
            icon={Mail}
            title="No email templates found"
            description={urlSearch || filterLanguage !== "all" ? "Try a different search or filter." : 'Click "Add Template" to get started.'}
          />
        ) : (
          <ListTable>
            <thead>
              <tr>
                <SortableTh column="name" sortBy={sortBy} sortOrder={sortOrder} onSort={setSort} defaultOrder="asc">Name</SortableTh>
                <SortableTh column="slug" sortBy={sortBy} sortOrder={sortOrder} onSort={setSort} defaultOrder="asc" width={180}>Slug</SortableTh>
                <Th>Subject</Th>
                <Th width={180}>Language</Th>
                <SortableTh column="updated_at" sortBy={sortBy} sortOrder={sortOrder} onSort={setSort} defaultOrder="desc" width={130}>Updated</SortableTh>
                <Th width={90} align="right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {templates.map((tpl) => (
                <Tr key={tpl.id}>
                  <Td>
                    <TitleCell
                      to={`/admin/ext/email-manager/templates/${tpl.id}`}
                      title={tpl.name}
                    />
                  </Td>
                  <Td className="font-mono text-[12px] text-foreground">{tpl.slug}</Td>
                  <Td className="text-muted-foreground max-w-xs truncate">
                    {tpl.subject_template}
                  </Td>
                  <Td>{languageChip(tpl.language_id)}</Td>
                  <Td className="font-mono text-[12px] text-muted-foreground tabular-nums">
                    {formatDate(tpl.updated_at)}
                  </Td>
                  <Td align="right" className="whitespace-nowrap">
                    <RowActions
                      editTo={`/admin/ext/email-manager/templates/${tpl.id}`}
                      onDelete={() => openDeleteDialog(tpl)}
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
        onPage={setPage}
        onPerPage={setPerPage}
        label="templates"
      />

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Email Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deletingTemplate?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ListPageShell>
  );
}
