import React from "react";
import { useNavigate } from "react-router-dom";
import { registerComponents } from "./registry";
import {
  WelcomeBanner,
  StatCard as SduiStatCard,
  RecentContentTable,
  ActivityFeed,
  QuickActions,
} from "./sdui-components";
import { ContentTypeCard, TaxonomyCard } from "./list-components";
import {
  ContentNodeTable,
  TaxonomyTermsTable,
  PageHeader,
  SearchToolbar,
  TaxonomyFilterChips,
} from "./table-components";
import { GenericListTable } from "./generic-list-table";
import { ThemesGrid } from "./themes-grid";
import { ExtensionsGrid } from "./extensions-grid";
import { SettingsForm } from "./settings-form";
import { SchemaSettings } from "./schema-settings";

// ---------------------------------------------------------------------------
// Layout primitives — thin wrappers that map SDUI props to real DOM/React.
// These are the "Tier 4: Layout" and "Tier 2: Composites" components that
// the Go kernel can reference by name in layout trees.
// ---------------------------------------------------------------------------

/** Vertical flex stack with configurable gap and className. */
function VerticalStack({
  gap = 4,
  className = "",
  children,
}: {
  gap?: number;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-${gap} ${className}`}>{children}</div>
  );
}

/** Horizontal flex stack. */
function HorizontalStack({
  gap = 4,
  className = "",
  align = "center",
  children,
}: {
  gap?: number;
  className?: string;
  align?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`flex flex-row items-${align} gap-${gap} ${className}`}>
      {children}
    </div>
  );
}

/** Admin page header with title and optional back link. */
function AdminHeader({
  title,
  back,
  children,
}: {
  title: string;
  back?: string;
  children?: React.ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {back && (
          <button
            onClick={() =>
              back.startsWith("/") ? navigate(back) : navigate(-1)
            }
            className="rounded-md p-1.5 hover:bg-muted hover:text-foreground"
            style={{color: "var(--fg-subtle)"}}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
      </div>
      {children}
    </div>
  );
}

/** Simple card wrapper. */
function CardWrapper({
  className = "",
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border border-border bg-card shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

/** Stat card — delegates to the enhanced SDUI StatCard with colored icons. */
function StatCard(props: {
  label: string;
  value: string | number;
  icon?: string;
  color?: string;
  change?: string;
}) {
  return <SduiStatCard {...props} />;
}

/** Grid layout for dashboard widgets and card grids. */
function Grid({
  cols = 3,
  gap = 4,
  className = "",
  children,
}: {
  cols?: number;
  gap?: number;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${cols} gap-${gap} ${className}`}
    >
      {children}
    </div>
  );
}

/** Dashboard placeholder — queries stats via TanStack and renders stat cards. */
function DashboardWidgets() {
  // For now, render a static grid that will be replaced by data-driven widgets.
  // The real implementation will use TanStack Query to fetch stats.
  return (
    <Grid cols={4} gap={4}>
      <StatCard label="Total Pages" value="—" />
      <StatCard label="Published" value="—" />
      <StatCard label="Drafts" value="—" />
      <StatCard label="Users" value="—" />
    </Grid>
  );
}

/** List page header with title, count, and "New" button. */
function ListHeader({
  title,
  count,
  newPath,
}: {
  title: string;
  count?: number;
  newPath?: string;
}) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {count !== undefined && (
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {count}
          </span>
        )}
      </div>
      {newPath && (
        <button
          onClick={() => navigate(newPath)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          New
        </button>
      )}
    </div>
  );
}

/** Search + filter toolbar for list pages. */
function ListToolbar({
  searchPlaceholder = "Search...",
}: {
  searchPlaceholder?: string;
  filters?: unknown[];
}) {
  // Placeholder — the full implementation will use the page store for
  // reactive search + filter state. For validation we just show a search input.
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1 max-w-sm">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{color: "var(--fg-subtle)"}}
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          placeholder={searchPlaceholder}
          className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm text-foreground focus:outline-none"
        />
      </div>
    </div>
  );
}

/** Placeholder data table. The real one will accept column defs and data. */
function DataTable({
  nodeType,
}: {
  endpoint?: string;
  nodeType?: string;
  columns?: unknown[];
}) {
  return (
    <CardWrapper className="overflow-hidden">
      <div className="p-8 text-center text-sm text-muted-foreground">
        <p className="font-medium">DataTable: {nodeType || "unknown"}</p>
        <p className="mt-1" style={{color: "var(--fg-subtle)"}}>
          Data-bound table will render here when connected to TanStack Query.
        </p>
      </div>
    </CardWrapper>
  );
}

/** Generic button that can trigger SDUI actions. */
function VibeButton({
  label,
  variant = "default",
  onClick,
}: {
  label: string;
  variant?: "default" | "destructive" | "outline" | "ghost";
  onClick?: () => void;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors";
  const variants: Record<string, string> = {
    default: "bg-primary text-white hover:bg-primary/90",
    destructive: "text-white",
    outline:
      "border border-border bg-card text-foreground hover:bg-muted",
    ghost: "text-foreground hover:bg-muted",
  };

  return (
    <button
      className={`${base} ${variants[variant] || variants.default}`}
      style={variant === "destructive" ? {background: "var(--danger)"} : undefined}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

/** Plain text block — renders a string or children. */
function TextBlock({
  text,
  className = "",
}: {
  text?: string;
  className?: string;
}) {
  return <p className={`text-sm text-foreground ${className}`}>{text}</p>;
}

/** Divider line. */
function Divider({ className = "" }: { className?: string }) {
  return <hr className={`border-border ${className}`} />;
}

/** Spacer — adds vertical space. */
function Spacer({ height = 4 }: { height?: number }) {
  return <div style={{ height: `${height * 0.25}rem` }} />;
}

/** Sidebar layout — content area + sidebar panel. */
function SidebarLayout({
  sidebarWidth = 320,
  className = "",
  children,
}: {
  sidebarWidth?: number;
  className?: string;
  children?: React.ReactNode;
}) {
  // Expects exactly 2 children: [content, sidebar]
  const childArray = React.Children.toArray(children);
  const content = childArray[0] ?? null;
  const sidebar = childArray[1] ?? null;

  return (
    <div className={`flex ${className}`}>
      <div className="flex-1 min-w-0">{content}</div>
      <div
        className="flex-shrink-0 border-l border-border bg-muted"
        style={{ width: sidebarWidth }}
      >
        {sidebar}
      </div>
    </div>
  );
}

/** Tabs layout — renders children as tab panels. */
function TabLayout({
  tabs,
  children,
}: {
  tabs: Array<{ key: string; label: string }>;
  children?: React.ReactNode;
}) {
  const [active, setActive] = React.useState(tabs[0]?.key ?? "");
  const childArray = React.Children.toArray(children);

  return (
    <div>
      <div className="flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              active === t.key
                ? "border-b-2 text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            style={active === t.key ? {borderColor: "var(--accent-strong)"} : undefined}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="pt-4">
        {tabs.map((t, i) =>
          active === t.key ? (
            <React.Fragment key={t.key}>{childArray[i] ?? null}</React.Fragment>
          ) : null,
        )}
      </div>
    </div>
  );
}

/** Loading skeleton card. */
function LoadingCard() {
  return (
    <CardWrapper className="p-6">
      <div className="space-y-3 animate-pulse">
        <div className="h-4 w-1/3 rounded bg-muted" />
        <div className="h-4 w-2/3 rounded bg-muted" />
        <div className="h-4 w-1/2 rounded bg-muted" />
      </div>
    </CardWrapper>
  );
}

/** Empty state with icon, message, and optional action. */
function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon?: string;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{color: "var(--fg-subtle)"}}
        >
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      </div>
      <h3 className="mt-4 text-sm font-semibold text-foreground">
        {title || "No items yet"}
      </h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/** Error card — shown when an SDUI component fails. */
function ErrorCard({ title, message }: { title?: string; message?: string }) {
  return (
    <div className="rounded-lg border p-4" style={{borderColor: "var(--danger-border)", background: "var(--danger-bg)"}}>
      <p className="text-sm font-medium" style={{color: "var(--danger)"}}>
        {title || "Something went wrong"}
      </p>
      {message && <p className="mt-1 text-sm" style={{color: "var(--danger)"}}>{message}</p>}
    </div>
  );
}

/** Section wrapper with optional title. */
function Section({
  title,
  className = "",
  children,
}: {
  title?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={className}>
      {title && (
        <h2 className="mb-3 text-sm font-semibold text-foreground">{title}</h2>
      )}
      {children}
    </div>
  );
}

/** Scroll region — wraps content in a scrollable container. */
function ScrollRegion({
  maxHeight = 400,
  className = "",
  children,
}: {
  maxHeight?: number;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`overflow-y-auto ${className}`} style={{ maxHeight }}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Registration — all built-in components are registered here so the
// RecursiveRenderer can look them up by type name.
// ---------------------------------------------------------------------------

export function registerBuiltinComponents() {
  registerComponents({
    // Layout primitives
    VerticalStack,
    HorizontalStack,
    Grid,
    SidebarLayout,
    TabLayout,
    Section,
    ScrollRegion,
    Spacer,
    Divider,

    // Page-level composites
    AdminHeader,
    DashboardWidgets,
    ListHeader,
    ListToolbar,
    DataTable,

    // UI primitives
    VibeButton,
    TextBlock,
    CardWrapper,
    StatCard,

    // Dashboard widgets
    WelcomeBanner,
    RecentContentTable,
    ActivityFeed,
    QuickActions,

    // Feedback
    LoadingCard,
    EmptyState,
    ErrorCard,

    // List components
    ContentTypeCard,
    TaxonomyCard,

    // Table-driven SDUI components
    ContentNodeTable,
    TaxonomyTermsTable,
    PageHeader,
    SearchToolbar,
    TaxonomyFilterChips,
    GenericListTable,
    ThemesGrid,
    ExtensionsGrid,

    // Settings (SDUI-driven form)
    SettingsForm,
    // Settings (registry-driven generic form)
    SchemaSettings,
  });
}
