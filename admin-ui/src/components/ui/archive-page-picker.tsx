import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getNodes, type ContentNode } from "@/api/client";

// Published pages per language, shared by every picker on the screen so a
// form with one picker per language/content type fetches each list once.
const pagesByLanguage = new Map<string, Promise<ContentNode[]>>();

function loadPages(languageCode: string): Promise<ContentNode[]> {
  let p = pagesByLanguage.get(languageCode);
  if (!p) {
    p = getNodes({
      page: 1,
      per_page: 200,
      status: "published",
      node_type: "page",
      language_code: languageCode,
    })
      .then((res) => res.data)
      .catch((err) => {
        pagesByLanguage.delete(languageCode);
        throw err;
      });
    pagesByLanguage.set(languageCode, p);
  }
  return p;
}

/** Drop cached page lists (e.g. after pages were published elsewhere). */
export function resetArchivePageCache() {
  pagesByLanguage.clear();
}

const NONE = "__none__";

// ArchivePagePicker chooses the page that lists a content type's items in
// one language (node_types.archive_node_ids[language]). 0 means "not set":
// the type then falls back to the page whose URL equals its URL prefix.
export function ArchivePagePicker({
  languageCode,
  value,
  onChange,
  className,
}: {
  languageCode: string;
  value: number | undefined;
  onChange: (id: number) => void;
  className?: string;
}) {
  const [pages, setPages] = useState<ContentNode[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPages(null);
    loadPages(languageCode)
      .then((list) => {
        if (!cancelled) setPages(list);
      })
      .catch(() => {
        if (!cancelled) setPages([]);
      });
    return () => {
      cancelled = true;
    };
  }, [languageCode]);

  const selected = value && value > 0 ? String(value) : NONE;
  // A configured page that is no longer published (or is in another
  // language) still needs an entry so the trigger doesn't render blank.
  const missing =
    selected !== NONE && pages !== null && !pages.some((p) => String(p.id) === selected);

  return (
    <Select
      value={selected}
      onValueChange={(v) => onChange(v === NONE ? 0 : Number(v))}
      disabled={pages === null}
    >
      <SelectTrigger className={className ?? "rounded-lg"}>
        <SelectValue placeholder={pages === null ? "Loading pages…" : "Select a page…"} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>No archive page</SelectItem>
        {missing && (
          <SelectItem value={selected}>Page #{selected} (not published in this language)</SelectItem>
        )}
        {(pages ?? []).map((p) => (
          <SelectItem key={p.id} value={String(p.id)}>
            {p.title} ({p.full_url})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
