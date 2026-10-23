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
  "not_found", "download", "outbound", "goal", "viewport", "color_scheme",
] as const;
export type BreakdownDim = (typeof BREAKDOWN_DIMS)[number];

export const FILTER_DIMS = [
  "page", "entry_page", "source", "channel", "referrer", "utm_source",
  "utm_medium", "utm_campaign", "country", "language", "device", "browser",
  "os", "page_type", "goal",
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
  beacon_prefix: string;
  download_extensions: string[];
  own_hosts: string[];
  geoip_db_path: string;
}

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
}

export type ExportDataset = "summary" | "timeseries" | "breakdown" | "events";
export type ExportFormat = "csv" | "json";
