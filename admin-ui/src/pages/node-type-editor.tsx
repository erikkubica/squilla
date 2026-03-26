import { useEffect, useState, type FormEvent } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Trash2,
  Loader2,
  Plus,
  ChevronUp,
  ChevronDown,
  X,
  Pencil,
  FileText,
  Newspaper,
  ShoppingBag,
  Calendar,
  Users,
  Folder,
  Bookmark,
  Tag,
  Star,
  Heart,
  Image,
  Boxes,
  type LucideIcon,
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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import SubFieldsEditor from "@/components/ui/sub-fields-editor";
import FieldTypePicker from "@/components/ui/field-type-picker";
import { toast } from "sonner";
import {
  getNodeType,
  createNodeType,
  updateNodeType,
  deleteNodeType,
  getLanguages,
  type NodeType,
  type NodeTypeField,
  type Language,
} from "@/api/client";

const ICON_OPTIONS: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "file-text", label: "File", icon: FileText },
  { value: "newspaper", label: "News", icon: Newspaper },
  { value: "shopping-bag", label: "Shop", icon: ShoppingBag },
  { value: "calendar", label: "Calendar", icon: Calendar },
  { value: "users", label: "Users", icon: Users },
  { value: "folder", label: "Folder", icon: Folder },
  { value: "bookmark", label: "Bookmark", icon: Bookmark },
  { value: "tag", label: "Tag", icon: Tag },
  { value: "star", label: "Star", icon: Star },
  { value: "heart", label: "Heart", icon: Heart },
  { value: "image", label: "Image", icon: Image },
  { value: "boxes", label: "Boxes", icon: Boxes },
];


function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function keyify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/[\s]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function fieldTypeBadgeClass(type: string): string {
  switch (type) {
    case "text":
      return "bg-blue-100 text-blue-700 hover:bg-blue-100";
    case "textarea":
      return "bg-purple-100 text-purple-700 hover:bg-purple-100";
    case "number":
      return "bg-amber-100 text-amber-700 hover:bg-amber-100";
    case "date":
      return "bg-teal-100 text-teal-700 hover:bg-teal-100";
    case "select":
      return "bg-indigo-100 text-indigo-700 hover:bg-indigo-100";
    case "image":
      return "bg-pink-100 text-pink-700 hover:bg-pink-100";
    case "toggle":
      return "bg-emerald-100 text-emerald-700 hover:bg-emerald-100";
    case "link":
      return "bg-cyan-100 text-cyan-700 hover:bg-cyan-100";
    case "group":
      return "bg-violet-100 text-violet-700 hover:bg-violet-100";
    case "repeater":
      return "bg-orange-100 text-orange-700 hover:bg-orange-100";
    case "node":
      return "bg-sky-100 text-sky-700 hover:bg-sky-100";
    case "color":
      return "bg-rose-100 text-rose-700 hover:bg-rose-100";
    case "email":
      return "bg-blue-100 text-blue-700 hover:bg-blue-100";
    case "url":
      return "bg-blue-100 text-blue-700 hover:bg-blue-100";
    case "richtext":
      return "bg-purple-100 text-purple-700 hover:bg-purple-100";
    case "range":
      return "bg-amber-100 text-amber-700 hover:bg-amber-100";
    case "file":
      return "bg-pink-100 text-pink-700 hover:bg-pink-100";
    case "gallery":
      return "bg-pink-100 text-pink-700 hover:bg-pink-100";
    case "radio":
      return "bg-indigo-100 text-indigo-700 hover:bg-indigo-100";
    case "checkbox":
      return "bg-indigo-100 text-indigo-700 hover:bg-indigo-100";
    default:
      return "bg-slate-100 text-slate-600 hover:bg-slate-100";
  }
}

export default function NodeTypeEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [autoSlug, setAutoSlug] = useState(!isEdit);

  // Form state
  const [label, setLabel] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("file-text");
  const [fields, setFields] = useState<NodeTypeField[]>([]);
  const [urlPrefixes, setUrlPrefixes] = useState<Record<string, string>>({});
  const [originalNodeType, setOriginalNodeType] = useState<NodeType | null>(null);

  // Add field form state
  const [showAddField, setShowAddField] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldKey, setNewFieldKey] = useState("");
  const [newFieldType, setNewFieldType] = useState<NodeTypeField["type"]>("text");
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldOptions, setNewFieldOptions] = useState("");
  const [newFieldSubFields, setNewFieldSubFields] = useState<NodeTypeField[]>([]);
  const [newFieldNodeTypeFilter, setNewFieldNodeTypeFilter] = useState("");
  const [newFieldMultiple, setNewFieldMultiple] = useState(false);
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState("");
  const [newFieldDefaultValue, setNewFieldDefaultValue] = useState("");
  const [newFieldHelpText, setNewFieldHelpText] = useState("");
  const [newFieldMin, setNewFieldMin] = useState("");
  const [newFieldMax, setNewFieldMax] = useState("");
  const [newFieldStep, setNewFieldStep] = useState("");
  const [newFieldMinLength, setNewFieldMinLength] = useState("");
  const [newFieldMaxLength, setNewFieldMaxLength] = useState("");
  const [newFieldRows, setNewFieldRows] = useState("");
  const [newFieldPrepend, setNewFieldPrepend] = useState("");
  const [newFieldAppend, setNewFieldAppend] = useState("");
  const [newFieldAllowedTypes, setNewFieldAllowedTypes] = useState("");
  const [autoFieldKey, setAutoFieldKey] = useState(true);

  // Languages
  const [languages, setLanguages] = useState<Language[]>([]);

  useEffect(() => {
    getLanguages(true).then(setLanguages).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    setLoading(true);
    getNodeType(id)
      .then((nt) => {
        if (cancelled) return;
        setOriginalNodeType(nt);
        setLabel(nt.label);
        setSlug(nt.slug);
        setDescription(nt.description || "");
        setIcon(nt.icon || "file-text");
        setFields(nt.field_schema || []);
        setUrlPrefixes(nt.url_prefixes || {});
        setAutoSlug(false);
      })
      .catch(() => {
        toast.error("Failed to load content type");
        navigate("/admin/content-types", { replace: true });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, isEdit, navigate]);

  // Auto-generate slug from label
  useEffect(() => {
    if (autoSlug) {
      setSlug(slugify(label));
    }
  }, [label, autoSlug]);

  // Auto-generate field key from field label
  useEffect(() => {
    if (autoFieldKey) {
      setNewFieldKey(keyify(newFieldLabel));
    }
  }, [newFieldLabel, autoFieldKey]);

  function resetAddFieldForm() {
    setNewFieldLabel("");
    setNewFieldKey("");
    setNewFieldType("text");
    setNewFieldRequired(false);
    setNewFieldOptions("");
    setNewFieldSubFields([]);
    setNewFieldNodeTypeFilter("");
    setNewFieldMultiple(false);
    setNewFieldPlaceholder("");
    setNewFieldDefaultValue("");
    setNewFieldHelpText("");
    setNewFieldMin("");
    setNewFieldMax("");
    setNewFieldStep("");
    setNewFieldMinLength("");
    setNewFieldMaxLength("");
    setNewFieldRows("");
    setNewFieldPrepend("");
    setNewFieldAppend("");
    setNewFieldAllowedTypes("");
    setAutoFieldKey(true);
    setShowAddField(false);
  }

  function handleAddField() {
    if (!newFieldLabel.trim() || !newFieldKey.trim()) {
      toast.error("Field label and key are required");
      return;
    }

    if (fields.some((f) => f.key === newFieldKey)) {
      toast.error("A field with this key already exists");
      return;
    }

    const newField: NodeTypeField = {
      key: newFieldKey,
      label: newFieldLabel,
      type: newFieldType,
      required: newFieldRequired || undefined,
    };

    if (newFieldPlaceholder.trim()) newField.placeholder = newFieldPlaceholder.trim();
    if (newFieldDefaultValue.trim()) newField.default_value = newFieldDefaultValue.trim();
    if (newFieldHelpText.trim()) newField.help_text = newFieldHelpText.trim();

    if ((newFieldType === "select" || newFieldType === "radio" || newFieldType === "checkbox") && newFieldOptions.trim()) {
      newField.options = newFieldOptions.split(",").map((o) => o.trim()).filter(Boolean);
    }
    if ((newFieldType === "group" || newFieldType === "repeater") && newFieldSubFields.length > 0) {
      newField.sub_fields = newFieldSubFields;
    }
    if (newFieldType === "node") {
      if (newFieldNodeTypeFilter.trim()) newField.node_type_filter = newFieldNodeTypeFilter.trim();
      if (newFieldMultiple) newField.multiple = true;
    }
    if (newFieldType === "number" || newFieldType === "range") {
      if (newFieldMin.trim()) newField.min = Number(newFieldMin);
      if (newFieldMax.trim()) newField.max = Number(newFieldMax);
      if (newFieldStep.trim()) newField.step = Number(newFieldStep);
    }
    if (newFieldType === "text" || newFieldType === "textarea") {
      if (newFieldMinLength.trim()) newField.min_length = Number(newFieldMinLength);
      if (newFieldMaxLength.trim()) newField.max_length = Number(newFieldMaxLength);
    }
    if (newFieldType === "textarea" && newFieldRows.trim()) {
      newField.rows = Number(newFieldRows);
    }
    if (["text", "number", "email", "url"].includes(newFieldType)) {
      if (newFieldPrepend.trim()) newField.prepend = newFieldPrepend.trim();
      if (newFieldAppend.trim()) newField.append = newFieldAppend.trim();
    }
    if (newFieldType === "file") {
      if (newFieldAllowedTypes.trim()) newField.allowed_types = newFieldAllowedTypes.trim();
      if (newFieldMultiple) newField.multiple = true;
    }

    setFields([...fields, newField]);
    resetAddFieldForm();
  }

  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null);

  function handleRemoveField(index: number) {
    setFields(fields.filter((_, i) => i !== index));
    if (editingFieldIndex === index) setEditingFieldIndex(null);
  }

  function updateField(index: number, updates: Partial<NodeTypeField>) {
    setFields(fields.map((f, i) => i === index ? { ...f, ...updates } : f));
  }

  function handleMoveField(index: number, direction: "up" | "down") {
    const newFields = [...fields];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newFields.length) return;
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    setFields(newFields);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();

    if (!label.trim() || !slug.trim()) {
      toast.error("Label and slug are required");
      return;
    }

    const data: Partial<NodeType> = {
      label,
      slug,
      description,
      icon,
      field_schema: fields,
      url_prefixes: urlPrefixes,
    };

    setSaving(true);
    try {
      if (isEdit) {
        const updated = await updateNodeType(id, data);
        setOriginalNodeType(updated);
        toast.success("Content type updated successfully");
      } else {
        const created = await createNodeType(data);
        toast.success("Content type created successfully");
        navigate(`/admin/content-types/${created.id}/edit`, { replace: true });
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save content type";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteNodeType(id);
      toast.success("Content type deleted successfully");
      navigate("/admin/content-types", { replace: true });
    } catch {
      toast.error("Failed to delete content type");
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-lg hover:bg-slate-200">
          <Link to="/admin/content-types">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-slate-900">
          {isEdit ? `Edit Content Type` : `New Content Type`}
        </h1>
      </div>

      <form onSubmit={handleSave} className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Basic info */}
          <Card className="rounded-xl border border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">Basic Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6 pt-0">
              <div className="space-y-2">
                <Label htmlFor="label" className="text-sm font-medium text-slate-700">Label</Label>
                <Input
                  id="label"
                  placeholder="e.g. Product, Event, Testimonial"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  required
                  className="rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="slug" className="text-sm font-medium text-slate-700">Slug</Label>
                  <button
                    type="button"
                    className="text-xs text-indigo-600 hover:underline"
                    onClick={() => setAutoSlug(!autoSlug)}
                  >
                    {autoSlug ? "Edit manually" : "Auto-generate"}
                  </button>
                </div>
                <Input
                  id="slug"
                  placeholder="url-slug"
                  value={slug}
                  onChange={(e) => {
                    setAutoSlug(false);
                    setSlug(e.target.value);
                  }}
                  disabled={autoSlug}
                  required
                  className="rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-slate-700">Description</Label>
                <Textarea
                  id="description"
                  placeholder="A brief description of this content type"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Icon</Label>
                <div className="grid grid-cols-6 gap-2">
                  {ICON_OPTIONS.map((opt) => {
                    const IconComp = opt.icon;
                    const isSelected = icon === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setIcon(opt.value)}
                        title={opt.label}
                        className={`flex flex-col items-center gap-1 rounded-lg border-2 p-2.5 transition-all ${
                          isSelected
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm"
                            : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <IconComp className="h-5 w-5" />
                        <span className="text-[10px] font-medium leading-none">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* URL Prefixes */}
          <Card className="rounded-xl border border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">URL Prefixes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6 pt-0">
              <p className="text-sm text-slate-500">
                Set the URL prefix per language. For example, a "Team Member" type could use
                <span className="font-mono text-indigo-600"> /en/team/</span> in English and
                <span className="font-mono text-indigo-600"> /es/equipo/</span> in Spanish.
                Leave empty to use the type slug as prefix.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {languages.map((lang) => (
                  <div key={lang.code} className="space-y-1">
                    <Label className="text-sm font-medium text-slate-700">{lang.name} ({lang.code})</Label>
                    <div className="flex items-center rounded-lg border border-slate-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 overflow-hidden">
                      <span className="shrink-0 bg-slate-100 px-2 py-2 text-sm text-slate-500 border-r border-slate-300">
                        /{lang.code}/
                      </span>
                      <input
                        placeholder={slug || "prefix"}
                        value={urlPrefixes[lang.code] || ""}
                        onChange={(e) =>
                          setUrlPrefixes((prev) => ({
                            ...prev,
                            [lang.code]: e.target.value,
                          }))
                        }
                        className="flex-1 bg-transparent px-2 py-2 text-sm outline-none"
                      />
                      <span className="shrink-0 text-sm text-slate-400 pr-2">/slug</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Fields */}
          <Card className="rounded-xl border border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">Fields</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6 pt-0">
              {fields.length === 0 && !showAddField && (
                <p className="text-sm text-slate-400 text-center py-4">
                  No fields defined yet. Add fields to define the structure of this content type.
                </p>
              )}

              {fields.length > 0 && (
                <div className="space-y-2">
                  {fields.map((field, index) => (
                    <div
                      key={field.key + index}
                      className={`rounded-lg border ${editingFieldIndex === index ? "border-indigo-300 bg-indigo-50/30" : "border-slate-200 bg-slate-50"}`}
                    >
                      {/* Header row — click to toggle edit */}
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <button type="button" onClick={() => handleMoveField(index, "up")} disabled={index === 0} className="text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed">
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <button type="button" onClick={() => handleMoveField(index, "down")} disabled={index === fields.length - 1} className="text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed">
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        </div>
                        <button
                          type="button"
                          className="flex-1 min-w-0 text-left"
                          onClick={() => setEditingFieldIndex(editingFieldIndex === index ? null : index)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-800">{field.label}</span>
                            <span className="text-xs text-slate-400 font-mono">{field.key}</span>
                          </div>
                        </button>
                        <Badge className={`${fieldTypeBadgeClass(field.type)} border-0 text-xs`}>{field.type}</Badge>
                        {field.required && <Badge className="bg-red-100 text-red-600 hover:bg-red-100 border-0 text-xs">Required</Badge>}
                        {field.help_text && <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-100 border-0 text-xs" title={field.help_text}>?</Badge>}
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600 shrink-0" onClick={() => setEditingFieldIndex(editingFieldIndex === index ? null : index)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 shrink-0" onClick={() => handleRemoveField(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {/* Inline edit form */}
                      {editingFieldIndex === index && (
                        <div className="border-t border-indigo-200 px-4 py-3 space-y-3">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                              <Label className="text-xs font-medium text-slate-600">Label</Label>
                              <Input value={field.label} onChange={(e) => updateField(index, { label: e.target.value })} className="h-8 text-sm rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs font-medium text-slate-600">Key</Label>
                              <Input value={field.key} onChange={(e) => updateField(index, { key: e.target.value })} className="h-8 text-sm font-mono rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                            </div>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                              <Label className="text-xs font-medium text-slate-600">Type</Label>
                              <FieldTypePicker value={field.type} onValueChange={(v) => updateField(index, { type: v as NodeTypeField["type"] })} compact />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs font-medium text-slate-600">&nbsp;</Label>
                              <div className="flex items-center gap-2 h-8">
                                <input type="checkbox" checked={!!field.required} onChange={(e) => updateField(index, { required: e.target.checked || undefined })} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                <span className="text-sm text-slate-700">Required</span>
                              </div>
                            </div>
                          </div>
                          {field.type === "select" && (
                            <div className="space-y-1">
                              <Label className="text-xs font-medium text-slate-600">Options (comma-separated)</Label>
                              <Input value={(field.options || []).join(", ")} onChange={(e) => updateField(index, { options: e.target.value.split(",").map((o) => o.trim()).filter(Boolean) })} className="h-8 text-sm rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                            </div>
                          )}
                          {(field.type === "group" || field.type === "repeater") && (
                            <SubFieldsEditor
                              value={field.sub_fields || []}
                              onChange={(sf) => updateField(index, { sub_fields: sf })}
                              label={field.type === "group" ? "Group sub-fields" : "Repeater row fields"}
                            />
                          )}
                          {field.type === "node" && (
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="space-y-1">
                                <Label className="text-xs font-medium text-slate-600">Node Type Filter</Label>
                                <Input
                                  value={field.node_type_filter || ""}
                                  onChange={(e) => updateField(index, { node_type_filter: e.target.value })}
                                  placeholder="e.g. page, post, product (empty = all)"
                                  className="h-8 text-sm rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs font-medium text-slate-600">&nbsp;</Label>
                                <div className="flex items-center gap-2 h-8">
                                  <input type="checkbox" checked={!!field.multiple} onChange={(e) => updateField(index, { multiple: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                  <span className="text-sm text-slate-700">Allow multiple</span>
                                </div>
                              </div>
                            </div>
                          )}
                          {/* Placeholder */}
                          {["text", "textarea", "number", "email", "url"].includes(field.type) && (
                            <div className="space-y-1">
                              <Label className="text-xs font-medium text-slate-600">Placeholder</Label>
                              <Input value={field.placeholder || ""} onChange={(e) => updateField(index, { placeholder: e.target.value || undefined })} placeholder="Placeholder text" className="h-8 text-sm rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                            </div>
                          )}
                          {/* Default Value */}
                          {!["group", "repeater"].includes(field.type) && (
                            <div className="space-y-1">
                              <Label className="text-xs font-medium text-slate-600">Default Value</Label>
                              <Input value={field.default_value || ""} onChange={(e) => updateField(index, { default_value: e.target.value || undefined })} placeholder="Default value" className="h-8 text-sm rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                            </div>
                          )}
                          {/* Help Text */}
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-slate-600">Help Text</Label>
                            <Input value={field.help_text || ""} onChange={(e) => updateField(index, { help_text: e.target.value || undefined })} placeholder="Instructions for content editors" className="h-8 text-sm rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                          </div>
                          {/* Options for radio/checkbox */}
                          {(field.type === "radio" || field.type === "checkbox") && (
                            <div className="space-y-1">
                              <Label className="text-xs font-medium text-slate-600">Options (comma-separated)</Label>
                              <Input value={(field.options || []).join(", ")} onChange={(e) => updateField(index, { options: e.target.value.split(",").map((o) => o.trim()).filter(Boolean) })} className="h-8 text-sm rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                            </div>
                          )}
                          {/* Number/Range constraints */}
                          {(field.type === "number" || field.type === "range") && (
                            <div className="grid gap-3 sm:grid-cols-3">
                              <div className="space-y-1">
                                <Label className="text-xs font-medium text-slate-600">Min</Label>
                                <Input type="number" value={field.min ?? ""} onChange={(e) => updateField(index, { min: e.target.value ? Number(e.target.value) : undefined })} placeholder="Min" className="h-8 text-sm rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs font-medium text-slate-600">Max</Label>
                                <Input type="number" value={field.max ?? ""} onChange={(e) => updateField(index, { max: e.target.value ? Number(e.target.value) : undefined })} placeholder="Max" className="h-8 text-sm rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs font-medium text-slate-600">Step</Label>
                                <Input type="number" value={field.step ?? ""} onChange={(e) => updateField(index, { step: e.target.value ? Number(e.target.value) : undefined })} placeholder="Step" className="h-8 text-sm rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                              </div>
                            </div>
                          )}
                          {/* Text length constraints */}
                          {(field.type === "text" || field.type === "textarea") && (
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="space-y-1">
                                <Label className="text-xs font-medium text-slate-600">Min Length</Label>
                                <Input type="number" value={field.min_length ?? ""} onChange={(e) => updateField(index, { min_length: e.target.value ? Number(e.target.value) : undefined })} placeholder="No min" className="h-8 text-sm rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs font-medium text-slate-600">Max Length</Label>
                                <Input type="number" value={field.max_length ?? ""} onChange={(e) => updateField(index, { max_length: e.target.value ? Number(e.target.value) : undefined })} placeholder="No max" className="h-8 text-sm rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                              </div>
                            </div>
                          )}
                          {/* Textarea rows */}
                          {field.type === "textarea" && (
                            <div className="space-y-1">
                              <Label className="text-xs font-medium text-slate-600">Rows</Label>
                              <Input type="number" value={field.rows ?? ""} onChange={(e) => updateField(index, { rows: e.target.value ? Number(e.target.value) : undefined })} placeholder="4 (default)" className="h-8 text-sm rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                            </div>
                          )}
                          {/* Prepend / Append */}
                          {["text", "number", "email", "url"].includes(field.type) && (
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="space-y-1">
                                <Label className="text-xs font-medium text-slate-600">Prepend</Label>
                                <Input value={field.prepend || ""} onChange={(e) => updateField(index, { prepend: e.target.value || undefined })} placeholder="e.g. $" className="h-8 text-sm rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs font-medium text-slate-600">Append</Label>
                                <Input value={field.append || ""} onChange={(e) => updateField(index, { append: e.target.value || undefined })} placeholder="e.g. px" className="h-8 text-sm rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                              </div>
                            </div>
                          )}
                          {/* File options */}
                          {field.type === "file" && (
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="space-y-1">
                                <Label className="text-xs font-medium text-slate-600">Allowed Types</Label>
                                <Input value={field.allowed_types || ""} onChange={(e) => updateField(index, { allowed_types: e.target.value || undefined })} placeholder="pdf, doc, zip" className="h-8 text-sm rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs font-medium text-slate-600">&nbsp;</Label>
                                <div className="flex items-center gap-2 h-8">
                                  <input type="checkbox" checked={!!field.multiple} onChange={(e) => updateField(index, { multiple: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                  <span className="text-sm text-slate-700">Multiple files</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add field form */}
              {showAddField && (
                <>
                  <Separator />
                  <div className="space-y-4 rounded-lg border border-indigo-200 bg-indigo-50/50 p-4">
                    <p className="text-sm font-semibold text-slate-700">New Field</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">Label</Label>
                        <Input
                          placeholder="e.g. Price, Author Name"
                          value={newFieldLabel}
                          onChange={(e) => setNewFieldLabel(e.target.value)}
                          className="rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium text-slate-700">Key</Label>
                          <button
                            type="button"
                            className="text-xs text-indigo-600 hover:underline"
                            onClick={() => setAutoFieldKey(!autoFieldKey)}
                          >
                            {autoFieldKey ? "Edit manually" : "Auto-generate"}
                          </button>
                        </div>
                        <Input
                          placeholder="field_key"
                          value={newFieldKey}
                          onChange={(e) => {
                            setAutoFieldKey(false);
                            setNewFieldKey(e.target.value);
                          }}
                          disabled={autoFieldKey}
                          className="rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-mono text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">Type</Label>
                        <FieldTypePicker value={newFieldType} onValueChange={(v) => setNewFieldType(v as NodeTypeField["type"])} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">&nbsp;</Label>
                        <div className="flex items-center gap-2 h-9">
                          <input
                            type="checkbox"
                            id="new-field-required"
                            checked={newFieldRequired}
                            onChange={(e) => setNewFieldRequired(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <Label htmlFor="new-field-required" className="text-sm font-medium text-slate-700 cursor-pointer">
                            Required
                          </Label>
                        </div>
                      </div>
                    </div>

                    {newFieldType === "select" && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">Options (comma-separated)</Label>
                        <Input
                          placeholder="e.g. Option A, Option B, Option C"
                          value={newFieldOptions}
                          onChange={(e) => setNewFieldOptions(e.target.value)}
                          className="rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                    )}

                    {(newFieldType === "group" || newFieldType === "repeater") && (
                      <SubFieldsEditor
                        value={newFieldSubFields}
                        onChange={setNewFieldSubFields}
                        label={newFieldType === "group" ? "Group sub-fields" : "Repeater row fields"}
                      />
                    )}

                    {newFieldType === "node" && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">Node Type Filter</Label>
                          <Input
                            value={newFieldNodeTypeFilter}
                            onChange={(e) => setNewFieldNodeTypeFilter(e.target.value)}
                            placeholder="e.g. page, product (empty = all)"
                            className="rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">&nbsp;</Label>
                          <div className="flex items-center gap-2 h-9">
                            <input type="checkbox" checked={newFieldMultiple} onChange={(e) => setNewFieldMultiple(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                            <span className="text-sm text-slate-700">Allow multiple selection</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Placeholder */}
                    {["text", "textarea", "number", "email", "url"].includes(newFieldType) && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">Placeholder</Label>
                        <Input
                          placeholder="Placeholder text shown when empty"
                          value={newFieldPlaceholder}
                          onChange={(e) => setNewFieldPlaceholder(e.target.value)}
                          className="rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                    )}

                    {/* Default Value */}
                    {!["group", "repeater"].includes(newFieldType) && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">Default Value</Label>
                        <Input
                          placeholder="Default value for new content"
                          value={newFieldDefaultValue}
                          onChange={(e) => setNewFieldDefaultValue(e.target.value)}
                          className="rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                    )}

                    {/* Help Text */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Help Text</Label>
                      <Input
                        placeholder="Instructions shown below the field"
                        value={newFieldHelpText}
                        onChange={(e) => setNewFieldHelpText(e.target.value)}
                        className="rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>

                    {/* Options for radio and checkbox */}
                    {(newFieldType === "radio" || newFieldType === "checkbox") && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">Options (comma-separated)</Label>
                        <Input
                          placeholder="e.g. Option A, Option B, Option C"
                          value={newFieldOptions}
                          onChange={(e) => setNewFieldOptions(e.target.value)}
                          className="rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                    )}

                    {/* Number / Range options */}
                    {(newFieldType === "number" || newFieldType === "range") && (
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">Min</Label>
                          <Input type="number" placeholder="0" value={newFieldMin} onChange={(e) => setNewFieldMin(e.target.value)} className="rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">Max</Label>
                          <Input type="number" placeholder="100" value={newFieldMax} onChange={(e) => setNewFieldMax(e.target.value)} className="rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">Step</Label>
                          <Input type="number" placeholder="1" value={newFieldStep} onChange={(e) => setNewFieldStep(e.target.value)} className="rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                        </div>
                      </div>
                    )}

                    {/* Text length constraints */}
                    {(newFieldType === "text" || newFieldType === "textarea") && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">Min Length</Label>
                          <Input type="number" placeholder="No minimum" value={newFieldMinLength} onChange={(e) => setNewFieldMinLength(e.target.value)} className="rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">Max Length</Label>
                          <Input type="number" placeholder="No maximum" value={newFieldMaxLength} onChange={(e) => setNewFieldMaxLength(e.target.value)} className="rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                        </div>
                      </div>
                    )}

                    {/* Textarea rows */}
                    {newFieldType === "textarea" && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">Rows</Label>
                        <Input type="number" placeholder="4 (default)" value={newFieldRows} onChange={(e) => setNewFieldRows(e.target.value)} className="rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                      </div>
                    )}

                    {/* Prepend / Append */}
                    {["text", "number", "email", "url"].includes(newFieldType) && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">Prepend</Label>
                          <Input placeholder="e.g. $, https://" value={newFieldPrepend} onChange={(e) => setNewFieldPrepend(e.target.value)} className="rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">Append</Label>
                          <Input placeholder="e.g. px, kg, %" value={newFieldAppend} onChange={(e) => setNewFieldAppend(e.target.value)} className="rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                        </div>
                      </div>
                    )}

                    {/* File options */}
                    {newFieldType === "file" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">Allowed File Types</Label>
                          <Input placeholder="e.g. pdf, doc, zip (empty = all)" value={newFieldAllowedTypes} onChange={(e) => setNewFieldAllowedTypes(e.target.value)} className="rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                        </div>
                        <div className="flex items-center gap-2 h-9">
                          <input type="checkbox" checked={newFieldMultiple} onChange={(e) => setNewFieldMultiple(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                          <span className="text-sm text-slate-700">Allow multiple files</span>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg"
                        onClick={handleAddField}
                      >
                        Add Field
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-lg border-slate-300"
                        onClick={resetAddFieldForm}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {!showAddField && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-lg border-dashed border-slate-300 text-slate-500 hover:border-indigo-400 hover:text-indigo-600"
                  onClick={() => setShowAddField(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Field
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="rounded-xl border border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">Save</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6 pt-0">
              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm"
                disabled={saving}
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : isEdit ? "Update Content Type" : "Create Content Type"}
              </Button>
            </CardContent>
          </Card>

          {/* Actions (edit mode only) */}
          {isEdit && (
            <Card className="rounded-xl border border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-6 pt-0">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-red-50 text-red-700 border-red-200 hover:bg-red-100 rounded-lg font-medium"
                  onClick={() => setShowDelete(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Content Type
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Info (edit mode) */}
          {isEdit && originalNodeType && (
            <Card className="rounded-xl border border-slate-200 shadow-sm">
              <CardContent className="space-y-2 p-6 text-sm text-slate-500">
                <div className="flex justify-between">
                  <span>Created</span>
                  <span>
                    {new Date(originalNodeType.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Updated</span>
                  <span>
                    {new Date(originalNodeType.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </form>

      {/* Delete dialog */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Content Type</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{originalNodeType?.label}&quot;?
              This action cannot be undone. All content using this type may become inaccessible.
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
