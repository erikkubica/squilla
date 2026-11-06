import { useState, type ChangeEvent, type FormEvent } from "react";
import { ArrowRight } from "@squilla/icons";
import { api } from "../api/client";
import type { BreakdownResponse } from "../api/types";
import { useAsync } from "../hooks/useAsync";
import type { ViewModel } from "../hooks/useViewState";
import { withCarry } from "../lib/params";
import { BASE_PATH, ui, useNavigate } from "../shared";

const { Input } = ui;

/** "/en/blog", "en/blog" or a full address → "/en/blog". */
export function toPath(v: string): string {
  const s = v.trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) {
    try {
      return new URL(s).pathname || "/";
    } catch {
      return s;
    }
  }
  return s.startsWith("/") ? s : `/${s}`;
}

/** Opens the report for one page; suggests the most viewed pages. */
export function PagePicker({ vm, current = "", compact = false }: { vm: ViewModel; current?: string; compact?: boolean }) {
  const navigate = useNavigate();
  const [draft, setDraft] = useState(current);
  const q = new URLSearchParams(vm.query);
  q.delete("compare");
  const list = useAsync<BreakdownResponse | null>((s) => api.breakdown("page", q, { limit: 50, sort: "pageviews" }, s).catch(() => null), `picker|${q}`);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const path = toPath(draft);
    if (!path || path === current) return;
    navigate(withCarry(`${BASE_PATH}/page?path=${encodeURIComponent(path)}`, vm.searchParams));
  };

  return (
    <form onSubmit={submit} className="an-card an-picker" data-compact={compact ? "" : undefined} role="search" aria-label="Open a page report">
      {compact ? (
        <label htmlFor="an-page-pick" className="an-picker-inline">Another page</label>
      ) : (
        <>
          <label htmlFor="an-page-pick" className="an-picker-title">Look at one page</label>
          <p className="an-picker-desc">See where its visitors came from, how far they scrolled, what they clicked and how their visits ended.</p>
        </>
      )}
      <div className="an-picker-row">
        <div>
          <Input
            id="an-page-pick"
            list="an-page-list"
            value={draft}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)}
            placeholder="Type or paste a page, e.g. /en/blog"
            autoComplete="off"
          />
        </div>
        <button type="submit" className="an-btn an-focus" data-variant={compact ? "outline" : "primary"} disabled={!draft.trim()}>
          {compact ? "Switch page" : "Open report"}
          <ArrowRight aria-hidden="true" />
        </button>
      </div>
      <datalist id="an-page-list">
        {(list.data?.rows ?? []).filter((r) => r.value).map((r) => (
          <option key={r.value} value={r.value}>{r.label && r.label !== r.value ? r.label : undefined}</option>
        ))}
      </datalist>
    </form>
  );
}
