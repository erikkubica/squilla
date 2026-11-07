import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Search, Smile, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  getRecentEmoji,
  loadEmojiData,
  pushRecentEmoji,
  searchEmoji,
  type EmojiGroup,
  type EmojiItem,
} from "@/lib/emoji-data";

const RECENT_TAB = "__recent__";

/**
 * Emoji field input: a text box for typing/pasting plus a popover picker of
 * native system emoji (no images, no web fonts). The stored value is the
 * emoji string itself, so existing text values keep working.
 */
export function EmojiFieldInput({
  value,
  onChange,
  name,
  placeholder,
  className,
}: {
  value: string;
  onChange: (val: string) => void;
  name?: string;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  const pick = (emoji: string) => {
    onChange(emoji);
    pushRecentEmoji(emoji);
    setOpen(false);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={value ? `Change emoji (${value})` : "Pick an emoji"}
            title="Pick an emoji"
            className="flex h-10 w-12 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-card text-2xl leading-none shadow-2xs hover:bg-muted"
          >
            {value ? <span>{value}</span> : <Smile className="h-5 w-5 text-muted-foreground" />}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[344px] p-0" align="start">
          {open && <EmojiPickerPanel onPick={pick} />}
        </PopoverContent>
      </Popover>
      <Input
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Type or paste an emoji"}
        className="max-w-[220px] rounded-lg"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear emoji"
          title="Clear"
          className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function EmojiPickerPanel({ onPick }: { onPick: (emoji: string) => void }) {
  const [groups, setGroups] = useState<EmojiGroup[] | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [recent] = useState<string[]>(() => getRecentEmoji());
  const [tab, setTab] = useState<string>(() => (getRecentEmoji().length ? RECENT_TAB : "smileys_emotion"));
  const searchRef = useRef<HTMLInputElement>(null);
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
    searchRef.current?.focus();
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

  const activeLabel = query.trim()
    ? `Results for “${query.trim()}”`
    : tab === RECENT_TAB
      ? "Recently used"
      : groups?.find((g) => g.slug === tab)?.name ?? "";

  return (
    <div className="flex flex-col">
      <div className="border-b border-border p-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search emoji (e.g. noodles, flag, heart)"
            className="h-8 rounded-md pl-8 text-sm"
          />
        </div>
      </div>

      {groups && (
        <div className="flex items-center gap-0.5 border-b border-border px-1.5 py-1" role="tablist" aria-label="Emoji categories">
          {recent.length > 0 && (
            <TabButton active={!query && tab === RECENT_TAB} label="Recently used" onClick={() => { setQuery(""); setTab(RECENT_TAB); }}>
              🕘
            </TabButton>
          )}
          {groups.map((g) => (
            <TabButton key={g.slug} active={!query && tab === g.slug} label={g.name} onClick={() => { setQuery(""); setTab(g.slug); }}>
              {g.tab}
            </TabButton>
          ))}
        </div>
      )}

      <div className="px-2 pt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{activeLabel}</div>
      <div ref={gridRef} className="h-[264px] overflow-y-auto p-1.5">
        {error ? (
          <p className="p-3 text-sm text-muted-foreground">Could not load the emoji list. You can still type or paste an emoji.</p>
        ) : !groups ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground">No emoji found.</p>
        ) : (
          <div className="grid grid-cols-8 gap-0.5">
            {items.map((it) => (
              <button
                key={it.e}
                type="button"
                title={it.n}
                aria-label={it.n}
                onClick={() => onPick(it.e)}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-[22px] leading-none hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
              >
                {it.e}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-lg leading-none transition-colors",
        active ? "bg-muted ring-1 ring-border" : "opacity-70 hover:bg-muted hover:opacity-100",
      )}
    >
      {children}
    </button>
  );
}

export default EmojiFieldInput;
