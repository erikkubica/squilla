import * as React from "react";
import { useEffect, useRef } from "react";
import type { BlockField, IconItem } from "./api";
import { BlockIcon } from "./BlockCard";
import { FieldList, type FieldContext } from "./fields/FieldInput";
import { ImageField } from "./fields/MediaPicker";
import type { LayoutPage } from "./layoutSettings";
import { Glyph } from "./ui";

export interface PageMeta {
  title: string;
  excerpt: string;
  featured_image: unknown;
  fields_data: Record<string, unknown>;
}

/** Title, excerpt, cover image and the content type's own fields. */
export function PageDetails({
  meta,
  onChange,
  mediaOk,
  supportsExcerpt,
  focus,
}: {
  meta: PageMeta;
  onChange: (name: "title" | "excerpt" | "featured_image", value: unknown) => void;
  mediaOk: boolean;
  supportsExcerpt: boolean;
  /** Set by clicks on the page; `n` changes on every request. */
  focus: { field: "title" | "excerpt" | "featured_image"; n: number } | null;
}): React.JSX.Element {
  const titleRef = useRef<HTMLInputElement>(null);
  const excerptRef = useRef<HTMLTextAreaElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!focus) return;
    if (focus.field === "title") titleRef.current?.focus();
    else if (focus.field === "excerpt") excerptRef.current?.focus();
    else rootRef.current?.querySelector(".vedit-page-image")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [focus]);

  return (
    <div className="vedit-card vedit-page-card" ref={rootRef}>
      <div className="vedit-card-body vedit-page-body">
        <div className="vedit-field" data-full>
          <label className="vedit-field-label" htmlFor="vedit-page-title">Title</label>
          <input id="vedit-page-title" ref={titleRef} className="vedit-input" value={meta.title} onChange={(e) => onChange("title", e.target.value)} />
        </div>
        {supportsExcerpt && (
          <div className="vedit-field" data-full>
            <label className="vedit-field-label" htmlFor="vedit-page-excerpt">Excerpt</label>
            <p className="vedit-field-hint">The short intro under the title, also used in listings and search results.</p>
            <textarea id="vedit-page-excerpt" ref={excerptRef} className="vedit-input vedit-textarea" rows={3} value={meta.excerpt} onChange={(e) => onChange("excerpt", e.target.value)} />
          </div>
        )}
        {mediaOk && (
          <div className="vedit-field vedit-page-image" data-full>
            <span className="vedit-field-label">Featured image</span>
            <ImageField value={meta.featured_image} onChange={(v) => onChange("featured_image", v)} openSignal={focus?.field === "featured_image" ? focus.n : undefined} />
          </div>
        )}
      </div>
    </div>
  );
}

/** The content type's custom fields, as one card. */
export function PageCustomFields({
  schema,
  values,
  onFieldChange,
  ctx,
  label,
}: {
  schema: BlockField[];
  values: Record<string, unknown>;
  onFieldChange: (name: string, value: unknown) => void;
  ctx: FieldContext;
  label: string;
}): React.JSX.Element | null {
  if (schema.length === 0) return null;
  return (
    <>
      <div className="vedit-section-head">
        <span className="vedit-section-title">{label} details</span>
      </div>
      <div className="vedit-card vedit-page-card">
        <div className="vedit-card-body vedit-page-body">
          <FieldList fields={schema} values={values} onFieldChange={onFieldChange} ctx={ctx} path="node" />
        </div>
      </div>
    </>
  );
}

/** Theme settings pages as accordions. */
export function LayoutTab({
  pages,
  error,
  icons,
  openSlug,
  setOpenSlug,
  dirtySlugs,
  onChange,
  ctx,
}: {
  pages: LayoutPage[] | null;
  error: string | null;
  icons: Map<string, IconItem | null>;
  openSlug: string | null;
  setOpenSlug: (slug: string | null) => void;
  dirtySlugs: string[];
  onChange: (slug: string, name: string, value: unknown) => void;
  ctx: FieldContext;
}): React.JSX.Element {
  const els = useRef(new Map<string, HTMLDivElement>());
  // Bring a card to the top when it is opened, and only then: depending on
  // the field values would re-scroll the form on every keystroke.
  const loaded = pages !== null;
  useEffect(() => {
    if (!openSlug || !loaded) return;
    const el = els.current.get(openSlug);
    if (el) requestAnimationFrame(() => el.scrollIntoView({ block: "start", behavior: "smooth" }));
  }, [openSlug, loaded]);

  if (error) return <div className="vedit-alert" data-tone="danger">Couldn't load the layout settings: {error}</div>;
  if (!pages) return <p className="vedit-muted-note"><Glyph name="loader" size={14} className="vedit-spin" /> Loading the site settings…</p>;
  if (pages.length === 0) return <p className="vedit-muted-note">This theme has no settings.</p>;

  return (
    <>
      <p className="vedit-layout-note">
        <Glyph name="globe" size={15} />
        <span>These are shared by every page on the site. Changes show up everywhere once saved.</span>
      </p>
      <div className="vedit-block-list">
        {pages.map((p) => {
          const open = p.info.slug === openSlug;
          const dirty = dirtySlugs.includes(p.info.slug);
          return (
            <div key={p.info.slug} className="vedit-card" data-state={open ? "open" : "closed"} ref={(el) => { if (el) els.current.set(p.info.slug, el); else els.current.delete(p.info.slug); }}>
              <div className="vedit-card-header" data-flat onClick={() => setOpenSlug(open ? null : p.info.slug)}>
                <button type="button" className="vedit-card-toggle" aria-expanded={open} onClick={(e) => { e.stopPropagation(); setOpenSlug(open ? null : p.info.slug); }}>
                  <BlockIcon icon={p.info.icon} icons={icons} />
                  <span className="vedit-card-text">
                    <span className="vedit-card-titlerow">
                      <span className="vedit-card-title">{p.info.name}</span>
                      {dirty && <span className="vedit-badge" data-tone="accent">Edited</span>}
                    </span>
                    {p.info.description && !open && <span className="vedit-card-summary">{p.info.description}</span>}
                  </span>
                </button>
                <span className="vedit-card-actions">
                  <Glyph name="chevron-down" size={17} className="vedit-chevron" style={{ transform: open ? "none" : "rotate(-90deg)" }} />
                </span>
              </div>
              {open && (
                <div className="vedit-card-body">
                  {p.info.description && (
                    <p className="vedit-card-description">
                      <Glyph name="info" size={15} />
                      <span>{p.info.description}</span>
                    </p>
                  )}
                  <FieldList fields={p.fields} values={p.values} onFieldChange={(name, v) => onChange(p.info.slug, name, v)} ctx={ctx} path={`layout.${p.info.slug}`} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
