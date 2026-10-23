import { useMemo, useState, type ChangeEvent } from "react";
import { AlertTriangle } from "@squilla/icons";
import { api, errorMessage } from "../../api/client";
import type { AnalyticsSettings } from "../../api/types";
import { setCachedTimezone } from "../../hooks/useSiteTimezone";
import { Panel } from "../../components/Panel";
import { toast, ui } from "../../shared";
import { ListInput, Row, ToggleRow, cleanList } from "./fields";

const { Input, Button, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } = ui;

function timezones(current: string): string[] {
  let list: string[] = [];
  try {
    list = Intl.supportedValuesOf("timeZone");
  } catch {
    list = [];
  }
  const set = new Set(["UTC", ...list]);
  if (current) set.add(current);
  return [...set];
}

function clampInt(v: string, min: number, max: number, fallback: number): number {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

export function SettingsForm({ initial, onSaved }: { initial: AnalyticsSettings; onSaved: (s: AnalyticsSettings) => void }) {
  const [s, setS] = useState<AnalyticsSettings>(initial);
  const [busy, setBusy] = useState(false);
  const zones = useMemo(() => timezones(initial.timezone), [initial.timezone]);
  const dirty = JSON.stringify(s) !== JSON.stringify(initial);
  const set = <K extends keyof AnalyticsSettings>(k: K, v: AnalyticsSettings[K]) => setS((p) => ({ ...p, [k]: v }));
  const num = (k: "raw_retention_days" | "session_timeout_minutes", min: number, max: number) => (e: ChangeEvent<HTMLInputElement>) =>
    set(k, clampInt(e.target.value, min, max, initial[k]));

  const save = async () => {
    const prefix = "/" + s.beacon_prefix.trim().replace(/^\/+|\/+$/g, "");
    const body: AnalyticsSettings = {
      ...s,
      beacon_prefix: prefix === "/" ? "/_s" : prefix,
      exclude_paths: cleanList(s.exclude_paths),
      download_extensions: cleanList(s.download_extensions.map((x) => x.replace(/^\./, "")), true),
      own_hosts: cleanList(s.own_hosts, true),
      geoip_db_path: s.geoip_db_path.trim(),
    };
    setBusy(true);
    try {
      const saved = await api.saveSettings(body);
      const next = saved && typeof saved === "object" && "timezone" in saved ? saved : body;
      setCachedTimezone(next.timezone);
      setS(next);
      onSaved(next);
      toast.success("Settings saved");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); void save(); }} className="space-y-4">
      <Panel title="Collection" bodyClassName="divide-y divide-an-line px-4">
        <Row id="an-tz" label="Site timezone" hint="Defines where a day starts for reports and when the daily visitor salt rotates.">
          <Select value={s.timezone || "UTC"} onValueChange={(v: string) => set("timezone", v)}>
            <SelectTrigger id="an-tz" aria-describedby="an-tz-hint"><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-80">{zones.map((z) => <SelectItem key={z} value={z}>{z.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
          </Select>
        </Row>
        <ToggleRow id="an-logged" label="Exclude logged-in users" hint="Requests from signed-in editors and admins are ignored." checked={s.exclude_logged_in} onChange={(v) => set("exclude_logged_in", v)} />
        <ToggleRow id="an-gpc" label="Respect Global Privacy Control" hint="Browsers sending Sec-GPC: 1 are counted in totals only — no visitor or visit identifier." checked={s.respect_gpc} onChange={(v) => set("respect_gpc", v)} />
        <Row id="an-exclude" label="Excluded paths" hint="One glob per line, e.g. /preview/* or /internal/**. Matching requests are never recorded.">
          <ListInput id="an-exclude" value={s.exclude_paths} onChange={(v) => set("exclude_paths", v)} placeholder="/preview/*" />
        </Row>
        <Row id="an-session" label="Visit timeout (minutes)" hint="A new visit starts after this much inactivity.">
          <Input id="an-session" type="number" min={5} max={240} value={s.session_timeout_minutes} onChange={num("session_timeout_minutes", 5, 240)} aria-describedby="an-session-hint" className="w-32" />
        </Row>
        <Row id="an-retention" label="Raw event retention (days)" hint="Individual events are deleted after this period; daily totals are kept. Filtered reports need raw events.">
          <Input id="an-retention" type="number" min={1} max={3650} value={s.raw_retention_days} onChange={num("raw_retention_days", 1, 3650)} aria-describedby="an-retention-hint" className="w-32" />
        </Row>
      </Panel>

      <Panel title="Sources & files" bodyClassName="divide-y divide-an-line px-4">
        <Row id="an-hosts" label="Own hosts" hint="Your domains (one per line). Referrers from these are treated as internal navigation.">
          <ListInput id="an-hosts" value={s.own_hosts} onChange={(v) => set("own_hosts", v)} placeholder="example.com" />
        </Row>
        <Row id="an-dl" label="Download extensions" hint="Requests for these file types are counted as downloads.">
          <ListInput id="an-dl" value={s.download_extensions} onChange={(v) => set("download_extensions", v)} placeholder="pdf" />
        </Row>
        <Row id="an-geo" label="GeoIP database path" hint="Optional MaxMind .mmdb file on the server. Without it, country comes from CF-IPCountry when behind Cloudflare.">
          <Input id="an-geo" value={s.geoip_db_path} onChange={(e: ChangeEvent<HTMLInputElement>) => set("geoip_db_path", e.target.value)} placeholder="/data/GeoLite2-Country.mmdb" className="font-mono text-[13px]" aria-describedby="an-geo-hint" />
        </Row>
      </Panel>

      <Panel title="Enhanced mode" bodyClassName="divide-y divide-an-line px-4">
        <ToggleRow
          id="an-enhanced"
          label="Confirm views with a CSS beacon"
          hint="Adds a tiny stylesheet rule that loads an image from your own domain when a page is actually rendered. Confirms real views (vs. prefetches), and records viewport size, light/dark preference and printing. Still no JavaScript and no cookies."
          checked={s.enhanced_mode}
          onChange={(v) => set("enhanced_mode", v)}
        >
          <div className="mt-3 flex gap-2.5 rounded-md bg-an-warn-bg p-3 text-xs leading-relaxed text-an-warn" role="note">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>
              <strong>Consent may be required.</strong> The beacon makes the visitor’s browser send an extra request that reads device characteristics. Under the
              EU ePrivacy Directive (Art. 5(3)) and similar laws, accessing information on a user’s device for analytics generally needs prior consent unless strictly
              necessary. Check with your legal adviser before enabling it for EU/UK visitors, and mention it in your privacy notice.
            </p>
          </div>
        </ToggleRow>
        <Row id="an-prefix" label="Beacon path prefix" hint="Neutral path used for beacon requests. Change it if an ad blocker list targets the default.">
          <Input id="an-prefix" value={s.beacon_prefix} onChange={(e: ChangeEvent<HTMLInputElement>) => set("beacon_prefix", e.target.value)} placeholder="/_s" className="w-40 font-mono text-[13px]" aria-describedby="an-prefix-hint" disabled={!s.enhanced_mode} />
        </Row>
      </Panel>

      <div className="sticky bottom-0 z-10 -mx-1 flex items-center justify-end gap-2 bg-an-canvas/90 px-1 py-3 backdrop-blur">
        {dirty && <span className="mr-auto text-xs text-an-muted">Unsaved changes</span>}
        <Button type="button" variant="outline" disabled={!dirty || busy} onClick={() => setS(initial)}>Reset</Button>
        <Button type="submit" disabled={!dirty || busy}>{busy ? "Saving…" : "Save settings"}</Button>
      </div>
    </form>
  );
}
