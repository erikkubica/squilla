import { useCallback, useMemo, useRef, useState } from "react";
import {
  getThemeSettingsPage,
  listThemeSettings,
  saveThemeSettingsPage,
  type BlockField,
  type ThemeSettingsPageInfo,
} from "./api";

export interface LayoutPage {
  info: ThemeSettingsPageInfo;
  fields: BlockField[];
  values: Record<string, unknown>;
  /** JSON of the values as last loaded or saved. */
  saved: string;
}

/** Theme settings are the site-wide half of the page (header, footer, CTA…).
 *  Loaded the first time the Layout tab is needed and kept in memory so
 *  edits survive switching tabs. */
export function useLayoutSettings(language: string) {
  const [pages, setPages] = useState<LayoutPage[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const load = useCallback(() => {
    if (started.current) return;
    started.current = true;
    listThemeSettings()
      .then((list) => Promise.all(list.map((info) => getThemeSettingsPage(info.slug, language))))
      .then((all) => {
        setPages(
          all.map(({ page, values }) => {
            const fields: BlockField[] = page.fields.map((f) => ({
              ...(f.config ?? {}),
              name: f.name,
              title: f.title,
              type: f.type,
              hint: f.description,
              initialValue: f.initialValue,
            }));
            const vals: Record<string, unknown> = {};
            for (const f of page.fields) vals[f.name] = values[f.name]?.value ?? f.initialValue;
            return { info: { slug: page.slug, name: page.name, icon: page.icon, description: page.description }, fields, values: vals, saved: JSON.stringify(vals) };
          }),
        );
      })
      .catch((e: Error) => {
        started.current = false;
        setError(e.message);
      });
  }, [language]);

  const setValue = useCallback((slug: string, name: string, value: unknown) => {
    setPages((prev) => prev && prev.map((p) => (p.info.slug === slug ? { ...p, values: { ...p.values, [name]: value } } : p)));
  }, []);

  const dirtySlugs = useMemo(() => (pages ?? []).filter((p) => JSON.stringify(p.values) !== p.saved).map((p) => p.info.slug), [pages]);

  /** Saves every changed settings page. */
  const save = useCallback(async () => {
    if (!pages) return;
    const todo = pages.filter((p) => JSON.stringify(p.values) !== p.saved);
    for (const p of todo) await saveThemeSettingsPage(p.info.slug, p.values, language);
    setPages((prev) => prev && prev.map((p) => (todo.includes(p) ? { ...p, saved: JSON.stringify(p.values) } : p)));
  }, [pages, language]);

  return { pages, error, load, setValue, dirtySlugs, save };
}
