import React, { useState, useMemo, useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useBoot } from "../hooks/use-boot";
import { useAuth } from "../hooks/use-auth";
import { useAdminLanguage } from "../hooks/use-admin-language";
import { useBranding } from "../hooks/use-branding";
import { getThemeSettingsPages, clearCache } from "../api/client";
import type { NavItem } from "./types";
import { resolveLucideIcon, type IconComponent } from "../lib/lucide-icon";
import {
  Puzzle,
  ChevronDown,
  Menu,
  X,
  LogOut,
  ChevronRight,
  ExternalLink,
  Home,
  Bell,
  RefreshCw,
  Globe,
} from "lucide-react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Icon resolution — look up any icon name against the full lucide-react
// export. Supports the PascalCase names lucide uses ("ImageDown") as well
// as the kebab-case aliases themes/extensions may pass ("image-down").
// ---------------------------------------------------------------------------

function getIcon(name: string): IconComponent | null {
  if (!name) return null;
  return resolveLucideIcon(name) || Puzzle;
}

// ---------------------------------------------------------------------------
// Section ordering and labels
// ---------------------------------------------------------------------------

// No longer needed — section headers come from is_section items in the
// flat navigation list returned by the boot manifest.

// ---------------------------------------------------------------------------
// Breadcrumb computation
// ---------------------------------------------------------------------------

const prettify = (s: string) =>
  s.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const sectionBreadcrumbLabels: Record<string, string> = {
  dashboard: "Dashboard",
  pages: "Pages",
  posts: "Posts",
  content: "Content",
  "content-types": "Content Types",
  taxonomies: "Taxonomies",
  "block-types": "Block Types",
  templates: "Templates",
  layouts: "Layouts",
  "layout-blocks": "Layout Blocks",
  menus: "Menus",
  themes: "Themes",
  extensions: "Extensions",
  users: "Users",
  roles: "Roles",
  languages: "Languages",
  settings: "Settings",
  "mcp-tokens": "MCP Tokens",
  ext: "Extensions",
  sdui: "SDUI",
};

function computeBreadcrumbs(pathname: string): string[] {
  const parts = pathname
    .replace(/^\/admin\/?/, "")
    .split("/")
    .filter(Boolean);
  if (parts.length === 0) return [];

  const crumbs: string[] = [];

  for (let i = 0; i < parts.length; i++) {
    const seg = parts[i];
    if (/^\d+$/.test(seg)) continue;
    if (seg === "edit") {
      crumbs.push("Edit");
      continue;
    }
    if (seg === "new") {
      crumbs.push("New");
      continue;
    }
    crumbs.push(sectionBreadcrumbLabels[seg] || prettify(seg));
  }

  return crumbs;
}

// ---------------------------------------------------------------------------
// Sidebar Navigation
// ---------------------------------------------------------------------------

interface SidebarProps {
  navigation: NavItem[];
  collapsed: boolean;
  onToggleCollapse: () => void;
  onClose: () => void;
}

function hasActiveDescendant(items: NavItem[], pathname: string): boolean {
  for (const item of items) {
    if (item.path) {
      const p = pathname;
      if (
        p === item.path ||
        p.startsWith(item.path.endsWith("/") ? item.path : item.path + "/")
      )
        return true;
    }
    if (item.children && hasActiveDescendant(item.children, pathname))
      return true;
  }
  return false;
}

// firstNavigablePath returns the first descendant path the operator can
// reach. The boot-manifest navigation has already been permission-filtered
// server-side, so anything still in `children` is allowed — we just walk
// in order, skipping section headers and groups whose own children are
// also empty. Returns null when nothing inside is navigable, in which
// case the parent header acts as a pure expand/collapse control.
function firstNavigablePath(items: NavItem[] | undefined): string | null {
  if (!items) return null;
  for (const item of items) {
    if (item.is_section) continue;
    if (item.path) return item.path;
    const nested = firstNavigablePath(item.children);
    if (nested) return nested;
  }
  return null;
}

// Every route renders its own SduiAdminShell, so the sidebar remounts on each
// navigation. Its scroll offset lives at module scope to survive that remount
// instead of jumping back to the top whenever an item is clicked.
let sidebarScrollTop = 0;

function SidebarNav({
  navigation,
  collapsed,
  onToggleCollapse,
  onClose,
}: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const navRef = useRef<HTMLElement>(null);

  // Restore the previous offset before paint; if the current page's item is
  // still out of view (first load, deep link), bring it into view.
  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    nav.scrollTop = sidebarScrollTop;
    const current = nav.querySelector<HTMLElement>('[aria-current="page"]');
    if (!current) return;
    const view = nav.getBoundingClientRect();
    const item = current.getBoundingClientRect();
    if (item.top < view.top || item.bottom > view.bottom) {
      nav.scrollTop += item.top - view.top - (view.height - item.height) / 2;
      sidebarScrollTop = nav.scrollTop;
    }
  }, [location.pathname, navigation.length]);
  // Tracks groups explicitly toggled by the user (overrides auto-open logic).
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = useCallback((id: string, currentlyOpen: boolean) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !currentlyOpen }));
  }, []);
  // openGroup forces a group open without toggling — used when the parent
  // row navigates so the destination's group is visible after the jump.
  const openGroup = useCallback((id: string) => {
    setOpenGroups((prev) => ({ ...prev, [id]: true }));
  }, []);

  const isActive = useCallback(
    (path: string | undefined): boolean => {
      if (!path) return false;
      const p = location.pathname;
      if (p === path) return true;
      const prefix = path.endsWith("/") ? path : path + "/";
      if (!p.startsWith(prefix)) return false;
      // Only activate via prefix if remaining segments are resource identifiers
      // (numeric IDs, UUIDs, "edit", "new") — not named sub-sections like "taxonomies".
      const remaining = p.slice(prefix.length);
      return remaining
        .split("/")
        .every(
          (seg) =>
            seg === "" ||
            seg === "edit" ||
            seg === "new" ||
            /^\d+$/.test(seg) ||
            /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(seg),
        );
    },
    [location.pathname],
  );

  // A group is open if the user explicitly opened it, OR if it has an active
  // descendant and the user hasn't explicitly closed it.
  const isGroupOpen = useCallback(
    (item: NavItem): boolean => {
      if (item.id in openGroups) return openGroups[item.id];
      return hasActiveDescendant(item.children || [], location.pathname);
    },
    [openGroups, location.pathname],
  );

  const renderItem = (item: NavItem, depth: number = 0) => {
    const IconComp = getIcon(item.icon || "");
    const hasChildren = item.children && item.children.length > 0;
    const isOpen = isGroupOpen(item);
    // For parent groups, only apply the active style when a child is active —
    // but use a lighter treatment so the leaf item remains the primary highlight.
    const childActive =
      hasChildren && hasActiveDescendant(item.children!, location.pathname);
    // Leaf active: exact match or prefix match (for sub-routes like /edit/1)
    const active = !hasChildren && isActive(item.path);

    // Section header — non-clickable separator from boot manifest.
    if (item.is_section) {
      if (collapsed) {
        return <div key={item.id} className="my-2 mx-2 h-px" style={{background: "var(--sb-border)"}} />;
      }
      return (
        <div
          key={item.id}
          className="px-3 pt-5 pb-1.5 text-[12px] font-semibold"
          style={{color: "var(--sb-fg-muted)", letterSpacing: "-0.003em"}}
        >
          {item.label}
        </div>
      );
    }

    if (hasChildren) {
      // Two click targets in one row, so the operator gets two predictable
      // behaviors: clicking the label area jumps to the first navigable
      // child (and ensures the group is open), clicking the chevron pure-
      // toggles without navigating. ownPath wins over the descendant walk
      // so a parent that *also* declares its own path (rare but valid in
      // the manifest) still routes to itself.
      const ownPath = item.path;
      const targetPath = ownPath || firstNavigablePath(item.children);
      const handleNavigate = () => {
        if (targetPath) navigate(targetPath);
        openGroup(item.id);
        if (window.innerWidth < 1024) onClose();
      };
      return (
        <div key={item.id}>
          <div
            data-slot="nav-item"
            className="group flex w-full items-stretch rounded-lg text-[13.5px] font-medium"
            style={{color: childActive ? "var(--sb-fg-active)" : "var(--sb-fg)"}}
          >
            <button
              type="button"
              onClick={handleNavigate}
              className="flex flex-1 items-center gap-2.5 rounded-lg px-3 py-[7px] text-left min-w-0"
              title={collapsed ? item.label : undefined}
            >
              {IconComp && (
                <IconComp
                  size={16}
                  strokeWidth={1.75}
                  className="shrink-0"
                  style={{color: childActive ? "var(--sb-accent)" : "var(--sb-fg-muted)", opacity: 1}}
                />
              )}
              {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
            </button>
            {!collapsed && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleGroup(item.id, isOpen);
                }}
                className="grid place-items-center rounded-r-lg px-2"
                aria-label={isOpen ? "Collapse" : "Expand"}
                aria-expanded={isOpen}
                style={{color: "var(--sb-fg-muted)"}}
              >
                <ChevronDown
                  size={12}
                  className={`shrink-0 transition-transform duration-150 ${
                    isOpen ? "rotate-0" : "-rotate-90"
                  }`}
                />
              </button>
            )}
          </div>
          {isOpen && !collapsed && (
            <div className="mt-0.5 ml-3 border-l space-y-[1px]" style={{borderColor: "var(--sb-border)"}}>
              {item.children!.map((child) => renderItem(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    // Child rows live inside a parent group and visually attach to the
    // group's left border. They render with right-only rounding and a
    // full-height active indicator that sits flush against the border —
    // the rounded left edge looks detached when each child is supposed
    // to read as 'part of this group'.
    const isChild = depth > 0;
    const radiusClass = isChild ? "rounded-r-md rounded-l-none" : "rounded-lg";

    // Leaf item
    const linkContent = (
      <>
        {IconComp && (
          <IconComp
            size={16}
            strokeWidth={1.75}
            className="shrink-0"
            style={{
              color: active ? "var(--sb-accent)" : "var(--sb-fg-muted)",
              opacity: 1,
            }}
          />
        )}
        {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
      </>
    );

    if (item.path) {
      return (
        <Link
          key={item.id}
          to={item.path}
          onClick={onClose}
          data-slot="nav-item"
          data-active={active ? "true" : undefined}
          data-child={isChild ? "true" : undefined}
          aria-current={active ? "page" : undefined}
          className={`relative flex w-full items-center gap-2.5 ${radiusClass} px-3 py-[7px] text-[13.5px] font-medium`}
          style={{
            color: active ? "var(--sb-fg-active)" : "var(--sb-fg)",
            background: active ? "var(--sb-active)" : undefined,
            ...(isChild && depth > 1
              ? { paddingLeft: `${12 + (depth - 1) * 12}px` }
              : {}),
          }}
          title={collapsed ? item.label : undefined}
        >
          {linkContent}
        </Link>
      );
    }

    return (
      <button
        key={item.id}
        data-slot="nav-item"
        data-active={active ? "true" : undefined}
        data-child={isChild ? "true" : undefined}
        className={`relative flex w-full items-center gap-2.5 ${radiusClass} px-3 py-[7px] text-[13.5px] font-medium`}
        style={{
          color: active ? "var(--sb-fg-active)" : "var(--sb-fg)",
          background: active ? "var(--sb-active)" : undefined,
        }}
        title={collapsed ? item.label : undefined}
      >
        {linkContent}
      </button>
    );
  };

  return (
    <nav
      ref={navRef}
      onScroll={(e) => {
        sidebarScrollTop = e.currentTarget.scrollTop;
      }}
      className="flex-1 overflow-y-auto px-2 py-2 sb-scroll"
    >
      {/* Expand button when collapsed */}
      {collapsed && (
        <div className="mb-2 flex justify-center">
          <button
            onClick={onToggleCollapse}
            className="flex h-7 w-7 items-center justify-center rounded"
            style={{color: "var(--sb-fg-muted)"}}
            title="Expand sidebar"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Iterate the flat navigation list — is_section items render as
          non-clickable headers, regular items as links, items with children
          as expandable groups. */}
      {navigation.map((item) => renderItem(item))}
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Main Admin Shell
// ---------------------------------------------------------------------------

interface SduiAdminShellProps {
  children: React.ReactNode;
  mainClassName?: string;
}

export function SduiAdminShell({ children, mainClassName }: SduiAdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const { data: boot } = useBoot();
  const { languages, currentCode, setCurrentCode } = useAdminLanguage();
  const queryClient = useQueryClient();
  const [clearingCache, setClearingCache] = useState(false);
  const { data: themePages } = useQuery({
    queryKey: ["theme-settings-pages", currentCode],
    queryFn: getThemeSettingsPages,
    staleTime: 60_000,
  });

  const handleClearCache = useCallback(async () => {
    setClearingCache(true);
    try {
      await clearCache();
      toast.success("All caches cleared");
    } catch {
      toast.error("Failed to clear caches");
    } finally {
      setClearingCache(false);
    }
  }, []);

  const handleLanguageChange = useCallback(
    (code: string) => {
      setCurrentCode(code);
      // Invalidate every query so locale-aware fetches refresh under the new
      // X-Admin-Language header. queryClient.invalidateQueries() with no key
      // marks every cached query stale.
      queryClient.invalidateQueries();
    },
    [setCurrentCode, queryClient],
  );

  const breadcrumbs = useMemo(
    () => computeBreadcrumbs(location.pathname),
    [location.pathname],
  );

  // Document title — "{last crumb} — {site title}", falling back to
  // "{site title} Admin" on routes without breadcrumbs (e.g. dashboard).
  // SduiAdminShell is the actual shell rendered by the SDUI pages; the
  // sibling admin-layout.tsx covers the legacy non-SDUI routes.
  const branding = useBranding();
  useEffect(() => {
    const last = breadcrumbs[breadcrumbs.length - 1];
    document.title = last ? `${last} — ${branding.siteTitle}` : `${branding.siteTitle} Admin`;
  }, [breadcrumbs, branding.siteTitle]);

  const navigation = useMemo<NavItem[]>(() => {
    const base = boot?.navigation || [];
    const pages = themePages?.pages || [];
    if (pages.length === 0) return base;
    const themeSection: NavItem[] = [
      {
        id: "theme-settings-section",
        label: "Theme Settings",
        is_section: true,
      },
      ...pages.map<NavItem>((p) => ({
        id: `theme-settings-${p.slug}`,
        label: p.name,
        icon: p.icon || "Palette",
        path: `/admin/theme-settings/${p.slug}`,
      })),
    ];
    // Insert immediately before the kernel "Settings" section so theme
    // settings appear above core settings — they're touched far more often
    // (theme tweaks vs. one-time site config).
    const insertAt = base.findIndex((item) => item.id === "section-settings");
    if (insertAt === -1) {
      return [...base, ...themeSection];
    }
    return [...base.slice(0, insertAt), ...themeSection, ...base.slice(insertAt)];
  }, [boot?.navigation, themePages?.pages]);

  const sidebarWidth = collapsed ? 56 : 256;

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  return (
    <div className="relative flex h-screen overflow-hidden" style={{background: "var(--app-bg)"}}>
      {/* ----------------------------------------------------------------- */}
      {/* Mobile overlay                                                     */}
      {/* ----------------------------------------------------------------- */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Sidebar                                                            */}
      {/* ----------------------------------------------------------------- */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-200 lg:relative lg:z-auto ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{ width: sidebarWidth, background: "var(--sb-bg)" }}
      >
        {/* Logo header */}
        <div className="flex shrink-0 items-center" style={{ height: 56, padding: "0 14px", borderBottom: "1px solid var(--sb-border)" }}>
          <div className="flex items-center min-w-0" style={{ gap: 10 }}>
            <div
              className="grid shrink-0 place-items-center overflow-hidden"
              style={{
                width: 26,
                height: 26,
                borderRadius: 7,
                background: branding.faviconUrl ? "transparent" : "var(--accent)",
                color: "var(--accent-fg)",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {branding.faviconUrl ? (
                <img
                  src={branding.faviconUrl}
                  alt=""
                  width={26}
                  height={26}
                  style={{ width: 26, height: 26, objectFit: "contain" }}
                />
              ) : (
                branding.siteTitle.charAt(0).toUpperCase() || "S"
              )}
            </div>
            {!collapsed && (
              <span className="truncate" style={{ fontSize: 14.5, fontWeight: 600, color: "var(--sb-fg-active)", letterSpacing: "-0.02em" }}>
                {branding.siteTitle}
              </span>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="ml-auto hidden h-6 w-6 items-center justify-center rounded lg:grid"
              style={{color: "var(--sb-fg-muted)"}}
              title="Collapse sidebar"
            >
              <ChevronRight size={14} className="rotate-180" />
            </button>
          )}
          <button
            className="ml-auto rounded p-1 lg:hidden"
            style={{color: "var(--sb-fg-muted)"}}
            onClick={() => setSidebarOpen(false)}
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <SidebarNav
          navigation={navigation}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(false)}
          onClose={() => setSidebarOpen(false)}
        />

        {/* User footer */}
        <div className="shrink-0 border-t p-2" style={{borderColor: "var(--sb-border)"}}>
          {collapsed ? (
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center rounded-lg py-2"
              style={{color: "var(--sb-fg-muted)"}}
              title="Log out"
            >
              <LogOut size={15} />
            </button>
          ) : (
            <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[13px] font-semibold" style={{background: "var(--accent)", color: "var(--accent-fg)"}}>
                {(user?.full_name || user?.email || "A")
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium" style={{color: "var(--sb-fg-active)"}}>
                  {user?.full_name || "Admin"}
                </p>
                <p className="truncate text-[12px]" style={{color: "var(--sb-fg-muted)"}}>
                  {user?.email}
                </p>
              </div>
              <button
                onClick={handleLogout}
                data-slot="nav-item"
                className="shrink-0 rounded-md p-1.5"
                style={{color: "var(--sb-fg-muted)"}}
                title="Log out"
                aria-label="Log out"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ----------------------------------------------------------------- */}
      {/* Main content area                                                  */}
      {/* ----------------------------------------------------------------- */}
      {/* min-w-0 + min-h-0 — without these flex children inherit
          min-width/min-height: auto which lets them grow past their parent's
          bounds. That was the source of the "page gets cut off mid-scroll"
          paint glitch: the inner <main overflow-y-auto> would intermittently
          fail to repaint its bottom region because layout was racing. */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0 min-h-0">
        {/* Top bar */}
        <header
          data-slot="topbar"
          className="flex shrink-0 items-center justify-between"
          style={{ height: 56, gap: 12, background: "var(--card-bg)", borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-center min-w-0" style={{ gap: 8 }}>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-md lg:hidden"
              style={{ color: "var(--fg-muted)" }}
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
            <nav aria-label="Breadcrumb" className="flex items-center min-w-0" style={{ gap: 7, fontSize: 13.5, color: "var(--fg-muted)", letterSpacing: "-0.006em" }}>
              <Home size={14} style={{ color: "var(--fg-subtle)", flexShrink: 0 }} />
              {breadcrumbs.map((crumb, i) => {
                const last = i === breadcrumbs.length - 1;
                // Phones and small tablets keep only the parent and current crumb.
                const early = i < breadcrumbs.length - 2;
                return (
                  <span key={i} className={`${early ? "hidden md:flex" : "flex"} items-center min-w-0`} style={{ gap: 7 }}>
                    <ChevronRight size={13} style={{ color: "var(--fg-hint)", flexShrink: 0 }} />
                    <span className="truncate" style={{ color: last ? "var(--fg)" : "var(--fg-muted)", fontWeight: last ? 600 : 500 }}>
                      {crumb}
                    </span>
                  </span>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center" style={{ gap: 2 }}>
            {languages.length > 0 && (
              <label
                data-slot="topbar-action"
                className="hidden sm:flex items-center"
                style={{ height: 32, padding: "0 10px", borderRadius: 7, gap: 7, fontSize: 13, color: "var(--fg-2)", letterSpacing: "-0.006em" }}
              >
                <Globe size={14} style={{ color: "var(--fg-subtle)" }} />
                <select
                  value={currentCode}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="bg-transparent outline-none"
                  style={{ fontSize: 13, fontWeight: 500, color: "var(--fg-2)" }}
                  aria-label="Admin language"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name || lang.code}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <button
              data-slot="topbar-action"
              onClick={handleClearCache}
              disabled={clearingCache}
              className="hidden sm:flex items-center"
              style={{ height: 32, padding: "0 10px", borderRadius: 7, gap: 7, fontSize: 13, fontWeight: 500, color: "var(--fg-2)", background: "transparent", letterSpacing: "-0.006em", opacity: clearingCache ? 0.5 : 1 }}
              title="Clear all caches"
              aria-label="Clear cache"
            >
              <RefreshCw size={14} style={{ color: "var(--fg-subtle)" }} className={clearingCache ? "animate-spin" : ""} />
              <span className="hidden xl:inline">{clearingCache ? "Clearing…" : "Clear cache"}</span>
            </button>

            <button
              data-slot="topbar-action"
              onClick={() => window.open("/", "_blank")}
              className="hidden sm:flex items-center"
              style={{ height: 32, padding: "0 10px", borderRadius: 7, gap: 7, fontSize: 13, fontWeight: 500, color: "var(--fg-2)", background: "transparent", letterSpacing: "-0.006em" }}
              title="Visit site"
              aria-label="Visit site"
            >
              <ExternalLink size={14} style={{ color: "var(--fg-subtle)" }} />
              <span className="hidden xl:inline">Visit site</span>
            </button>

            <button
              data-slot="topbar-action"
              className="flex items-center justify-center"
              style={{ width: 32, height: 32, borderRadius: 7, color: "var(--fg-muted)", background: "transparent", border: "none" }}
              aria-label="Notifications"
            >
              <Bell size={16} />
            </button>

            <div style={{ width: 1, height: 22, background: "var(--border)", margin: "0 8px" }} />

            <button
              data-slot="topbar-action"
              className="flex items-center"
              style={{ height: 34, padding: "0 10px 0 4px", borderRadius: 17, gap: 8, background: "transparent", border: "none" }}
              title={user?.email}
            >
              <span
                className="grid place-items-center shrink-0"
                style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--accent)", color: "var(--accent-fg)", fontSize: 12, fontWeight: 600 }}
              >
                {(user?.full_name || user?.email || "A").charAt(0).toUpperCase()}
              </span>
              <span className="hidden sm:inline" style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)" }}>
                {user?.full_name || (user?.email ? user.email.split("@")[0] : "Admin")}
              </span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main
          data-slot="admin-main"
          className={mainClassName ?? "flex-1 overflow-y-auto"}
          style={{
            // position: relative makes <main> the containing block for
            // absolutely positioned descendants (sr-only text, Radix hidden
            // inputs, chart overlays). Without it they anchor to <body>,
            // escape this scroll container and stretch the document, so the
            // window itself scrolls and the shell slides away ("overscroll /
            // cut off" bug). The shell root is relative for the same reason.
            // Gutters come from [data-slot="admin-main"] in index.css so they
            // can tighten on tablets and phones.
            position: "relative",
            // overflow-anchor: none avoids Chrome's scroll-anchoring kicking in
            // when content above the viewport changes height — that was firing
            // mid-scroll and causing the "lower half of page goes blank" paint
            // glitch with sticky asides inside this scroll container.
            overflowAnchor: "none",
          }}
        >
          <div style={{ maxWidth: 1320, margin: "0 auto" }}>{children}</div>
        </main>
      </div>
    </div>
  );
}
