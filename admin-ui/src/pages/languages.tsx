import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  queryLanguages,
  createLanguage,
  updateLanguage,
  deleteLanguage,
  type Language,
} from "@/api/client";
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
  StatusPill,
  Chip,
  RowActions,
  EmptyState,
  LoadingRow,
  ListFooter,
} from "@/components/ui/list-page";

export default function LanguagesPage() {
  // URL is the source of truth for paginated state. Reload, deep-link, share —
  // all reproduce the exact view. Mirrors the pattern used by the SDUI node
  // listing.
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const perPage = Math.max(1, Math.min(200, Number(searchParams.get("per_page") || "25")));
  const urlSearch = searchParams.get("search") || "";
  const status = searchParams.get("status") || "all";
  const sortBy = searchParams.get("sort") || "";
  const sortOrder = (searchParams.get("order") as "asc" | "desc") || "asc";

  // Local search input is debounced into the URL so each keystroke doesn't
  // refetch.
  const [searchInput, setSearchInput] = useState(urlSearch);
  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput === (searchParams.get("search") || "")) return;
      setSearchParams((prev) => {
        if (searchInput) prev.set("search", searchInput);
        else prev.delete("search");
        prev.delete("page");
        return prev;
      });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const [languages, setLanguages] = useState<Language[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAll, setTotalAll] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showEditor, setShowEditor] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null);

  const [showDelete, setShowDelete] = useState(false);
  const [deletingLanguage, setDeletingLanguage] = useState<Language | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [formCode, setFormCode] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formName, setFormName] = useState("");
  const [formNativeName, setFormNativeName] = useState("");
  const [formFlag, setFormFlag] = useState("");
  const [formIsDefault, setFormIsDefault] = useState(false);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formHidePrefix, setFormHidePrefix] = useState(false);
  const [autoSlug, setAutoSlug] = useState(true);

  async function fetchLanguages() {
    setLoading(true);
    try {
      const res = await queryLanguages({
        page,
        perPage,
        search: urlSearch,
        status,
        sort: sortBy || undefined,
        order: sortBy ? sortOrder : undefined,
      });
      setLanguages(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.total_pages);
      setTotalAll(res.meta.total_all ?? res.meta.total);
      setActiveCount(res.meta.active_count ?? 0);
      setInactiveCount(res.meta.inactive_count ?? 0);
    } catch {
      toast.error("Failed to load languages");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLanguages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage, urlSearch, status, sortBy, sortOrder]);

  function openAddDialog() {
    setEditingLanguage(null);
    setFormCode("");
    setFormSlug("");
    setFormName("");
    setFormNativeName("");
    setFormFlag("");
    setFormIsDefault(false);
    setFormIsActive(true);
    setFormHidePrefix(false);
    setAutoSlug(true);
    setShowEditor(true);
  }

  function openEditDialog(lang: Language) {
    setEditingLanguage(lang);
    setFormCode(lang.code);
    setFormSlug(lang.slug);
    setFormName(lang.name);
    setFormNativeName(lang.native_name);
    setFormFlag(lang.flag);
    setFormIsDefault(lang.is_default);
    setFormIsActive(lang.is_active);
    setFormHidePrefix(lang.hide_prefix);
    setAutoSlug(false);
    setShowEditor(true);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();

    if (!formCode.trim() || !formName.trim()) {
      toast.error("Code and name are required");
      return;
    }

    const data: Partial<Language> = {
      code: formCode.trim().toLowerCase(),
      slug: (formSlug.trim() || formCode.trim()).toLowerCase(),
      name: formName.trim(),
      native_name: formNativeName.trim(),
      flag: formFlag.trim(),
      is_default: formIsDefault,
      is_active: formIsActive,
      hide_prefix: formHidePrefix,
    };

    setSaving(true);
    try {
      if (editingLanguage) {
        await updateLanguage(editingLanguage.id, data);
        toast.success("Language updated successfully");
      } else {
        await createLanguage(data);
        toast.success("Language created successfully");
      }
      setShowEditor(false);
      await fetchLanguages();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save language";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  function openDeleteDialog(lang: Language) {
    setDeletingLanguage(lang);
    setShowDelete(true);
  }

  async function handleDelete() {
    if (!deletingLanguage) return;
    setDeleting(true);
    try {
      await deleteLanguage(deletingLanguage.id);
      toast.success("Language deleted successfully");
      setShowDelete(false);
      setDeletingLanguage(null);
      await fetchLanguages();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete language";
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  }

  function setPage(next: number) {
    setSearchParams((prev) => {
      if (next <= 1) prev.delete("page");
      else prev.set("page", String(next));
      return prev;
    });
  }
  function setPerPage(next: number) {
    setSearchParams((prev) => {
      if (next === 25) prev.delete("per_page");
      else prev.set("per_page", String(next));
      prev.delete("page");
      return prev;
    });
  }
  function setStatusTab(next: string) {
    setSearchParams((prev) => {
      if (!next || next === "all") prev.delete("status");
      else prev.set("status", next);
      prev.delete("page");
      return prev;
    });
  }
  function setSort(col: string, order: "asc" | "desc") {
    setSearchParams((prev) => {
      prev.set("sort", col);
      prev.set("order", order);
      prev.delete("page");
      return prev;
    });
  }

  return (
    <ListPageShell>
      <ListHeader
        title="Languages"
        tabs={[
          { value: "all", label: "All", count: totalAll },
          { value: "active", label: "Active", count: activeCount },
          { value: "inactive", label: "Inactive", count: inactiveCount },
        ]}
        activeTab={status}
        onTabChange={setStatusTab}
        newLabel="Add Language"
        onNew={openAddDialog}
      />

      <ListToolbar>
        <ListSearch value={searchInput} onChange={setSearchInput} placeholder="Search languages…" />
      </ListToolbar>

      <ListCard>
        {loading ? (
          <LoadingRow />
        ) : languages.length === 0 ? (
          <EmptyState
            icon={Globe}
            title="No languages configured yet"
            description='Click "Add Language" to get started.'
          />
        ) : (
          <ListTable>
            <thead>
              <tr>
                <SortableTh column="name" sortBy={sortBy} sortOrder={sortOrder} onSort={setSort} defaultOrder="asc">Name</SortableTh>
                <Th>Native Name</Th>
                <Th width={110}>Slug</Th>
                <Th width={140}>URL</Th>
                <Th width={70} align="center">Flag</Th>
                <Th width={120}>Status</Th>
                <Th width={110} align="right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {languages.map((lang) => (
                <Tr key={lang.id}>
                  <Td>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditDialog(lang)}
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
                        {lang.name}
                      </button>
                      {lang.is_default && <Chip>Default</Chip>}
                      {lang.hide_prefix && <Chip>No prefix</Chip>}
                    </div>
                  </Td>
                  <Td className="text-muted-foreground">{lang.native_name}</Td>
                  <Td className="font-mono text-[12px] text-foreground">{lang.slug}</Td>
                  <Td className="font-mono text-[12px]" style={{ color: "var(--accent-strong)" }}>
                    {lang.hide_prefix ? "/" : `/${lang.slug}/`}
                  </Td>
                  <Td align="center" className="text-xl leading-none">{lang.flag}</Td>
                  <Td>
                    {lang.is_default ? (
                      <StatusPill status="success" label="default" />
                    ) : lang.is_active ? (
                      <StatusPill status="active" />
                    ) : (
                      <StatusPill status="inactive" />
                    )}
                  </Td>
                  <Td align="right" className="whitespace-nowrap">
                    <RowActions
                      onEdit={() => openEditDialog(lang)}
                      onDelete={lang.is_default ? undefined : () => openDeleteDialog(lang)}
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
        label="languages"
      />

      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLanguage ? "Edit Language" : "Add Language"}</DialogTitle>
            <DialogDescription>
              {editingLanguage
                ? "Update the language details below."
                : "Fill in the details for the new language."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="lang-code" className="text-sm font-medium text-foreground">
                  Code (ISO)
                </Label>
                <Input
                  id="lang-code"
                  placeholder="e.g. en, es, fr"
                  value={formCode}
                  onChange={(e) => {
                    setFormCode(e.target.value);
                    if (autoSlug) setFormSlug(e.target.value.toLowerCase());
                  }}
                  required
                  disabled={!!editingLanguage}
                  className="rounded-lg border-border focus:ring-2"
                />
                {editingLanguage && <p className="text-xs" style={{color: "var(--fg-subtle)"}}>Code cannot be changed</p>}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="lang-slug" className="text-sm font-medium text-foreground">
                    URL Slug
                  </Label>
                  {!editingLanguage && (
                    <button
                      type="button"
                      className="text-xs hover:underline" style={{color: "var(--accent-strong)"}}
                      onClick={() => setAutoSlug(!autoSlug)}
                    >
                      {autoSlug ? "Edit" : "Auto"}
                    </button>
                  )}
                </div>
                <Input
                  id="lang-slug"
                  placeholder="e.g. en, english, pt-br"
                  value={formSlug}
                  onChange={(e) => {
                    setAutoSlug(false);
                    setFormSlug(e.target.value);
                  }}
                  disabled={autoSlug && !editingLanguage}
                  required
                  className="rounded-lg border-border focus:ring-2"
                />
                <p className="text-xs" style={{color: "var(--fg-subtle)"}}>
                  Used in URLs: /{formSlug || formCode}/page-slug
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lang-flag" className="text-sm font-medium text-foreground">
                  Flag
                </Label>
                <Input
                  id="lang-flag"
                  placeholder="e.g. 🇺🇸, 🇪🇸"
                  value={formFlag}
                  onChange={(e) => setFormFlag(e.target.value)}
                  className="rounded-lg border-border focus:ring-2"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="lang-name" className="text-sm font-medium text-foreground">
                  Name
                </Label>
                <Input
                  id="lang-name"
                  placeholder="e.g. English"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  className="rounded-lg border-border focus:ring-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lang-native-name" className="text-sm font-medium text-foreground">
                  Native Name
                </Label>
                <Input
                  id="lang-native-name"
                  placeholder="e.g. English"
                  value={formNativeName}
                  onChange={(e) => setFormNativeName(e.target.value)}
                  className="rounded-lg border-border focus:ring-2"
                />
              </div>
            </div>

            <div className="flex items-center gap-6 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={formIsDefault} onCheckedChange={setFormIsDefault} />
                <span className="text-sm font-medium text-foreground">Default language</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
                <span className="text-sm font-medium text-foreground">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={formHidePrefix} onCheckedChange={setFormHidePrefix} />
                <span className="text-sm font-medium text-foreground">Hide URL prefix</span>
              </label>
            </div>
            {formHidePrefix && (
              <p className="text-xs rounded-lg px-3 py-2" style={{background: "var(--warning-bg)", color: "var(--warning)"}}>
                URLs for this language won't have a prefix:{" "}
                <span className="font-mono">/page-slug</span> instead of{" "}
                <span className="font-mono">/{formSlug || formCode}/page-slug</span>. Typically used
                for the default language.
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditor(false)}
                disabled={saving}
                className="rounded-lg border-border"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary text-white font-medium rounded-lg"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editingLanguage ? (
                  "Update Language"
                ) : (
                  "Create Language"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Language</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deletingLanguage?.name}&quot; (
              {deletingLanguage?.code})? This action cannot be undone.
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
