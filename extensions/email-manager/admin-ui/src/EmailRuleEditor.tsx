import { useEffect, useState, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Save, Loader2 } from "@squilla/icons";
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Titlebar,
  SidebarCard,
  PublishActions,
  TabsCard,
  MetaRow,
  MetaList,
} from "@squilla/ui";
import { toast } from "sonner";
import {
  getEmailRule,
  createEmailRule,
  updateEmailRule,
  getEmailTemplates,
  getSystemActions,
  getNodeTypes,
  getRoles,
} from "@squilla/api";

interface EmailTemplate {
  id: number;
  name: string;
}

interface SystemAction {
  slug: string;
  label: string;
}

interface NodeType {
  slug: string;
  label: string;
}

interface Role {
  slug: string;
  name: string;
}

interface EmailRule {
  id: number;
  action: string;
  node_type: string | null;
  template_id: number;
  recipient_type: string;
  recipient_value: string;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function EmailRuleEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id && id !== "new";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Lookup data
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [actions, setActions] = useState<SystemAction[]>([]);
  const [nodeTypes, setNodeTypes] = useState<NodeType[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [original, setOriginal] = useState<EmailRule | null>(null);

  // Form state
  const [formAction, setFormAction] = useState("");
  const [formNodeType, setFormNodeType] = useState("");
  const [formTemplateId, setFormTemplateId] = useState("");
  const [formRecipientType, setFormRecipientType] = useState("actor");
  const [formRecipientValue, setFormRecipientValue] = useState("");
  const [formEnabled, setFormEnabled] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [tpls, acts, nts, rls] = await Promise.all([
          getEmailTemplates(),
          getSystemActions(),
          getNodeTypes(),
          getRoles(),
        ]);
        if (cancelled) return;
        setTemplates(tpls);
        setActions(acts);
        setNodeTypes(nts);
        setRoles(rls);

        if (isEdit) {
          const rule = await getEmailRule(Number(id));
          if (cancelled) return;
          setOriginal(rule);
          setFormAction(rule.action);
          setFormNodeType(rule.node_type || "");
          setFormTemplateId(String(rule.template_id));
          setFormRecipientType(rule.recipient_type);
          setFormRecipientValue(rule.recipient_value);
          setFormEnabled(rule.enabled);
        }
      } catch {
        if (!cancelled) {
          toast.error("Failed to load data");
          navigate("/admin/ext/email-manager/rules", { replace: true });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit, navigate]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();

    if (!formAction || !formTemplateId) {
      toast.error("Action and template are required");
      return;
    }

    const data: Partial<EmailRule> = {
      action: formAction,
      node_type: formNodeType || null,
      template_id: Number(formTemplateId),
      recipient_type: formRecipientType,
      recipient_value: formRecipientValue,
      enabled: formEnabled,
    };

    setSaving(true);
    try {
      if (isEdit) {
        await updateEmailRule(Number(id), data);
        toast.success("Email rule updated successfully");
      } else {
        const created = await createEmailRule(data);
        toast.success("Email rule created successfully");
        navigate(`/admin/ext/email-manager/rules/${created.id}`, { replace: true });
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save email rule";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--accent-strong)" }} />
      </div>
    );
  }

  // Title for the rule: derived from the selected action label, or fallback.
  const actionLabel = actions.find((a) => a.slug === formAction)?.label || formAction;
  const titleValue = actionLabel || (isEdit ? `Rule #${id}` : "New Email Rule");

  const triggerTab = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">Action</Label>
        <Select value={formAction} onValueChange={setFormAction}>
          <SelectTrigger className="rounded-lg border-border">
            <SelectValue placeholder="Select an action..." />
          </SelectTrigger>
          <SelectContent>
            {actions.map((act) => (
              <SelectItem key={act.slug} value={act.slug}>
                {act.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[11px]" style={{ color: "var(--fg-subtle)" }}>
          The system event that fires this rule.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">Node Type (optional)</Label>
        <Select
          value={formNodeType || "__all__"}
          onValueChange={(v) => setFormNodeType(v === "__all__" ? "" : v)}
        >
          <SelectTrigger className="rounded-lg border-border">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All types</SelectItem>
            {nodeTypes.map((nt) => (
              <SelectItem key={nt.slug} value={nt.slug}>
                {nt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[11px]" style={{ color: "var(--fg-subtle)" }}>
          Restrict this rule to a single node type. Leave empty to match all.
        </p>
      </div>
    </div>
  );

  const recipientsTab = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">Recipient Type</Label>
        <Select
          value={formRecipientType}
          onValueChange={(v) => {
            setFormRecipientType(v);
            setFormRecipientValue("");
          }}
        >
          <SelectTrigger className="rounded-lg border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="actor">Actor (triggering user)</SelectItem>
            <SelectItem value="node_author">Node Author</SelectItem>
            <SelectItem value="role">Role</SelectItem>
            <SelectItem value="fixed">Fixed Email(s)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formRecipientType === "role" && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">Role</Label>
          <Select value={formRecipientValue} onValueChange={setFormRecipientValue}>
            <SelectTrigger className="rounded-lg border-border">
              <SelectValue placeholder="Select a role..." />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.slug} value={role.slug}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {formRecipientType === "fixed" && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">Email Address(es)</Label>
          <Input
            placeholder="email1@example.com, email2@example.com"
            value={formRecipientValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormRecipientValue(e.target.value)
            }
            className="rounded-lg border-border"
          />
          <p className="text-[11px]" style={{ color: "var(--fg-subtle)" }}>
            Comma-separated list of email addresses to notify.
          </p>
        </div>
      )}
    </div>
  );

  const templateTab = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">Template</Label>
        <Select value={formTemplateId} onValueChange={setFormTemplateId}>
          <SelectTrigger className="rounded-lg border-border">
            <SelectValue placeholder="Select a template..." />
          </SelectTrigger>
          <SelectContent>
            {templates.map((tpl) => (
              <SelectItem key={tpl.id} value={String(tpl.id)}>
                {tpl.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[11px]" style={{ color: "var(--fg-subtle)" }}>
          The email template rendered when this rule fires.
        </p>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSave} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      {/* Main column */}
      <div className="space-y-4 min-w-0">
        <Titlebar
          title={titleValue}
          onTitleChange={() => {
            /* title is derived from action; not directly editable */
          }}
          titleLabel="Rule"
          id={isEdit && id ? Number(id) : undefined}
          onBack={() => navigate("/admin/ext/email-manager/rules")}
        />

        <TabsCard
          tabs={[
            { value: "trigger", label: "Trigger", content: triggerTab },
            { value: "recipients", label: "Recipients", content: recipientsTab },
            { value: "template", label: "Template", content: templateTab },
          ]}
        />
      </div>

      {/* Sidebar */}
      <aside className="lg:sticky lg:top-4 lg:self-start">
        <SidebarCard title="Publish">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-sm font-medium text-foreground">Enabled</Label>
            <Switch checked={formEnabled} onCheckedChange={setFormEnabled} />
          </div>

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
