import { useState, type ChangeEvent } from "react";
import { TriangleAlert } from "@squilla/icons";
import { api, errorMessage, forgetShared } from "../../api/client";
import type { ResetScope } from "../../api/types";
import { Panel } from "../../components/Panel";
import { toast, ui } from "../../shared";

const { Input } = ui;

const SCOPES: { scope: ResetScope; title: string; desc: string }[] = [
  { scope: "recordings", title: "Session recordings", desc: "Every replay and the heatmaps built from them." },
  { scope: "behaviour", title: "In-page measurement", desc: "Sections seen, clicks, time on page and how visits ended." },
  { scope: "all", title: "Everything", desc: "All visits, page views, bots, in-page measurement and recordings. Start from zero." },
];

/** Wipes collected data. Settings, goals and tracked links stay. */
export function ResetPanel({ onDone }: { onDone?: () => void }) {
  const [scope, setScope] = useState<ResetScope | null>(null);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const word = "reset";
  const run = async () => {
    if (!scope) return;
    setBusy(true);
    try {
      await api.reset(scope);
      forgetShared();
      toast.success(scope === "all" ? "All analytics data deleted" : "Data deleted");
      setScope(null);
      setTyped("");
      onDone?.();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div id="reset" className="an-anchor">
      <Panel title="Reset data" subtitle="Delete what has been collected. Settings, goals and tracked links are kept." bodyClassName="divide-y divide-an-line px-4">
        {SCOPES.map((x) => (
          <div key={x.scope} className="py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-an-ink">{x.title}</div>
                <div className="text-xs text-an-muted">{x.desc}</div>
              </div>
              {scope !== x.scope && (
                <button type="button" className="an-btn an-focus" data-variant="ghost" data-size="sm" onClick={() => { setScope(x.scope); setTyped(""); }}>
                  Delete…
                </button>
              )}
            </div>
            {scope === x.scope && (
              <div className="an-note mt-3" data-tone="warn" role="alert">
                <TriangleAlert className="an-note-icon" aria-hidden="true" />
                <div className="min-w-0 space-y-2">
                  <p><strong className="text-an-ink">This can’t be undone.</strong> Type <code className="font-mono">{word}</code> to confirm.</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      aria-label={`Type ${word} to confirm`}
                      value={typed}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setTyped(e.target.value)}
                      className="w-40 font-mono text-[13px]"
                      autoFocus
                    />
                    <button type="button" className="an-btn an-focus" data-variant="danger" data-size="sm" disabled={busy || typed.trim().toLowerCase() !== word} onClick={() => void run()}>
                      {busy ? "Deleting…" : `Delete ${x.title.toLowerCase()}`}
                    </button>
                    <button type="button" className="an-btn an-focus" data-variant="ghost" data-size="sm" disabled={busy} onClick={() => setScope(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </Panel>
    </div>
  );
}
