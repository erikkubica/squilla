// Response types mirroring docs/plans/analytics-extension.md §2.4.

export type CompareMode = "previous" | "year";
export type Interval = "hour" | "day" | "week" | "month";

export interface Metrics {
  visitors: number;
  pageviews: number;
  visits: number;
  pages_per_visit: number;
  single_page_rate: number;
  median_visit_seconds: number | null;
  conversions: number;
  conversion_rate: number;
}

export interface SummaryResponse {
  range: { from: string; to: string; tz: string };
  current: Metrics;
  previous: Metrics | null;
  /** Totals for signal-confirmed visits only. Present when in-page measurement is on and the report is not already limited to them. */
  confirmed?: Metrics;
  sparklines: {
    visitors: number[];
    pageviews: number[];
    visits: number[];
    conversions: number[];
  };
}

export interface TimePoint {
  t: string;
  visitors: number;
  pageviews: number;
  visits: number;
  conversions: number;
}

export type SeriesMetric = "visitors" | "pageviews" | "visits" | "conversions";

export interface TimeseriesResponse {
  interval: Interval;
  points: TimePoint[];
  previous_points: TimePoint[] | null;
}

export const BREAKDOWN_DIMS = [
  "page", "entry_page", "exit_page", "source", "channel", "referrer",
  "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
  "country", "language", "device", "browser", "os", "page_type",
  "not_found", "download", "outbound", "goal", "viewport", "color_scheme", "search",
] as const;
export type BreakdownDim = (typeof BREAKDOWN_DIMS)[number];

export const FILTER_DIMS = [
  "page", "entry_page", "source", "channel", "referrer", "utm_source",
  "utm_medium", "utm_campaign", "country", "language", "device", "browser",
  "os", "page_type", "goal",
  // verified=1: only visits confirmed by an in-page signal.
  "verified",
] as const;
export type FilterDim = (typeof FILTER_DIMS)[number];

export interface BreakdownRow {
  value: string;
  label: string;
  visitors: number;
  pageviews: number;
  visits: number;
  conversions: number;
  share: number;
}

export interface BreakdownResponse {
  dimension: BreakdownDim;
  rows: BreakdownRow[];
  total_rows: number;
}

export interface RealtimeResponse {
  visitors_5m: number;
  visitors_30m: number;
  pageviews_30m: number;
  per_minute: { t: string; pageviews: number }[];
  recent: {
    ts: string;
    path: string;
    source: string;
    country: string;
    device: string;
    kind: string;
  }[];
  top_pages: { value: string; visitors: number }[];
}

export interface HeatmapCell {
  dow: number;
  hour: number;
  pageviews: number;
  visitors: number;
}
export interface HeatmapResponse {
  cells: HeatmapCell[];
}

export const BOT_CATEGORIES = [
  "search", "ai_crawler", "ai_search", "ai_assistant", "link_preview",
  "seo_tool", "monitor", "http_client", "headless", "probe", "other",
] as const;
export type BotCategory = (typeof BOT_CATEGORIES)[number];

export interface BotsResponse {
  totals: { category: string; hits: number }[];
  timeseries: { t: string; category: string; hits: number }[];
  top: { category: string; name: string; hits: number }[];
}

export type GoalKind = "pageview" | "request" | "link";
export interface Goal {
  id: number;
  name: string;
  kind: GoalKind;
  path_pattern: string;
  method: string;
  link_slug: string;
  created_at: string;
}
export type GoalInput = Omit<Goal, "id" | "created_at">;

export interface GoalStatsResponse {
  rows: {
    id: number;
    name: string;
    conversions: number;
    visitors: number;
    conversion_rate: number;
  }[];
}

export interface TrackedLink {
  id: number;
  slug: string;
  label: string;
  destination: string;
  created_at: string;
  clicks_30d: number;
}
export type LinkInput = Pick<TrackedLink, "slug" | "label" | "destination">;

export interface AnalyticsSettings {
  timezone: string;
  exclude_paths: string[];
  exclude_logged_in: boolean;
  respect_gpc: boolean;
  raw_retention_days: number;
  session_timeout_minutes: number;
  enhanced_mode: boolean;
  signal_dwell: boolean;
  signal_sections: boolean;
  signal_clicks: boolean;
  signal_forms: boolean;
  beacon_prefix: string;
  download_extensions: string[];
  own_hosts: string[];
  geoip_db_path: string;
  recordings: boolean;
  recording_sample: number;
  recording_consent: boolean;
  recording_retention_days: number;
}

export type Device = "desktop" | "tablet" | "mobile";

export interface RecordingRow {
  pid: string;
  started_at: string;
  path: string;
  referrer: string;
  vw: number;
  vh: number;
  dh: number;
  device: Device | "";
  browser: string;
  os: string;
  country: string;
  channel: string;
  source: string;
  entry: boolean;
  duration_ms: number;
  events: number;
  clicks: number;
  max_scroll: number;
  rage: number;
  dead: number;
  errors: number;
  /** Web Vitals measured in the visitor's browser: ms, CLS ×1000. */
  lcp: number | null;
  inp: number | null;
  cls: number | null;
  in_visit: boolean;
  visit_pages: number;
  converted: boolean | null;
  exit_reason: string | null;
}

export interface RecordingList {
  total: number;
  rows: RecordingRow[];
  pages: { path: string; n: number }[];
  channels: string[];
  countries: string[];
}

export interface FunnelStep {
  kind: "page" | "goal";
  value: string;
  label?: string;
}

export interface Funnel {
  id: number;
  name: string;
  steps: FunnelStep[];
  created_at?: string;
}

export interface FunnelStats {
  funnel: Funnel;
  from: string;
  to: string;
  stats: {
    visits: number;
    steps: { reached: number; median_ms: number | null; next: { path: string; n: number }[] }[];
    devices: { device: string; started: number; completed: number }[];
  };
}

export interface SearchStats {
  totals: { searches: number; searchers: number; search_visits: number; visits: number; exits: number; refinements: number };
  terms: { term: string; searches: number; searchers: number; exits: number; refined: number; top_next: string | null }[];
  from_pages: { path: string; searches: number }[];
}

export type RecSignal = "rage" | "dead" | "error" | "slow";

export interface PageVitals {
  path: string;
  views: number;
  lcp: number | null;
  inp: number | null;
  cls: number | null;
  ttfb: number | null;
  fcp: number | null;
}

export interface RecInsights {
  totals: { recordings: number; rage: number; dead: number; errors: number; quick_back: number; excessive_scroll: number; slow: number };
  elements: { kind: "rage" | "dead"; path: string; selector: string; n: number }[];
  errors: { message: string; file: string; n: number; pages: number; top_page: string }[];
  vitals: PageVitals[];
  site_vitals: { lcp: number | null; inp: number | null; cls: number | null; ttfb: number | null; by_device: Record<string, number> } | null;
}

/** [t ms, type, ...args] — see rec.js for the types. */
export type RecEvent = [number, string, ...(number | string)[]];

export interface Recording {
  meta: RecordingRow & { url: string; sw: number; sh: number; language: string; session_id: string | null };
  events: RecEvent[];
  visit: { pid: string; path: string; started_at: string; duration_ms: number }[];
}

export interface HotspotsResponse {
  path: string;
  device: Device | "";
  devices: { device: Device | ""; n: number }[];
  views: number;
  w: number;
  h: number;
  dh: number;
  bin: number;
  /** [x from viewport centre, y from page top, selector index] */
  clicks: [number, number, number][];
  selectors: { selector: string; href: string; clicks: number; y: number }[];
  moves: [number, number][];
  /** Views whose bottom edge reached each bin. */
  reach: number[];
  /** Milliseconds each bin was on screen, summed over views. */
  dwell: number[];
}

export type ResetScope = "all" | "recordings" | "behaviour";

export interface StatusResponse {
  receiving: boolean;
  last_record_at: string | null;
  records_today: number;
  pageviews_today: number;
  dropped_total: number;
  bots_today: number;
  enhanced_mode: boolean;
  geoip: boolean;
  salt_rotates_at: string | null;
  signals_lost?: number;
  views_indexed?: number;
}

export type ExportDataset = "summary" | "timeseries" | "breakdown" | "events";
export type ExportFormat = "csv" | "json";

// ---- Behaviour (visits, exits, page insights, clicks) ----

export interface ExitReasonRow { reason: string; visits: number }
export interface ExitSegmentRow { value: string; reason: string; visits: number }
export interface ExitStats {
  total: number;
  ambiguous: number;
  reasons: ExitReasonRow[];
  by_day: { day: string; reason: string; visits: number }[];
  by_channel: ExitSegmentRow[];
  by_device: ExitSegmentRow[];
  failing_pages: { path: string; visits: number; bad: number; bad_rate: number }[];
  destinations: { dest: string; reason: string; visits: number }[];
  median_exit_dwell_s: number | null;
}

export interface PageInsightsResponse {
  path: string;
  views: number;
  entrances: number;
  activated_views: number;
  exits: number;
  visits_including: number;
  quick_exits: number;
  conversions: number;
  median_view_s: number | null;
  blocks: { block_key: string; label: string; pos: number; seen: number; clicks: number; clicked: number }[];
  links: { block_key: string; label: string; href: string; pos: number; section: string; nav: boolean; clicks: number }[];
  stay: { sec: number; views: number }[];
  came_from: { path: string; n: number }[];
  went_to: { path: string; n: number }[];
  exit_reasons: { reason: string; n: number }[];
}

export interface ClickLink {
  path: string;
  block_key: string;
  /** Heading of the section the link is in ("" when the section has none). */
  section: string;
  section_pos: number;
  /** Header, menu, footer or outside any block. */
  nav: boolean;
  /** The link text as people see it. */
  text: string;
  dest: string;
  /** i internal | x other site | c contact (WhatsApp, email, phone) */
  class: string;
  clicks: number;
  /** Page views that clicked it at least once. */
  views: number;
  page_views: number;
}

export interface ClickSection {
  path: string;
  block_key: string;
  label: string;
  pos: number;
  nav: boolean;
  /** Page views where the section scrolled into view. */
  seen: number;
  /** Page views that clicked something in it. */
  clicked: number;
  clicks: number;
  links: number;
}

export interface ClicksResponse {
  totals: {
    views: number;
    clicking_views: number;
    sections_seen: number;
    clicks: number;
    nav_clicks: number;
    contact_clicks: number;
    outbound_clicks: number;
  };
  links: ClickLink[];
  sections: ClickSection[];
  ignored: { path: string; block_key: string; section: string; text: string; dest: string; pos: number; seen: number }[];
  pages: { path: string; views: number; clicking_views: number; clicks: number }[];
  destinations: { dest: string; class: string; clicks: number; views: number; top_page: string }[];
}

export interface BehaviourSummary {
  visits: number;
  engaged: number;
  single_page_known: number;
  median_exit_dwell_s: number | null;
  avg_reach: number | null;
  sections_seen: number;
  clicks: number;
  signals: number;
}
