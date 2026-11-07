import React, { useState } from "react";
import {
  Trash2,
  Mail,
  User,
  Users,
  Send,
  ChevronDown,
} from "@squilla/icons";
import NotificationDisplayWhen from "./NotificationDisplayWhen";

const {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
  Popover,
  PopoverContent,
  PopoverTrigger,
} = (window as any).__SQUILLA_SHARED__.ui;
const { toast } = (window as any).__SQUILLA_SHARED__.Sonner;

interface NotificationCardProps {
  notif: any;
  index: number;
  formId?: number | string;
  emailFields: any[];
  formFields?: any[];
  onUpdate: (index: number, key: string, value: any) => void;
  onRemove: (index: number) => void;
}

export default function NotificationCard({
  notif,
  index,
  formId,
  emailFields,
  formFields = [],
  onUpdate,
  onRemove,
}: NotificationCardProps) {
  const [expandedCC, setExpandedCC] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [testRecipient, setTestRecipient] = useState("");
  const [testSending, setTestSending] = useState(false);
  const [testPopoverOpen, setTestPopoverOpen] = useState(false);

  const handleSendTest = async () => {
    if (!formId) {
      toast.error("Save the form first before sending a test email.");
      return;
    }
    setTestSending(true);
    try {
      const res = await fetch(
        `/admin/api/ext/forms/${formId}/notifications/${index}/test`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ override_recipient: testRecipient.trim() }),
          credentials: "include",
        },
      );
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Test email sent");
        setTestPopoverOpen(false);
      } else {
        toast.error(data.error || "Failed to send test email");
      }
    } catch {
      toast.error("An error occurred while sending the test email");
    } finally {
      setTestSending(false);
    }
  };

  const notifType = notif.type || "admin";
  const isAutoResponder = notifType === "auto-responder";

  const sendTestButton = (
    <button type="button" data-slot="icon-button" title="Send a test email" aria-label="Send a test email" onClick={Popover ? undefined : handleSendTest}>
      <Send size={15} />
    </button>
  );

  const headerActions = (
    <div data-slot="block-card-actions" onClick={(e) => e.stopPropagation()}>
      <span className="inline-flex items-center" style={{ padding: "0 6px" }} title={notif.enabled !== false ? "On" : "Off"}>
        <Switch
          checked={notif.enabled !== false}
          onCheckedChange={(checked: boolean) => onUpdate(index, "enabled", checked)}
          aria-label="Send this email"
        />
      </span>
      {Popover ? (
        <Popover open={testPopoverOpen} onOpenChange={setTestPopoverOpen}>
          <PopoverTrigger asChild>{sendTestButton}</PopoverTrigger>
          <PopoverContent className="w-72 p-3 space-y-3" align="end">
            <p className="text-sm font-medium text-foreground">Send a test email</p>
            <div className="fm-field">
              <Label>Send to</Label>
              <Input
                value={testRecipient}
                onChange={(e: any) => setTestRecipient(e.target.value)}
                placeholder="admin@example.com"
              />
              <p className="fm-hint">Leave empty to use your account email.</p>
            </div>
            <Button type="button" className="w-full" size="sm" onClick={handleSendTest} disabled={testSending}>
              <Send className="mr-2 h-3.5 w-3.5" />
              {testSending ? "Sending…" : "Send Test"}
            </Button>
          </PopoverContent>
        </Popover>
      ) : (
        sendTestButton
      )}
      <button type="button" data-slot="icon-button" data-tone="danger" onClick={() => onRemove(index)} title="Remove email" aria-label="Remove email">
        <Trash2 size={15} />
      </button>
      <span data-slot="block-card-divider" aria-hidden />
      <button
        type="button"
        data-slot="icon-button"
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? "Expand email" : "Collapse email"}
      >
        <ChevronDown size={17} className="transition-transform" style={{ transform: collapsed ? "rotate(-90deg)" : "none" }} />
      </button>
    </div>
  );

  const summary = isAutoResponder
    ? `To the person who filled it in${notif.recipient_field ? ` (${notif.recipient_field})` : ""}`
    : `To ${notif.recipients || "nobody yet"}`;

  return (
    <div data-slot="block-card" data-state={collapsed ? "closed" : "open"} data-muted={notif.enabled === false ? "" : undefined}>
      <div data-slot="block-card-header" onClick={() => setCollapsed(!collapsed)}>
        <button
          type="button"
          className="flex flex-1 items-center min-w-0 text-left"
          style={{ gap: 10, background: "transparent", border: 0, padding: 0 }}
          aria-expanded={!collapsed}
          onClick={(e) => {
            e.stopPropagation();
            setCollapsed(!collapsed);
          }}
        >
          <span data-slot="block-icon" aria-hidden="true">
            {isAutoResponder ? <User size={15} /> : <Mail size={15} />}
          </span>
          <span className="flex flex-col min-w-0" style={{ gap: 1 }}>
            <span className="flex items-center min-w-0" style={{ gap: 8 }}>
              <span data-slot="block-card-title">{notif.name || "Untitled email"}</span>
              <span className="fm-tag shrink-0" data-tone={isAutoResponder ? "accent" : undefined}>
                {isAutoResponder ? "Auto-Responder" : "Admin"}
              </span>
              {notif.enabled === false && <span className="fm-tag shrink-0">Off</span>}
            </span>
            <span data-slot="block-card-meta" className="truncate" style={{ fontSize: 12.5, color: "var(--fg-muted)" }}>
              {summary}
            </span>
          </span>
        </button>
        {headerActions}
      </div>

      {!collapsed && (
      <div data-slot="block-card-body" className="fm-ed" style={{ gap: 20 }}>
        <div className="fm-grid2">
          <div className="fm-field">
            <Label>Name</Label>
            <Input
              value={notif.name}
              onChange={(e: any) => onUpdate(index, "name", e.target.value)}
              placeholder="e.g. Admin Email"
            />
          </div>
          <div className="fm-field">
            <Label>Who gets it</Label>
            <Select value={notifType} onValueChange={(val: string) => onUpdate(index, "type", val)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">
                  <span className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5" />
                    Admin Notification
                  </span>
                </SelectItem>
                <SelectItem value="auto-responder">
                  <span className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5" />
                    Auto-Responder
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="fm-hint">
              {isAutoResponder
                ? "Sends to the submitter's email address."
                : "Sends to the configured recipient addresses."}
            </p>
          </div>
        </div>

        {isAutoResponder ? (
          <div className="fm-field">
            <Label>Email field</Label>
            {emailFields.length > 0 ? (
              <Select
                value={notif.recipient_field || ""}
                onValueChange={(val: string) => onUpdate(index, "recipient_field", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select email field" />
                </SelectTrigger>
                <SelectContent>
                  {emailFields.map((field: any) => (
                    <SelectItem key={field.id} value={field.id}>
                      {field.label || field.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={notif.recipient_field || ""}
                onChange={(e: any) => onUpdate(index, "recipient_field", e.target.value)}
                placeholder="Enter email field ID"
              />
            )}
            <p className="fm-hint">
              Select which field contains the submitter's email address.
            </p>
          </div>
        ) : (
          <div className="fm-field">
            <Label>Recipient(s)</Label>
            <Input
              value={notif.recipients}
              onChange={(e: any) => onUpdate(index, "recipients", e.target.value)}
              placeholder="admin@example.com"
            />
            <p className="fm-hint">
              Comma separated. Supports templates like <code>{"{{.site_email}}"}</code>
            </p>
          </div>
        )}

        <div className="fm-field">
          <Label>Subject</Label>
          <Input
            value={notif.subject}
            onChange={(e: any) => onUpdate(index, "subject", e.target.value)}
            placeholder="New Message"
          />
        </div>

        <div className="fm-field">
          <Label>Body <span className="font-normal text-muted-foreground">(plain text or HTML)</span></Label>
          <Textarea
            value={notif.body}
            onChange={(e: any) => onUpdate(index, "body", e.target.value)}
            className="min-h-[150px] font-mono text-sm"
            placeholder="Hello,\n\nYou have a new submission..."
          />
        </div>

        <div className="fm-field">
          <Label>Reply-to</Label>
          {emailFields.length > 0 ? (
            <Select
              value={notif.reply_to ? notif.reply_to : "__none__"}
              onValueChange={(val: string) =>
                onUpdate(index, "reply_to", val === "__none__" ? "" : val)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {emailFields.map((field: any) => (
                  <SelectItem key={field.id} value={field.id}>
                    {field.label || field.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={notif.reply_to || ""}
              onChange={(e: any) => onUpdate(index, "reply_to", e.target.value)}
              placeholder="[email_field_id]"
            />
          )}
        </div>

        {/* CC / BCC */}
        <div className="fm-sec" style={{ paddingTop: 18, borderTop: "1px solid var(--divider)", gap: 12 }}>
          <button type="button" className="fm-disclosure" aria-expanded={expandedCC} onClick={() => setExpandedCC(!expandedCC)}>
            <ChevronDown aria-hidden="true" />
            <span>CC / BCC</span>
            {notif.cc || notif.bcc ? <span className="fm-tag">Set</span> : null}
          </button>
          {expandedCC && (
            <div className="fm-grid2">
              <div className="fm-field">
                <Label>CC</Label>
                <Input
                  value={notif.cc || ""}
                  onChange={(e: any) => onUpdate(index, "cc", e.target.value)}
                  placeholder="cc@example.com"
                />
                <p className="fm-hint">Comma separated email addresses.</p>
              </div>
              <div className="fm-field">
                <Label>BCC</Label>
                <Input
                  value={notif.bcc || ""}
                  onChange={(e: any) => onUpdate(index, "bcc", e.target.value)}
                  placeholder="bcc@example.com"
                />
                <p className="fm-hint">Comma separated email addresses.</p>
              </div>
            </div>
          )}
        </div>

        <NotificationDisplayWhen
          routeWhen={notif.route_when || {}}
          onChange={(next) => onUpdate(index, "route_when", next)}
          formFields={formFields}
        />
      </div>
      )}
    </div>
  );
}
