import { useEffect, useState } from "react";
import { api, errorMessage } from "../api/client";
import type { AnalyticsSettings } from "../api/types";
import { PageShell } from "../components/PageShell";
import { ErrorNote, Skeleton } from "../components/Panel";
import { useAsync } from "../hooks/useAsync";
import { KnownLimits, PrivacyExplainer } from "./settings/PrivacyExplainer";
import { SettingsForm } from "./settings/SettingsForm";
import { StatusPanel } from "./settings/StatusPanel";

const DEFAULTS: AnalyticsSettings = {
  timezone: "UTC",
  exclude_paths: [],
  exclude_logged_in: true,
  respect_gpc: true,
  raw_retention_days: 90,
  session_timeout_minutes: 30,
  enhanced_mode: false,
  beacon_prefix: "/_s",
  download_extensions: [],
  own_hosts: [],
  geoip_db_path: "",
};

/** Fill gaps (null arrays, missing keys) so the form is always controlled. */
function normalize(s: Partial<AnalyticsSettings> | null): AnalyticsSettings {
  const m = { ...DEFAULTS, ...(s ?? {}) };
  return {
    ...m,
    exclude_paths: m.exclude_paths ?? [],
    download_extensions: m.download_extensions ?? [],
    own_hosts: m.own_hosts ?? [],
    geoip_db_path: m.geoip_db_path ?? "",
    beacon_prefix: m.beacon_prefix || "/_s",
  };
}

export default function AnalyticsSettingsPage() {
  const settings = useAsync((s) => api.settings(s), "settings");
  const status = useAsync((s) => api.status(s), "status");
  const [current, setCurrent] = useState<AnalyticsSettings | null>(null);

  useEffect(() => {
    if (settings.data) setCurrent(normalize(settings.data));
  }, [settings.data]);

  return (
    <PageShell active="settings" title="Analytics settings">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          {settings.error && !settings.data ? (
            <ErrorNote message={errorMessage(settings.error)} onRetry={() => settings.reload()} />
          ) : !current ? (
            <div className="space-y-4"><Skeleton className="h-72" /><Skeleton className="h-48" /></div>
          ) : (
            <SettingsForm
              key={JSON.stringify(current)}
              initial={current}
              onSaved={(s) => {
                setCurrent(s);
                status.reload(true);
              }}
            />
          )}
        </div>
        <div className="space-y-4">
          <StatusPanel status={status.data} error={status.error} loading={status.loading} onRefresh={() => status.reload(true)} />
          <PrivacyExplainer />
          <KnownLimits />
        </div>
      </div>
    </PageShell>
  );
}
