import React from "react";
import { Plus, Mail } from "@squilla/icons";
import NotificationVariablesPanel from "../notifications/NotificationVariablesPanel";
import NotificationCard from "../notifications/NotificationCard";

const { EmptyState } =
  (window as any).__SQUILLA_SHARED__.ui;

function getEmailFields(fields: any[]): any[] {
  return (fields || []).filter((f: any) => f.type === "email");
}

export default function NotificationsTab({ form, setForm }: any) {
  const emailFields = getEmailFields(form.fields || []);

  const addNotification = () => {
    const newNotif = {
      name: "New email",
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

  const notifications = form.notifications || [];

  return (
    <div className="fm-ed">
      <div className="fm-sec-head">
        <p className="fm-hint" style={{ marginTop: -4 }}>
          Emails sent after each submission: one to you, and optionally a reply to the person who filled it in.
        </p>
        <NotificationVariablesPanel />
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={Mail} title="No emails yet" description="Nobody is told when someone fills in this form." />
      ) : (
        <div data-slot="block-list">
          {notifications.map((notif: any, index: number) => (
            <NotificationCard
              key={index}
              notif={notif}
              index={index}
              formId={form.id}
              emailFields={emailFields}
              formFields={form.fields || []}
              onUpdate={updateNotification}
              onRemove={removeNotification}
            />
          ))}
        </div>
      )}

      <button type="button" data-slot="add-button" onClick={addNotification}>
        <Plus size={16} /> Add email
      </button>
    </div>
  );
}
