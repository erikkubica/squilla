import React from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Database,
  Palette,
  Code,
  Settings,
  FileText,
  Newspaper,
  Boxes,
  PanelTop,
  Component,
  ListTree,
  Tag,
  Square,
  LayoutTemplate,
  Puzzle,
  Users,
  Shield,
  Globe,
  Key,
  Bell,
  MessageCircle,
  Map,
  Camera,
  Star,
  Heart,
  Zap,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Icon map — shared across dashboard components
// ---------------------------------------------------------------------------

export const iconMap: Record<
  string,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  LayoutDashboard,
  Database,
  Palette,
  Code,
  Settings,
  FileText,
  Newspaper,
  Boxes,
  PanelTop,
  Component,
  ListTree,
  Tag,
  Square,
  LayoutTemplate,
  Puzzle,
  Users,
  Shield,
  Globe,
  Key,
  Bell,
  FileCode: LayoutTemplate,
  LayoutPanelTop: PanelTop,
  Languages: Globe,
  Brush: Palette,
  Blocks: Boxes,
  Menu: ListTree,
  Mail: Bell,
  FormInput: Square,
  Image: Boxes,
  ScrollText: FileText,
  Gavel: Shield,
  Layout: PanelTop,
  Send: Bell,
  Tags: Tag,
  Shapes: Boxes,
  MessageCircle,
  Map,
  Camera: Camera,
  Star,
  Heart,
  Bookmark: Tag,
  Calendar: FileText,
  Clock: FileText,
  Hash: Tag,
  Type: FileText,
  Zap,
};

// ---------------------------------------------------------------------------
// WelcomeBanner — gradient banner for the dashboard hero area
// ---------------------------------------------------------------------------

export function WelcomeBanner({
  title,
  subtitle,
  actionLabel,
  actionPath,
}: {
  title: string;
  subtitle: string;
  actionLabel?: string;
  actionPath?: string;
}) {
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl p-6 text-white" style={{background: "var(--accent-strong)"}}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <p className="mt-1 text-sm text-white/80">{subtitle}</p>
        </div>
        {actionLabel && actionPath && (
          <button
            onClick={() => navigate(actionPath)}
            className="rounded-lg border px-4 py-2 text-sm font-medium text-white transition-colors"
            style={{borderColor: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.1)"}}
          >
            + {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// StatCard — dashboard stat with colored icon background
// ---------------------------------------------------------------------------

const colorMap: Record<string, { textVar: string; bgVar: string }> = {
  indigo: { textVar: "var(--accent-strong)", bgVar: "var(--accent-weak)" },
  emerald: { textVar: "var(--success)", bgVar: "var(--success-bg)" },
  amber: { textVar: "var(--warning)", bgVar: "var(--warning-bg)" },
  violet: { textVar: "var(--accent-strong)", bgVar: "var(--accent-weak)" },
  sky: { textVar: "var(--accent-strong)", bgVar: "var(--accent-weak)" },
  rose: { textVar: "var(--danger)", bgVar: "var(--danger-bg)" },
  slate: { textVar: "var(--muted-foreground)", bgVar: "var(--muted)" },
  blue: { textVar: "var(--accent-strong)", bgVar: "var(--accent-weak)" },
};

export function StatCard({
  label,
  value,
  icon,
  color,
  change,
}: {
  label: string;
  value: string | number;
  icon?: string;
  color?: string;
  change?: string;
}) {
  const IconComp = icon ? iconMap[icon] : null;
  const c = colorMap[color || "indigo"] || colorMap.indigo;

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-4 p-6">
        {IconComp && (
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
            style={{background: c.bgVar}}
          >
            <IconComp className="h-6 w-6" style={{color: c.textVar}} />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {change && <p className="mt-0.5 text-xs text-muted-foreground">{change}</p>}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RecentContentTable — table showing recent content nodes
// ---------------------------------------------------------------------------

interface RecentContentItem {
  id: number;
  title: string;
  node_type: string;
  status: string;
  updated_at: string;
}

const statusStyles: Record<string, React.CSSProperties> = {
  published: { background: "var(--success-bg)", color: "var(--success)" },
  draft: { background: "var(--warning-bg)", color: "var(--warning)" },
  archived: { background: "var(--muted)", color: "var(--muted-foreground)" },
  scheduled: { background: "var(--accent-weak)", color: "var(--accent-strong)" },
};

function editPathForNode(node: RecentContentItem): string {
  if (node.node_type === "post") return `/admin/posts/${node.id}/edit`;
  if (node.node_type === "page") return `/admin/pages/${node.id}/edit`;
  return `/admin/content/${node.node_type}/${node.id}/edit`;
}

export function RecentContentTable({ items }: { items: RecentContentItem[] }) {
  const navigate = useNavigate();

  if (!items || items.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        No content yet. Create your first page to get started.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="px-6 py-4">
        <h2 className="text-lg font-semibold text-foreground">Recent Content</h2>
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-t border-border bg-muted">
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Title
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Updated
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((node) => (
            <tr
              key={node.id}
              className="border-t border-border transition-colors hover:bg-muted"
            >
              <td className="px-6 py-4 text-sm">
                <button
                  onClick={() => navigate(editPathForNode(node))}
                  className="font-medium hover:underline"
                  style={{color: "var(--accent-strong)"}}
                >
                  {node.title}
                </button>
              </td>
              <td className="px-6 py-4 text-sm capitalize text-muted-foreground">
                {node.node_type?.replace(/_/g, " ")}
              </td>
              <td className="px-6 py-4 text-sm">
                <span
                  className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                  style={statusStyles[node.status] || statusStyles.draft}
                >
                  {node.status}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-muted-foreground">
                {node.updated_at}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ActivityFeed — simple list of recent activity items
// ---------------------------------------------------------------------------

export function ActivityFeed({
  items,
  title = "Recent Activity",
  emptyMessage = "No recent activity.",
}: {
  items: Array<{
    id: number | string;
    message: string;
    time: string;
    type?: string;
  }>;
  title?: string;
  emptyMessage?: string;
}) {
  if (!items || items.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        </div>
        <p className="px-6 pb-6 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      </div>
    );
  }

  const typeStyles: Record<string, React.CSSProperties> = {
    create: { background: "var(--success)" },
    update: { background: "var(--accent)" },
    delete: { background: "var(--danger)" },
    publish: { background: "var(--accent-strong)" },
    default: { background: "var(--fg-subtle)" },
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="px-6 py-4">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      </div>
      <ul className="divide-y divide-border">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-3 px-6 py-3">
            <div
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
              style={typeStyles[item.type || "default"] || typeStyles.default}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-foreground">{item.message}</p>
              <p className="mt-0.5 text-xs" style={{color: "var(--fg-subtle)"}}>{item.time}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// QuickActions — grid of shortcut action buttons
// ---------------------------------------------------------------------------

export function QuickActions({
  actions,
}: {
  actions: Array<{
    label: string;
    path: string;
    icon?: string;
  }>;
}) {
  const navigate = useNavigate();

  if (!actions || actions.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-foreground">
        Quick Actions
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, i) => {
          const IconComp = action.icon ? iconMap[action.icon] : null;
          return (
            <button
              key={i}
              onClick={() => navigate(action.path)}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              {IconComp && <IconComp className="h-4 w-4" style={{color: "var(--fg-subtle)"}} />}
              {action.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
