import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Plus, Pencil, Trash2, Loader2, Globe } from "@vibecms/icons";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@vibecms/ui";
import { toast } from "sonner";
import { getEmailTemplates, deleteEmailTemplate } from "@vibecms/api";

interface EmailTemplate {
  id: number;
  slug: string;
  name: string;
  language_id: number | null;
  subject_template: string;
  body_template: string;
  test_data: Record<string, any>;
}

export default function EmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Delete confirmation
  const [showDelete, setShowDelete] = useState(false);
  const [deletingTemplate, setDeletingTemplate] = useState<EmailTemplate | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function fetchTemplates() {
    try {
      const data = await getEmailTemplates();
      setTemplates(data);
    } catch {
      toast.error("Failed to load email templates");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTemplates();
  }, []);

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
      const message =
        err instanceof Error ? err.message : "Failed to delete email template";
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
          <Mail className="h-7 w-7 text-indigo-600" />
          <h1 className="text-2xl font-bold text-slate-900">Email Templates</h1>
        </div>
        <Button
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm"
          asChild
        >
          <Link to="/admin/ext/email-manager/templates/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Template
          </Link>
        </Button>
      </div>

      {/* Table */}
      <Card className="rounded-xl border border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">
            All Email Templates
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200 hover:bg-transparent">
                <TableHead className="text-slate-500 font-medium">Name</TableHead>
                <TableHead className="text-slate-500 font-medium">Slug</TableHead>
                <TableHead className="text-slate-500 font-medium">Subject</TableHead>
                <TableHead className="text-slate-500 font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-slate-400">
                    No email templates found. Click "Add Template" to get started.
                  </TableCell>
                </TableRow>
              )}
              {templates.map((tpl) => (
                <TableRow key={tpl.id} className="border-slate-100">
                  <TableCell className="font-medium text-slate-800">{tpl.name}</TableCell>
                  <TableCell>
                    <span className="font-mono text-sm text-indigo-600">{tpl.slug}</span>
                  </TableCell>
                  <TableCell className="text-slate-600 max-w-xs truncate">
                    {tpl.subject_template}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-500 hover:text-indigo-600"
                        asChild
                      >
                        <Link to={`/admin/ext/email-manager/templates/${tpl.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-500 hover:text-red-600"
                        onClick={() => openDeleteDialog(tpl)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Email Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deletingTemplate?.name}&quot;? This action cannot be undone.
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
