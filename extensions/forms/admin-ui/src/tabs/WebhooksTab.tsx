import React, { useEffect, useState } from "react";
import { Webhook, RefreshCw, CheckCircle2, XCircle } from "@squilla/icons";

const {
  Card,
  CardContent,
  SectionHeader,
  Input,
  Label,
  Switch,
  Button,
  Th,
  Tr,
  Td,
  ListCard,
  ListTable,
  LoadingRow,
  EmptyState,
} = (window as any).__SQUILLA_SHARED__.ui;

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
    <div className="space-y-6 max-w-2xl">
      {/* Config */}
      <Card className="rounded-xl border border-border shadow-sm">
        <SectionHeader
          title="Webhook Configuration"
          icon={<Webhook className="h-4 w-4 text-foreground" />}
        />
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium text-foreground">Enable Webhook</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Send a POST request to a URL after each submission
              </p>
            </div>
            <Switch
              checked={webhookEnabled}
              onCheckedChange={(v: boolean) => updateSettings("webhook_enabled", v)}
            />
          </div>

          {webhookEnabled && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Webhook URL</Label>
                <Input
                  id="webhook-url"
                  type="url"
                  placeholder="https://example.com/webhook"
                  value={webhookUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateSettings("webhook_url", e.target.value)
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Additional Headers{" "}
                  <span className="font-normal text-muted-foreground">(JSON)</span>
                </Label>
                <textarea
                  id="webhook-headers"
                  rows={3}
                  placeholder={'{"Authorization": "Bearer token"}'}
                  value={webhookHeaders}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    updateSettings("webhook_headers", e.target.value)
                  }
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2  resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Optional JSON object of extra HTTP headers to include
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Logs */}
      {formId && (
        <Card className="rounded-xl border border-border shadow-sm">
          <SectionHeader
            title="Webhook Logs"
            actions={
              <div className="flex gap-2">
                {showLogs && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchLogs}
                    disabled={logsLoading}
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 mr-1 ${logsLoading ? "animate-spin" : ""}`}
                    />
                    Refresh
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setShowLogs((v) => !v)}>
                  {showLogs ? "Hide Logs" : "View Logs"}
                </Button>
              </div>
            }
          />
          {showLogs && (
            <CardContent className="p-0">
              {logsLoading ? (
                <LoadingRow />
              ) : logs.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-[13px] text-muted-foreground">
                  No webhook logs yet
                </div>
              ) : (
                <ListTable minWidth={480}>
                  <thead>
                    <tr>
                      <Th width={80}>Status</Th>
                      <Th>URL</Th>
                      <Th width={80}>Duration</Th>
                      <Th width={160}>Time</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <Tr key={log.id}>
                        <Td>
                          <span className="flex items-center gap-1.5">
                            {log.status_code >= 200 && log.status_code < 300 ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5 text-red-600" />
                            )}
                            <span
                              className={`text-[12px] font-mono ${
                                log.status_code >= 200 && log.status_code < 300
                                  ? "text-emerald-700"
                                  : "text-red-600"
                              }`}
                            >
                              {log.status_code || "ERR"}
                            </span>
                          </span>
                        </Td>
                        <Td className="max-w-[180px]">
                          <span
                            className="text-[12px] text-muted-foreground truncate block"
                            title={log.url}
                          >
                            {log.url}
                          </span>
                          {log.error && (
                            <span className="text-[11px] text-red-600 block truncate">
                              {log.error}
                            </span>
                          )}
                        </Td>
                        <Td className="font-mono text-[12px] text-muted-foreground">
                          {log.duration_ms}ms
                        </Td>
                        <Td className="font-mono text-[12px] text-muted-foreground">
                          {new Date(log.created_at).toLocaleString()}
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </ListTable>
              )}
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
