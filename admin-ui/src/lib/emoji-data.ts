// Lazy-loaded emoji dataset for the emoji field picker.
//
// Sources (bundled into a separate chunk via dynamic import, never fetched
// from a CDN):
//   - unicode-emoji-json (MIT) — emoji, CLDR name, group, emoji version
//   - emojilib (MIT)            — search keywords
//
// Emoji newer than MAX_EMOJI_VERSION are dropped so every entry renders as a
// native glyph on current macOS, Windows, Android and iOS.

export const MAX_EMOJI_VERSION = 15.0;

export interface EmojiItem {
  /** the emoji itself — this is the stored field value */
  e: string;
  /** CLDR name, e.g. "steaming bowl" */
  n: string;
  /** lower-cased search haystack: name + keywords */
  k: string;
}

export interface EmojiGroup {
  slug: string;
  name: string;
  /** emoji shown on the category tab */
  tab: string;
  items: EmojiItem[];
}

type RawGroup = {
  name: string;
  slug: string;
  emojis: { emoji: string; name: string; slug: string; emoji_version: string }[];
};

const TAB_EMOJI: Record<string, string> = {
  smileys_emotion: "😀",
  people_body: "👋",
  animals_nature: "🐻",
  food_drink: "🍜",
  travel_places: "✈️",
  activities: "⚽",
  objects: "💡",
  symbols: "❤️",
  flags: "🏁",
};

let cache: Promise<EmojiGroup[]> | null = null;

export function loadEmojiData(): Promise<EmojiGroup[]> {
  if (cache) return cache;
  cache = Promise.all([
    import("unicode-emoji-json/data-by-group.json"),
    import("emojilib"),
  ])
    .then(([groupsMod, libMod]) => {
      const groups = (groupsMod.default ?? groupsMod) as unknown as RawGroup[];
      const keywords = (libMod.default ?? libMod) as Record<string, string[]>;
      return groups
        .filter((g) => g.slug !== "component")
        .map((g) => ({
          slug: g.slug,
          name: g.name,
          tab: TAB_EMOJI[g.slug] ?? g.emojis[0]?.emoji ?? "•",
          items: g.emojis
            .filter((em) => parseFloat(em.emoji_version) <= MAX_EMOJI_VERSION)
            .map((em) => {
              const kw = keywords[em.emoji] ?? keywords[em.emoji.replace(/️/g, "")] ?? [];
              return {
                e: em.emoji,
                n: em.name,
                k: [em.name, ...kw].join(" ").replace(/_/g, " ").toLowerCase(),
              };
            }),
        }))
        .filter((g) => g.items.length > 0);
    })
    .catch((err) => {
      cache = null; // allow a retry on the next open
      throw err;
    });
  return cache;
}

/** Returns emoji matching every whitespace-separated term, name hits first. */
export function searchEmoji(groups: EmojiGroup[], query: string, limit = 240): EmojiItem[] {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  const nameHits: EmojiItem[] = [];
  const kwHits: EmojiItem[] = [];
  for (const g of groups) {
    for (const it of g.items) {
      if (!terms.every((t) => it.k.includes(t))) continue;
      if (terms.every((t) => it.n.includes(t))) nameHits.push(it);
      else kwHits.push(it);
    }
  }
  return [...nameHits, ...kwHits].slice(0, limit);
}

const RECENT_KEY = "squilla_recent_emoji";
const RECENT_MAX = 24;

export function getRecentEmoji(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string").slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
}

export function pushRecentEmoji(emoji: string): void {
  try {
    const next = [emoji, ...getRecentEmoji().filter((e) => e !== emoji)].slice(0, RECENT_MAX);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — recents are a convenience only */
  }
}
