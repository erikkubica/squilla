import React from "react";
import { Plus, Mail } from "@squilla/icons";
import NotificationVariablesPanel from "../notifications/NotificationVariablesPanel";
import NotificationCard from "../notifications/NotificationCard";

const { Button, Card, CardContent, SectionHeader, EmptyState } =
  (window as any).__SQUILLA_SHARED__.ui;

function getEmailFields(fields: any[]): any[] {
  return (fields || []).filter((f: any) => f.type === "email");
}

export default function NotificationsTab({ form, setForm }: any) {
  const emailFields = getEmailFields(form.fields || []);

  const addNotification = () => {
    const newNotif = {
      name: "New Notification",
      type: "admin",
      enabled: true,
      recipients: "{{.site_email}}",
      recipient_field: "",
      subject: "New submission: {{.form.name}}",
      body: "You have a new submission.\n\n{{range .data}}\n{{.label}}: {{.value}}\n{{end}}",
      reply_to: "",
      cc: "",
      bcc: "",
    };
    setForm({ ...form, notifications: [...(form.notifications || []), newNotif] });
  };

  const removeNotification = (index: number) => {
    const newNotifs = [...form.notifications];
    newNotifs.splice(index, 1);
    setForm({ ...form, notifications: newNotifs });
  };

  const updateNotification = (index: number, key: string, value: any) => {
    const newNotifs = [...form.notifications];
    newNotifs[index] = { ...newNotifs[index], [key]: value };

    if (key === "type" && value === "auto-responder") {
      const field = emailFields.length > 0 ? emailFields[0].id : "";
      newNotifs[index].recipient_field = field;
      if (field) newNotifs[index].recipients = `{{.field.${field}}}`;
    }
    if (key === "type" && value === "admin") {
      newNotifs[index].recipient_field = "";
      if (!newNotifs[index].recipients || newNotifs[index].recipients.startsWith("{{.field.")) {
        newNotifs[index].recipients = "{{.site_email}}";
      }
    }
    if (key === "recipient_field" && value) {
      newNotifs[index].recipients = `{{.field.${value}}}`;
    }

    setForm({ ...form, notifications: newNotifs });
  };

  return (
    <div className="space-y-6">
      <NotificationVariablesPanel />

      <Card className="rounded-xl border border-border shadow-sm">
        <SectionHeader
          title={`Email Notifications (${(form.notifications || []).length})`}
          icon={<Mail className="h-4 w-4 text-foreground" />}
          actions={
            <Button variant="outline" size="sm" onClick={addNotification}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Notification
            </Button>
          }
        />
        <CardContent className="p-4 space-y-4">
          {(form.notifications || []).length === 0 ? (
            <EmptyState
              icon={Mail}
              title="No notifications configured"
              description="You won't be alerted of new submissions"
              action={
                <Button variant="outline" size="sm" onClick={addNotification}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Notification
                </Button>
              }
            />
          ) : (
            (form.notifications || []).map((notif: any, index: number) => (
              <NotificationCard
                key={index}
                notif={notif}
                index={index}
                formId={form.id}
                emailFields={emailFields}
                onUpdate={updateNotification}
                onRemove={removeNotification}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
