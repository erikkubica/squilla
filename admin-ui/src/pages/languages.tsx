import { useEffect, useState, type FormEvent } from "react";
import { Plus, Pencil, Trash2, Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import {
  getLanguages,
  createLanguage,
  updateLanguage,
  deleteLanguage,
  type Language,
} from "@/api/client";

export default function LanguagesPage() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dialog state
  const [showEditor, setShowEditor] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null);

  // Delete confirmation
  const [showDelete, setShowDelete] = useState(false);
  const [deletingLanguage, setDeletingLanguage] = useState<Language | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form state
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
    try {
      const data = await getLanguages();
      setLanguages(data);
    } catch {
      toast.error("Failed to load languages");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLanguages();
  }, []);

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
      const message =
        err instanceof Error ? err.message : "Failed to save language";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(lang: Language) {
    try {
      await updateLanguage(lang.id, { is_active: !lang.is_active });
      setLanguages((prev) =>
        prev.map((l) =>
          l.id === lang.id ? { ...l, is_active: !l.is_active } : l
        )
      );
      toast.success(
        `${lang.name} ${!lang.is_active ? "activated" : "deactivated"}`
      );
    } catch {
      toast.error("Failed to update language");
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
      const message =
        err instanceof Error ? err.message : "Failed to delete language";
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe className="h-7 w-7 text-indigo-600" />
          <h1 className="text-2xl font-bold text-slate-900">Languages</h1>
        </div>
        <Button
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm"
          onClick={openAddDialog}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Language
        </Button>
      </div>

      {/* Table */}
      <Card className="rounded-xl border border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">
            All Languages
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200 hover:bg-transparent">
                <TableHead className="text-slate-500 font-medium">Flag</TableHead>
                <TableHead className="text-slate-500 font-medium">Code</TableHead>
                <TableHead className="text-slate-500 font-medium">URL Slug</TableHead>
                <TableHead className="text-slate-500 font-medium">Name</TableHead>
                <TableHead className="text-slate-500 font-medium">Native Name</TableHead>
                <TableHead className="text-slate-500 font-medium">Default</TableHead>
                <TableHead className="text-slate-500 font-medium">Active</TableHead>
                <TableHead className="text-slate-500 font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {languages.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-slate-400">
                    No languages configured yet. Click "Add Language" to get started.
                  </TableCell>
                </TableRow>
              )}
              {languages.map((lang) => (
                <TableRow key={lang.id} className="border-slate-100">
                  <TableCell className="text-2xl">{lang.flag}</TableCell>
                  <TableCell>
                    <span className="font-mono text-sm text-slate-700">{lang.code}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm text-indigo-600">/{lang.slug}/</span>
                  </TableCell>
                  <TableCell className="font-medium text-slate-800">{lang.name}</TableCell>
                  <TableCell className="text-slate-600">{lang.native_name}</TableCell>
                  <TableCell>
                    {lang.is_default && (
                      <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-0 text-xs">
                        Default
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(lang)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                        lang.is_active ? "bg-indigo-600" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          lang.is_active ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-500 hover:text-indigo-600"
                        onClick={() => openEditDialog(lang)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {!lang.is_default && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-red-600"
                          onClick={() => openDeleteDialog(lang)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLanguage ? "Edit Language" : "Add Language"}
            </DialogTitle>
            <DialogDescription>
              {editingLanguage
                ? "Update the language details below."
                : "Fill in the details for the new language."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="lang-code" className="text-sm font-medium text-slate-700">
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
                  className="rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
                {editingLanguage && (
                  <p className="text-xs text-slate-400">Code cannot be changed</p>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="lang-slug" className="text-sm font-medium text-slate-700">
                    URL Slug
                  </Label>
                  {!editingLanguage && (
                    <button
                      type="button"
                      className="text-xs text-indigo-600 hover:underline"
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
                  className="rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
                <p className="text-xs text-slate-400">Used in URLs: /{formSlug || formCode}/page-slug</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lang-flag" className="text-sm font-medium text-slate-700">
                  Flag
                </Label>
                <Input
                  id="lang-flag"
                  placeholder="e.g. 🇺🇸, 🇪🇸"
                  value={formFlag}
                  onChange={(e) => setFormFlag(e.target.value)}
                  className="rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="lang-name" className="text-sm font-medium text-slate-700">
                  Name
                </Label>
                <Input
                  id="lang-name"
                  placeholder="e.g. English"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  className="rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lang-native-name" className="text-sm font-medium text-slate-700">
                  Native Name
                </Label>
                <Input
                  id="lang-native-name"
                  placeholder="e.g. English"
                  value={formNativeName}
                  onChange={(e) => setFormNativeName(e.target.value)}
                  className="rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formIsDefault}
                  onChange={(e) => setFormIsDefault(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-slate-700">Default language</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-slate-700">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formHidePrefix}
                  onChange={(e) => setFormHidePrefix(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-slate-700">Hide URL prefix</span>
              </label>
            </div>
            {formHidePrefix && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                URLs for this language won't have a prefix: <span className="font-mono">/page-slug</span> instead of <span className="font-mono">/{formSlug || formCode}/page-slug</span>. Typically used for the default language.
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditor(false)}
                disabled={saving}
                className="rounded-lg border-slate-300"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg"
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

      {/* Delete confirmation dialog */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Language</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deletingLanguage?.name}&quot;
              ({deletingLanguage?.code})? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDelete(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
