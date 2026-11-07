import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Glyph, Modal, SearchInput } from "../ui";
import { getRecentEmoji, loadEmojiData, pushRecentEmoji, searchEmoji, type EmojiGroup, type EmojiItem } from "./emojiData";

const RECENT_TAB = "__recent__";

/**
 * Emoji field: a button showing the current emoji that opens a picker of
 * native system emoji (no images, no web fonts), plus a small text box
 * for typing or pasting one. The stored value is the emoji string.
 */
export function EmojiField({ id, value, onChange, placeholder }: { id: string; value: string; onChange: (next: string) => void; placeholder?: string }): React.JSX.Element {
  const [open, setOpen] = useState(false);
  return (
    <div className="vedit-emoji-field">
      <button type="button" className="vedit-emoji-trigger" onClick={() => setOpen(true)} aria-label={value ? `Change emoji (${value})` : "Choose an emoji"} title="Choose an emoji">
        {value ? <span>{value}</span> : <Glyph name="smile" size={18} strokeWidth={1.7} />}
      </button>
      <input id={id} type="text" className="vedit-input" value={value} placeholder={placeholder || "Type or paste an emoji"} onChange={(e) => onChange(e.target.value)} />
      {value && (
        <button type="button" className="vedit-icon-btn" data-size="sm" onClick={() => onChange("")} aria-label="Clear emoji" title="Clear">
          <Glyph name="x" size={15} />
        </button>
      )}
      {open && (
        <EmojiPicker
          onPick={(e) => {
            onChange(e);
            pushRecentEmoji(e);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function EmojiPicker({ onPick, onClose }: { onPick: (emoji: string) => void; onClose: () => void }): React.JSX.Element {
  const [groups, setGroups] = useState<EmojiGroup[] | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [recent] = useState<string[]>(() => getRecentEmoji());
  const [tab, setTab] = useState<string>(() => (getRecentEmoji().length ? RECENT_TAB : "smileys_emotion"));
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    loadEmojiData()
      .then((g) => !cancelled && setGroups(g))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    gridRef.current?.scrollTo({ top: 0 });
  }, [tab, query]);

  const nameByEmoji = useMemo(() => {
    const m = new Map<string, string>();
    groups?.forEach((g) => g.items.forEach((it) => m.set(it.e, it.n)));
    return m;
  }, [groups]);

  const items: EmojiItem[] = useMemo(() => {
    if (!groups) return [];
    if (query.trim()) return searchEmoji(groups, query);
    if (tab === RECENT_TAB) return recent.map((e) => ({ e, n: nameByEmoji.get(e) ?? e, k: "" }));
    return groups.find((g) => g.slug === tab)?.items ?? [];
  }, [groups, query, tab, recent, nameByEmoji]);

  const heading = query.trim() ? `Results for “${query.trim()}”` : tab === RECENT_TAB ? "Recently used" : groups?.find((g) => g.slug === tab)?.name ?? "";

  return (
    <Modal title="Choose an emoji" size="sm" onClose={onClose} className="vedit-emoji-modal">
      <SearchInput value={query} onChange={setQuery} placeholder="Search (e.g. noodles, flag, heart)" autoFocus onEnter={() => items[0] && onPick(items[0].e)} />
      {groups && (
        <div className="vedit-emoji-tabs" role="tablist" aria-label="Emoji categories">
          {recent.length > 0 && (
            <button type="button" role="tab" aria-selected={!query && tab === RECENT_TAB} title="Recently used" onClick={() => { setQuery(""); setTab(RECENT_TAB); }}>
              🕘
            </button>
          )}
          {groups.map((g) => (
            <button key={g.slug} type="button" role="tab" aria-selected={!query && tab === g.slug} title={g.name} onClick={() => { setQuery(""); setTab(g.slug); }}>
              {g.tab}
            </button>
          ))}
        </div>
      )}
      <div className="vedit-emoji-heading">{heading}</div>
      <div ref={gridRef} className="vedit-emoji-scroll">
        {error ? (
          <p className="vedit-empty">Couldn't load the emoji list. You can still type or paste an emoji.</p>
        ) : !groups ? (
          <p className="vedit-empty">Loading…</p>
        ) : items.length === 0 ? (
          <p className="vedit-empty">No emoji found.</p>
        ) : (
          <div className="vedit-emoji-grid">
            {items.map((it) => (
              <button key={it.e} type="button" title={it.n} aria-label={it.n} onClick={() => onPick(it.e)}>
                {it.e}
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
