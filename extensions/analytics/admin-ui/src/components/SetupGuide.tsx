import { useState, type ReactNode } from "react";
import { Check, X } from "@squilla/icons";
import { api, errorMessage } from "../api/client";
import type { AnalyticsSettings, StatusResponse } from "../api/types";
import { setCachedTimezone } from "../hooks/useSiteTimezone";
import { toast } from "../shared";
import { NavButton } from "./Notice";

const HIDE_KEY = "squilla.analytics.setupHidden";

function browserZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function readHidden(): boolean {
  try {
    return localStorage.getItem(HIDE_KEY) === "1";
  } catch {
    return false;
  }
}

interface Props {
  status: StatusResponse | null;
  settings: AnalyticsSettings | null;
  goalCount: number | null;
  hasVisits: boolean;
  onChanged: () => void;
}

interface Step {
  id: string;
  title: string;
  done: boolean;
  desc: string;
  actions?: ReactNode;
}

/** First-run checklist; disappears once everything is done or it's hidden. */
export function SetupGuide({ status, settings, goalCount, hasVisits, onChanged }: Props) {
  const [hidden, setHidden] = useState(readHidden);
  const [busy, setBusy] = useState(false);
  if (hidden || !status || !settings || goalCount == null) return null;

  const zone = browserZone();
  const applyZone = async () => {
    setBusy(true);
    try {
      await api.saveSettings({ ...settings, timezone: zone });
      setCachedTimezone(zone);
      toast.success(`Timezone set to ${zone.replace(/_/g, " ")}`);
      onChanged();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const steps: Step[] = [
    {
      id: "recording",
      title: "Visits are being recorded",
      done: hasVisits || !!status.last_record_at,
      desc: "There is nothing to install. To test it, open your website in a private window: your own visits are skipped while you’re logged in.",
    },
    {
      id: "timezone",
      title: "Use your timezone",
      done: settings.timezone !== "UTC" || zone === "UTC",
      desc: "Reports count days from midnight in this timezone. It’s still set to UTC.",
      actions: (
        <>
          <button type="button" className="an-btn an-focus" data-variant="primary" data-size="sm" disabled={busy} onClick={() => void applyZone()}>
            Use {zone.replace(/_/g, " ")}
          </button>
          <NavButton to="/settings#timezone" size="sm" variant="ghost">Choose another</NavButton>
        </>
      ),
    },
    {
      id: "in-page",
      title: "See what people do on your pages",
      done: settings.enhanced_mode,
      desc: "Turn on in-page measurement to see how far people scroll, how long they stay and what they click. No cookies or scripts are added.",
      actions: <NavButton to="/settings#in-page" size="sm" variant="primary">Review and turn on</NavButton>,
    },
    {
      id: "goal",
      title: "Add your first goal",
      done: goalCount > 0,
      desc: "Tell Analytics what success looks like, such as a sent form, a WhatsApp chat or a booking click.",
      actions: <NavButton to="/goals?new=1" size="sm" variant="primary">Add a goal</NavButton>,
    },
  ];
  const done = steps.filter((s) => s.done).length;
  if (done === steps.length) return null;

  const hide = () => {
    try {
      localStorage.setItem(HIDE_KEY, "1");
    } catch {
      /* private mode: hide for this visit only */
    }
    setHidden(true);
  };

  return (
    <section className="an-card an-setup" aria-labelledby="an-setup-title">
      <div className="an-setup-head">
        <div>
          <h2 id="an-setup-title">Get Analytics ready</h2>
          <p>{done} of {steps.length} done. Each step takes under a minute.</p>
        </div>
        <button type="button" className="an-btn an-focus" data-variant="ghost" data-size="sm" onClick={hide}>
          <X aria-hidden="true" /> Hide
        </button>
      </div>
      <div className="an-progress" role="progressbar" aria-label="Setup progress" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={done}>
        <span style={{ width: `${(done / steps.length) * 100}%` }} />
      </div>
      <ol className="an-steps">
        {steps.map((s, i) => (
          <li key={s.id} className="an-step" data-done={s.done ? "" : undefined}>
            <span className="an-step-check" aria-hidden="true">{s.done ? <Check /> : i + 1}</span>
            <div className="min-w-0">
              <div className="an-step-title">
                {s.title}
                <span className="an-sr-only">{s.done ? " (done)" : " (to do)"}</span>
              </div>
              {!s.done && <p className="an-step-desc">{s.desc}</p>}
              {!s.done && s.actions && <div className="an-step-actions">{s.actions}</div>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
