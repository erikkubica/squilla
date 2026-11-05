// Labels and explanations for exit reasons and block keys.

export const EXIT_REASONS: Record<string, { label: string; help: string }> = {
  converted: { label: "Converted", help: "The visit completed a goal (for example a contact form)." },
  left_to_contact: { label: "Left to contact us", help: "The last thing they did was open WhatsApp, Zalo, Messenger, a phone or an email link." },
  left_to_partner: { label: "Left to another site", help: "They followed an outbound link (a partner, a booking site, a map)." },
  hit_error: { label: "Hit an error", help: "The last request was a 404 or a rejected form submission." },
  quick_exit: { label: "Quick exit", help: "One page, gone in under 10 seconds. Needs in-page signals." },
  read_and_left: { label: "Read and left", help: "One page, stayed a minute or reached the end of the page." },
  skimmed: { label: "Skimmed", help: "One page, 10–60 seconds, did not reach the end." },
  browsed_and_left: { label: "Browsed and left", help: "Viewed two or more pages, then left without converting." },
  single_page: { label: "One page (time unknown)", help: "A single page view. Without in-page signals the time on the page is not measured." },
};

export const reasonLabel = (r: string) => EXIT_REASONS[r]?.label ?? r;

/** "bv-wall-of-love.0" → "Wall of love"; "p.default-cta" → "Default cta (layout)". */
export function blockName(key: string, label?: string): string {
  if (label) return label;
  const layout = key.startsWith("p.");
  const occ = /\.(\d+)$/.exec(key);
  const base = (layout ? key.slice(2) : key).replace(/\.\d+$/, "").replace(/^bv-/, "").replace(/[-_]+/g, " ");
  const name = base.charAt(0).toUpperCase() + base.slice(1);
  if (layout) return `${name} (layout)`;
  return occ && Number(occ[1]) > 0 ? `${name} ${Number(occ[1]) + 1}` : name;
}

export const pct = (n: number, d: number) => (d > 0 ? `${((n / d) * 100).toFixed(1).replace(/\.0$/, "")}%` : "—");

export function seconds(s: number | null | undefined): string {
  if (s == null || !Number.isFinite(s)) return "—";
  if (s < 60) return `${Math.round(s)} s`;
  const m = Math.floor(s / 60);
  return `${m} min ${Math.round(s - m * 60)} s`;
}
