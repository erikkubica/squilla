import { useMemo, useState, type ChangeEvent } from "react";
import { Check, ChevronDown, Copy, TriangleAlert } from "@squilla/icons";
import { api, errorMessage } from "../../api/client";
import type { AnalyticsSettings } from "../../api/types";
import { setCachedTimezone } from "../../hooks/useSiteTimezone";
import { Panel } from "../../components/Panel";
import { toast, ui } from "../../shared";
import { ListInput, Row, ToggleRow, cleanList } from "./fields";
import { PRIVACY_NOTICE } from "./PrivacyExplainer";

const { Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } = ui;

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

function browserZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    return "";
  }
}

function CopyField({ id, label, value, rows }: { id: string; label: string; value: string; rows?: number }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn’t copy. Select the text and copy it yourself.");
    }
  };
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-xs font-medium text-an-ink">{label}</label>
        <button type="button" className="an-btn an-focus" data-variant="ghost" data-size="sm" onClick={() => void copy()}>
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      {rows ? (
        <textarea id={id} readOnly rows={rows} value={value} className="an-focus w-full rounded-md border border-an-line bg-an-surface p-2 text-xs leading-relaxed text-an-ink-2" onFocus={(e) => e.currentTarget.select()} />
      ) : (
        <input id={id} readOnly value={value} className="an-focus h-8 w-full rounded-md border border-an-line bg-an-surface px-2 font-mono text-xs text-an-ink-2" onFocus={(e) => e.currentTarget.select()} />
      )}
    </div>
  );
}

export function SettingsForm({ initial, onSaved }: { initial: AnalyticsSettings; onSaved: (s: AnalyticsSettings) => void }) {
  const [s, setS] = useState<AnalyticsSettings>(initial);
  const [busy, setBusy] = useState(false);
  const zones = useMemo(() => timezones(initial.timezone), [initial.timezone]);
  const here = useMemo(browserZone, []);
  const dirty = JSON.stringify(s) !== JSON.stringify(initial);
  const set = <K extends keyof AnalyticsSettings>(k: K, v: AnalyticsSettings[K]) => setS((p) => ({ ...p, [k]: v }));
  const num = (k: "raw_retention_days" | "session_timeout_minutes", min: number, max: number) => (e: ChangeEvent<HTMLInputElement>) =>
    set(k, clampInt(e.target.value, min, max, initial[k]));
  const prefix = "/" + (s.beacon_prefix || "/_s").trim().replace(/^\/+|\/+$/g, "");
  const optOutUrl = `${typeof window !== "undefined" ? window.location.origin : ""}${prefix}/optout`;

  const save = async () => {
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
    <form onSubmit={(e) => { e.preventDefault(); void save(); }} className="an-stack">
      <div id="timezone" className="an-anchor">
        <Panel title="Basics" subtitle="Where your days start and whose visits count" bodyClassName="divide-y divide-an-line px-4">
          <Row
            id="an-tz"
            label="Timezone"
            hint={
              <>
                Days in your reports start at midnight here.
                {here && here !== s.timezone && (
                  <>
                    {" "}
                    <button type="button" className="an-focus cursor-pointer font-medium text-an-accent underline-offset-2 hover:underline" onClick={() => set("timezone", here)}>
                      Use {here.replace(/_/g, " ")}
                    </button>
                  </>
                )}
              </>
            }
          >
            <Select value={s.timezone || "UTC"} onValueChange={(v: string) => set("timezone", v)}>
              <SelectTrigger id="an-tz" aria-describedby="an-tz-hint"><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-80">{zones.map((z) => <SelectItem key={z} value={z}>{z.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
            </Select>
          </Row>
          <ToggleRow id="an-logged" label="Skip my own visits" hint="Visits from anyone logged in to this admin aren’t counted." checked={s.exclude_logged_in} onChange={(v) => set("exclude_logged_in", v)} />
          <ToggleRow
            id="an-gpc"
            label="Respect Global Privacy Control"
            hint="Some browsers send a “don’t track me” signal. Their visits are only added to totals, never counted as a visitor."
            checked={s.respect_gpc}
            onChange={(v) => set("respect_gpc", v)}
          />
        </Panel>
      </div>

      <div id="in-page" className="an-anchor">
        <Panel title="In-page measurement" subtitle="See how far people scroll, how long they stay and what they click" bodyClassName="divide-y divide-an-line px-4">
          <ToggleRow
            id="an-enhanced"
            label="Measure what people do on your pages"
            hint="Adds a tiny stylesheet to your pages. The browser then lets your own server know when a section comes into view, after 10 s, 30 s, 1 min and 3 min, and when a link is clicked. No scripts, no cookies and nothing that identifies a person."
            checked={s.enhanced_mode}
            onChange={(v) => set("enhanced_mode", v)}
          >
            <div className="an-note mt-3" data-tone="warn" role="note">
              <TriangleAlert className="an-note-icon" aria-hidden="true" />
              <div className="min-w-0 space-y-3">
                <p>
                  <strong className="text-an-ink">{s.enhanced_mode ? "Make sure your privacy page mentions it." : "Before you turn it on, tell your visitors."}</strong> Add this paragraph to your privacy page, with a link to the opt-out page.
                  That is what makes this kind of measurement allowed without asking for consent under the French CNIL’s rules. Visitors who opt out or send Global Privacy
                  Control get none of it.
                </p>
                <CopyField id="an-notice" label="Paragraph for your privacy page" value={PRIVACY_NOTICE} rows={5} />
                <CopyField id="an-optout" label="Opt-out page to link to" value={optOutUrl} />
              </div>
            </div>
          </ToggleRow>
          {s.enhanced_mode && (
            <>
              <div className="pt-3 text-[11.5px] font-semibold tracking-wide text-an-subtle uppercase">What to measure</div>
              <ToggleRow id="an-sig-dwell" label="Time on page" hint="Marks at 10 s, 30 s, 1 min and 3 min." checked={s.signal_dwell} onChange={(v) => set("signal_dwell", v)} />
              <ToggleRow id="an-sig-sections" label="Sections seen and scroll depth" hint="Which parts of a page came into view." checked={s.signal_sections} onChange={(v) => set("signal_sections", v)} />
              <ToggleRow id="an-sig-clicks" label="Link clicks" hint="Which links people click, including links to other sites." checked={s.signal_clicks} onChange={(v) => set("signal_clicks", v)} />
              <ToggleRow id="an-sig-forms" label="Forms started and FAQs opened" hint="The first time someone starts filling in a form or opens an FAQ answer." checked={s.signal_forms} onChange={(v) => set("signal_forms", v)} />
            </>
          )}
        </Panel>
      </div>

      <details id="advanced" className="an-card an-anchor an-faq">
        <summary className="an-focus">
          <span>
            Advanced settings
            <span className="block text-xs font-normal text-an-muted">Visit length, data retention, excluded pages, file types and more</span>
          </span>
          <ChevronDown aria-hidden="true" />
        </summary>
        <div className="divide-y divide-an-line border-t border-an-line px-4">
          <Row id="an-session" label="Visit ends after (minutes)" hint="A new visit starts when someone comes back after this much time without opening a page.">
            <Input id="an-session" type="number" min={5} max={240} value={s.session_timeout_minutes} onChange={num("session_timeout_minutes", 5, 240)} aria-describedby="an-session-hint" className="w-32" />
          </Row>
          <Row id="an-retention" label="Keep detailed records for (days)" hint="After this, single page views are deleted and only daily totals stay. Filtering and page reports need the detailed records.">
            <Input id="an-retention" type="number" min={1} max={3650} value={s.raw_retention_days} onChange={num("raw_retention_days", 1, 3650)} aria-describedby="an-retention-hint" className="w-32" />
          </Row>
          <Row id="an-exclude" label="Pages not to count" hint="One per line. Use * to match anything, e.g. /preview/*.">
            <ListInput id="an-exclude" value={s.exclude_paths} onChange={(v) => set("exclude_paths", v)} placeholder="/preview/*" />
          </Row>
          <Row id="an-hosts" label="Your domains" hint="One per line. Visits coming from these count as moving around your own site, not as referrals.">
            <ListInput id="an-hosts" value={s.own_hosts} onChange={(v) => set("own_hosts", v)} placeholder="example.com" />
          </Row>
          <Row id="an-dl" label="Files counted as downloads" hint="File types, one per line, e.g. pdf.">
            <ListInput id="an-dl" value={s.download_extensions} onChange={(v) => set("download_extensions", v)} placeholder="pdf" />
          </Row>
          <Row id="an-geo" label="Country database (optional)" hint="Path to a MaxMind .mmdb file on the server. Without it, the country comes from your CDN (e.g. Cloudflare) when available.">
            <Input id="an-geo" value={s.geoip_db_path} onChange={(e: ChangeEvent<HTMLInputElement>) => set("geoip_db_path", e.target.value)} placeholder="/data/GeoLite2-Country.mmdb" className="font-mono text-[13px]" aria-describedby="an-geo-hint" />
          </Row>
          <Row id="an-prefix" label="Measurement address" hint="Where in-page measurement reports to. Change it only if an ad blocker list starts blocking the default.">
            <Input id="an-prefix" value={s.beacon_prefix} onChange={(e: ChangeEvent<HTMLInputElement>) => set("beacon_prefix", e.target.value)} placeholder="/_s" className="w-40 font-mono text-[13px]" aria-describedby="an-prefix-hint" />
          </Row>
        </div>
      </details>

      {(dirty || busy) && (
        <section className="an-savebar" aria-label="Unsaved changes">
          <span className="an-savebar-text" role="status">You have unsaved changes</span>
          <button type="button" className="an-btn an-focus" data-variant="on-dark" disabled={busy} onClick={() => setS(initial)}>
            Undo changes
          </button>
          <button type="submit" className="an-btn an-focus" data-variant="primary" disabled={busy}>
            {busy ? "Saving…" : "Save settings"}
          </button>
        </section>
      )}
    </form>
  );
}
