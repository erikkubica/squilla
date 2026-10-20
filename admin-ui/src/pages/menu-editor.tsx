import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Save,
  Loader2,
  Globe,
  Link as LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Titlebar } from "@/components/ui/titlebar";
import { MetaRow, MetaList } from "@/components/ui/meta-row";
import { PublishActions } from "@/components/ui/publish-actions";
import { SidebarCard } from "@/components/ui/sidebar-card";
import { TabsCard } from "@/components/ui/tabs-card";
import { toast } from "sonner";
import { usePageMeta } from "@/components/layout/page-meta";
import {
  getMenu,
  createMenu,
  updateMenu,
  replaceMenuItems,
  getLanguages,
  getMenus,
  getMenuLocations,
  assignMenuLocations,
  type Menu,
  type MenuLocation,
  type MenuItem,
  type Language,
} from "@/api/client";
import MenuTree, { generateTempId } from "@/components/menu-tree";

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function countMenuItems(items: MenuItem[]): number {
  let n = 0;
  for (const it of items) {
    n += 1;
    if (it.children && it.children.length > 0) n += countMenuItems(it.children);
  }
  return n;
}

function newMenuItem(type: MenuItem["item_type"]): MenuItem {
  const base: MenuItem = {
    _uid: generateTempId(),
    title: "",
    item_type: type,
    target: "_self",
    css_class: "",
    children: [],
  };
  if (type === "custom") base.url = "";
  if (type === "node") base.node_id = null;
  return base;
}

export default function MenuEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id;

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [languages, setLanguages] = useState<Language[]>([]);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [languageId, setLanguageId] = useState<number | null>(null);
  const [version, setVersion] = useState(1);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [originalMenu, setOriginalMenu] = useState<Menu | null>(null);
  // Theme menu locations: what's assigned now, and which ones this menu
  // should own after saving (keyed by location slug).
  const [locations, setLocations] = useState<MenuLocation[]>([]);
  const [menuNames, setMenuNames] = useState<Record<string, string>>({});
  const [ownedLocations, setOwnedLocations] = useState<Record<string, boolean>>({});

  usePageMeta([
    "Menus",
    isNew ? "New Menu" : (name ? `Edit "${name}"` : "Edit"),
  ]);

  const fetchMenu = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const menu = await getMenu(id);
      setOriginalMenu(menu);
      setName(menu.name);
      setSlug(menu.slug);
      setSlugTouched(true);
      setLanguageId(menu.language_id);
      setVersion(menu.version);
      setMenuItems(menu.items || []);
    } catch {
      toast.error("Failed to load menu");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  useEffect(() => {
    getMenuLocations().then(setLocations).catch(() => {});
    getMenus()
      .then((all) => setMenuNames(Object.fromEntries(all.map((m) => [m.slug, m.name]))))
      .catch(() => {});
  }, []);

  // Tick the locations this menu currently fills once both are known.
  const loadedSlug = originalMenu?.slug ?? "";
  useEffect(() => {
    if (!loadedSlug) return;
    setOwnedLocations(Object.fromEntries(locations.map((l) => [l.slug, l.menu_slug === loadedSlug])));
  }, [locations, loadedSlug]);

  // Locations whose assignment changes on save: ticked ones point at this
  // menu, unticked ones this menu used to fill are cleared.
  function locationChanges(menuSlug: string): Record<string, string> {
    const changes: Record<string, string> = {};
    for (const loc of locations) {
      const owned = !!ownedLocations[loc.slug];
      const ownedBefore = !!loadedSlug && loc.menu_slug === loadedSlug;
      if (owned && loc.menu_slug !== menuSlug) changes[loc.slug] = menuSlug;
      else if (!owned && ownedBefore) changes[loc.slug] = "";
    }
    return changes;
  }

  async function saveLocations(menuSlug: string) {
    const changes = locationChanges(menuSlug);
    if (Object.keys(changes).length === 0) return;
    setLocations(await assignMenuLocations(changes));
  }

  useEffect(() => {
    getLanguages(true)
      .then((langs) => {
        setLanguages(langs);
        if (!id && langs.length > 0) {
          const def = langs.find((l) => l.is_default);
          if (def) setLanguageId(def.id);
        }
      })
      .catch(() => {});
  }, [id]);

  function handleNameChange(val: string) {
    setName(val);
    if (!slugTouched) {
      setSlug(slugify(val));
    }
  }

  function addItem(type: MenuItem["item_type"]) {
    const item = newMenuItem(type);
    const uid = item._uid!;
    setMenuItems((prev) => [...prev, item]);
    setLastAddedId(uid);
  }

  function stripUids(items: MenuItem[]): MenuItem[] {
    return items.map((item) => {
      const clean = { ...item };
      delete clean._uid;
      if (clean.children && clean.children.length > 0) {
        clean.children = stripUids(clean.children);
      }
      return clean;
    });
  }

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Menu name is required");
      return;
    }
    if (!slug.trim()) {
      toast.error("Menu slug is required");
      return;
    }

    const cleanItems = stripUids(menuItems);

    setSaving(true);
    try {
      if (isNew) {
        const menu = await createMenu({
          name,
          slug,
          language_id: languageId,
          items: cleanItems,
        });
        await saveLocations(menu.slug);
        toast.success("Menu created successfully");
        navigate(`/admin/menus/${menu.id}`, { replace: true });
      } else {
        // Update menu metadata
        await updateMenu(id!, {
          name,
          slug,
          language_id: languageId,
        });
        // Replace menu items with version check
        try {
          const updated = await replaceMenuItems(id!, version, cleanItems);
          setVersion(updated.version);
          await saveLocations(slug);
          setOriginalMenu((m) => (m ? { ...m, slug } : m));
          toast.success("Menu saved successfully");
        } catch (err: unknown) {
          if (
            err &&
            typeof err === "object" &&
            "code" in err &&
            (err as { code: string }).code === "VERSION_CONFLICT"
          ) {
            toast.error("Menu was modified by another user. Refreshing...");
            await fetchMenu();
            return;
          }
          throw err;
        }
      }
    } catch {
      toast.error("Failed to save menu");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{color: "var(--accent-strong)"}} />
      </div>
    );
  }

  // Match the editor template used by node / taxonomy / term editors:
  // a fluid main column plus a fixed 320px sidebar. Was lg:grid-cols-3
  // with col-span-2, which gave the sidebar a third of the viewport on
  // wide screens — much wider than every other edit page.
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      {/* Main content */}
      <div className="space-y-4 min-w-0">
        <Titlebar
          title={name}
          onTitleChange={handleNameChange}
          titleLabel="Name"
          titlePlaceholder="Menu name"
          slug={slug}
          onSlugChange={(v) => { setSlugTouched(true); setSlug(v); }}
          slugPrefix="/"
          autoSlug={!slugTouched}
          onAutoSlugToggle={() => {
            if (slugTouched) setSlug(slugify(name));
            setSlugTouched(!slugTouched);
          }}
          id={!isNew ? id : undefined}
          onBack={() => navigate("/admin/menus")}
        />

        <TabsCard
          tabs={[
            {
              value: "items",
              label: "Items",
              badge: countMenuItems(menuItems),
              content: (
                <div className="space-y-3">
                  <MenuTree items={menuItems} onChange={setMenuItems} autoEditId={lastAddedId} />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 rounded-lg border-dashed border-border text-muted-foreground"
                      style={{ color: "var(--accent-strong)" }}
                      onClick={() => addItem("node")}
                    >
                      <LinkIcon className="mr-2 h-4 w-4" />
                      Add Page Link
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 rounded-lg border-dashed border-border text-muted-foreground"
                      style={{ color: "var(--accent-strong)" }}
                      onClick={() => addItem("custom")}
                    >
                      <Globe className="mr-2 h-4 w-4" />
                      Add Custom URL
                    </Button>
                  </div>
                </div>
              ),
            },
          ]}
        />
        </div>

      {/* Sidebar */}
      <aside className="lg:sticky lg:top-4 lg:self-start space-y-4">
        <SidebarCard title="Publish">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Language</Label>
            <Select
              value={languageId === null ? "all" : String(languageId)}
              onValueChange={(v) => setLanguageId(v === "all" ? null : Number(v))}
            >
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Languages</SelectItem>
                {languages.map((lang) => (
                  <SelectItem key={lang.id} value={String(lang.id)}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <PublishActions>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full"
            >
              {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
              {saving ? "Saving..." : "Save Menu"}
            </Button>
          </PublishActions>
          {!isNew && originalMenu && (
            <MetaList>
              <MetaRow label="Version" value={`v${version}`} />
              {originalMenu.created_at && <MetaRow label="Created" value={new Date(originalMenu.created_at).toLocaleDateString("en-GB")} />}
              {originalMenu.updated_at && <MetaRow label="Updated" value={new Date(originalMenu.updated_at).toLocaleDateString("en-GB")} />}
            </MetaList>
          )}
        </SidebarCard>

        {locations.length > 0 && (
          <SidebarCard title="Display location">
            <p className="text-xs text-muted-foreground">
              Where the theme shows this menu. Each location holds one menu.
            </p>
            <div className="space-y-3">
              {locations.map((loc) => {
                const elsewhere =
                  loc.menu_slug && loc.menu_slug !== loadedSlug ? menuNames[loc.menu_slug] ?? loc.menu_slug : "";
                const checked = !!ownedLocations[loc.slug];
                return (
                  <label key={loc.slug} className="flex cursor-pointer items-start gap-2.5">
                    <Checkbox
                      className="mt-0.5"
                      checked={checked}
                      onCheckedChange={(v) => setOwnedLocations((prev) => ({ ...prev, [loc.slug]: v === true }))}
                    />
                    <span className="min-w-0 space-y-0.5">
                      <span className="block text-sm font-medium leading-tight text-foreground">{loc.label}</span>
                      {loc.description && <span className="block text-xs text-muted-foreground">{loc.description}</span>}
                      {elsewhere && (
                        <span className="block text-xs" style={{ color: checked ? "var(--warning, #b45309)" : "var(--text-muted, inherit)" }}>
                          {checked ? `Replaces “${elsewhere}” on save` : `Currently: ${elsewhere}`}
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          </SidebarCard>
        )}
      </aside>
    </div>
  );
}
