import { useEffect, useState, type FormEvent } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Trash2,
  Loader2,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getTerm,
  createTerm,
  updateTerm,
  deleteTerm,
  getTaxonomy,
  type TaxonomyTerm,
  type Taxonomy,
} from "@/api/client";
import { toast } from "sonner";
import CustomFieldInput from "@/components/ui/custom-field-input";
import { usePageMeta } from "@/components/layout/page-meta";

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function TermEditorPage() {
  const {
    nodeType,
    taxonomy: taxSlug,
    id,
  } = useParams<{ nodeType: string; taxonomy: string; id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [fieldsData, setFieldsData] = useState<Record<string, any>>({});
  const [taxonomy, setTaxonomy] = useState<Taxonomy | null>(null);

  const [autoSlug, setAutoSlug] = useState(!isEdit);

  usePageMeta([
    "Taxonomies",
    taxonomy?.label || taxSlug || "",
    isEdit ? (name ? `Edit "${name}"` : "Edit") : "New Term",
  ].filter(Boolean) as string[]);

  useEffect(() => {
    if (!taxSlug) return;

    const loadData = async () => {
      try {
        const tax = await getTaxonomy(taxSlug);
        setTaxonomy(tax);

        if (isEdit && id) {
          const term = await getTerm(Number(id));
          setName(term.name);
          setSlug(term.slug);
          setDescription(term.description || "");
          setFieldsData(term.fields_data || {});
          setAutoSlug(false);
        }
      } catch {
        toast.error("Failed to load data");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isEdit, id, taxSlug, navigate]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (autoSlug) {
      setSlug(slugify(val));
    }
  };

  const updateFieldValue = (key: string, value: any) => {
    setFieldsData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !slug) {
      toast.error("Name and slug are required");
      return;
    }

    const data: Partial<TaxonomyTerm> = {
      name,
      slug,
      description,
      fields_data: fieldsData,
    };

    setSaving(true);
    try {
      if (isEdit && id) {
        await updateTerm(Number(id), data);
        toast.success("Term updated");
      } else {
        await createTerm(nodeType!, taxSlug!, data);
        toast.success("Term created");
      }
      navigate(`/admin/content/${nodeType}/taxonomies/${taxSlug}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to save term");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteTerm(Number(id));
      toast.success("Term deleted");
      navigate(`/admin/content/${nodeType}/taxonomies/${taxSlug}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete term");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const taxLabel = taxonomy?.label || taxSlug;
  const customFields = (taxonomy?.field_schema || []).map((f: any) => ({ ...f, key: f.key || f.name }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="rounded-lg hover:bg-slate-200"
        >
          <Link to={`/admin/content/${nodeType}/taxonomies/${taxSlug}`}>
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-slate-900">
          {isEdit ? `Edit ${taxLabel}` : `New ${taxLabel}`}
        </h1>
      </div>

      <form
        onSubmit={handleSave}
        className="grid gap-6 lg:grid-cols-3"
      >
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Name + Slug compact */}
          <div className="space-y-3">
            <Input
              id="name"
              placeholder={`Enter ${taxLabel?.toLowerCase()} name`}
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              className="text-lg font-semibold h-11 rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
            <div className="flex items-center rounded-lg border border-slate-200 bg-white overflow-hidden h-8">
              <span className="shrink-0 bg-slate-50 px-2.5 text-xs text-slate-400 border-r border-slate-200 h-full flex items-center">
                slug:
              </span>
              <input
                id="slug"
                placeholder="auto-generated"
                value={slug}
                onChange={(e) => {
                  setAutoSlug(false);
                  setSlug(slugify(e.target.value));
                }}
                disabled={autoSlug}
                required
                className="flex-1 bg-transparent px-2 text-xs outline-none disabled:opacity-50 font-mono"
              />
              <button
                type="button"
                className="shrink-0 px-2.5 text-xs text-indigo-500 hover:text-indigo-700 border-l border-slate-200 h-full"
                onClick={() => setAutoSlug(!autoSlug)}
              >
                {autoSlug ? "Edit" : "Auto"}
              </button>
            </div>
          </div>

          {/* Description */}
          <Card className="rounded-xl border border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-900">
                Description
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Textarea
                placeholder="Optional description for this term..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="rounded-lg border-slate-300 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none"
              />
              <p className="text-[11px] text-slate-400 mt-1.5">
                Some themes display term descriptions on archive pages.
              </p>
            </CardContent>
          </Card>

          {/* Custom Fields */}
          {customFields.length > 0 && (
            <Card className="rounded-xl border border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-slate-900">
                  Custom Fields
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                {customFields.map((field: any) => (
                  <div key={field.name} className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-700">
                      {field.label}
                      {field.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </Label>
                    <CustomFieldInput
                      field={field}
                      value={fieldsData[field.name]}
                      onChange={(val) => updateFieldValue(field.name, val)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="rounded-xl border border-slate-200 shadow-sm">
            <CardContent className="space-y-4 p-5">
              {/* Info */}
              <div className="flex items-center gap-2 text-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500">
                  <Tag className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">{taxLabel}</p>
                  <p className="text-[11px] text-slate-400">
                    {nodeType} taxonomy
                  </p>
                </div>
              </div>

              {/* Save buttons */}
              <div className="flex gap-2 pt-1">
                <Button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm h-9 text-sm"
                  disabled={saving}
                >
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>

              {/* Delete */}
              {isEdit && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-red-50 text-red-700 border-red-200 hover:bg-red-100 rounded-lg font-medium h-8 text-xs"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Delete
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </form>

      {/* Delete Confirmation */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {taxLabel}?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{name}</strong>? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
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
