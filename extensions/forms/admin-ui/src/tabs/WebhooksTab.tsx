import React, { useEffect, useState } from "react";
import { RefreshCw, CheckCircle2, XCircle } from "@squilla/icons";

const { Input, Label, Switch, Th, Tr, Td, ListTable } = (window as any).__SQUILLA_SHARED__.ui;

interface WebhookLog {
  id: number;
  url: string;
  status_code: number;
  error: string;
  duration_ms: number;
  created_at: string;
}

interface WebhooksTabProps {
  form: Record<string, any>;
  setForm: (form: Record<string, any>) => void;
}

export default function WebhooksTab({ form, setForm }: WebhooksTabProps) {
  const settings = form.settings || {};
  const formId = form.id;

  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  const getSetting = (key: string, defaultValue: any) =>
    settings[key] !== undefined ? settings[key] : defaultValue;

  const updateSettings = (key: string, value: any) => {
    setForm({ ...form, settings: { ...settings, [key]: value } });
  };

  const webhookEnabled = getSetting("webhook_enabled", false);
  const webhookUrl = getSetting("webhook_url", "");
  const webhookHeaders = getSetting("webhook_headers", "");

  const fetchLogs = async () => {
    if (!formId) return;
    setLogsLoading(true);
    try {
      const res = await fetch(`/admin/api/ext/forms/${formId}/webhooks`, {
        credentials: "include",
      });
      const data = await res.json();
      setLogs(data.rows || []);
    } catch {
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (showLogs && formId) fetchLogs();
  }, [showLogs, formId]);

  return (
    <div className="fm-ed" style={{ maxWidth: 760 }}>
      <section className="fm-sec">
        <div className="fm-switch-row">
          <div>
            <Label htmlFor="fm-webhook-on">Send a webhook</Label>
            <p className="fm-hint">POST every new submission as JSON to another service, such as Zapier, Make or your own API.</p>
          </div>
          <Switch
            id="fm-webhook-on"
            checked={webhookEnabled}
            onCheckedChange={(v: boolean) => updateSettings("webhook_enabled", v)}
          />
        </div>

        {webhookEnabled && (
          <>
            <div className="fm-field">
              <Label htmlFor="webhook-url">URL</Label>
              <Input
                id="webhook-url"
                type="url"
                placeholder="https://example.com/webhook"
                value={webhookUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSettings("webhook_url", e.target.value)}
              />
            </div>
            <div className="fm-field">
              <Label htmlFor="webhook-headers">
                Extra headers <span className="font-normal text-muted-foreground">(JSON, optional)</span>
              </Label>
              <textarea
                id="webhook-headers"
                rows={3}
                placeholder={'{"Authorization": "Bearer token"}'}
                value={webhookHeaders}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateSettings("webhook_headers", e.target.value)}
                className="fm-textarea"
              />
            </div>
          </>
        )}
      </section>

      {formId && (
        <section className="fm-sec">
          <div className="fm-sec-head">
            <div>
              <h3>Recent deliveries</h3>
              <p>Each attempt with the response code and how long it took.</p>
            </div>
            <div className="flex shrink-0" style={{ gap: 2 }}>
              {showLogs && (
                <button type="button" data-slot="text-action" onClick={fetchLogs} disabled={logsLoading}>
                  <RefreshCw size={14} className={logsLoading ? "animate-spin" : ""} /> Refresh
                </button>
              )}
              <button type="button" data-slot="text-action" onClick={() => setShowLogs((v) => !v)}>
                {showLogs ? "Hide" : "Show deliveries"}
              </button>
            </div>
          </div>
          {showLogs &&
            (logsLoading ? (
              <p className="fm-hint">Loading…</p>
            ) : logs.length === 0 ? (
              <p className="fm-hint">No deliveries yet.</p>
            ) : (
              <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
                <ListTable minWidth={480}>
                  <thead>
                    <tr>
                      <Th width={80}>Status</Th>
                      <Th>URL</Th>
                      <Th width={90}>Duration</Th>
                      <Th width={170}>Time</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => {
                      const ok = log.status_code >= 200 && log.status_code < 300;
                      return (
                        <Tr key={log.id}>
                          <Td>
                            <span className="flex items-center gap-1.5" style={{ color: ok ? "var(--success)" : "var(--danger)" }}>
                              {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                              <span className="font-mono text-[12.5px]">{log.status_code || "ERR"}</span>
                            </span>
                          </Td>
                          <Td className="max-w-[180px]">
                            <span className="text-[12.5px] text-muted-foreground truncate block" title={log.url}>
                              {log.url}
                            </span>
                            {log.error && (
                              <span className="text-[12px] block truncate" style={{ color: "var(--danger)" }}>
                                {log.error}
                              </span>
                            )}
                          </Td>
                          <Td className="font-mono text-[12.5px] text-muted-foreground">{log.duration_ms} ms</Td>
                          <Td className="text-[12.5px] text-muted-foreground">{new Date(log.created_at).toLocaleString()}</Td>
                        </Tr>
                      );
                    })}
                  </tbody>
                </ListTable>
              </div>
            ))}
        </section>
      )}
    </div>
  );
}
