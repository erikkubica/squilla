import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  fetchExtensionManifests,
  loadExtension,
  type ExtensionManifestEntry,
  type LoadedExtension,
  type AdminUIRoute,
  type AdminUIMenu,
} from "@/lib/extension-loader";

interface ExtensionsContextValue {
  manifests: ExtensionManifestEntry[];
  loaded: Map<string, LoadedExtension>;
  loading: boolean;
  getSlotExtensions: (
    slotName: string,
  ) => Array<{ slug: string; label: string; Component: React.ComponentType<unknown> }>;
  routes: Array<AdminUIRoute & { slug: string }>;
  menus: Array<AdminUIMenu & { slug: string }>;
}

const ExtensionsContext = createContext<ExtensionsContextValue>({
  manifests: [],
  loaded: new Map(),
  loading: true,
  getSlotExtensions: () => [],
  routes: [],
  menus: [],
});

export function ExtensionsProvider({ children }: { children: ReactNode }) {
  const [manifests, setManifests] = useState<ExtensionManifestEntry[]>([]);
  const [loaded, setLoaded] = useState<Map<string, LoadedExtension>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const entries = await fetchExtensionManifests();
      if (cancelled) return;
      setManifests(entries);

      const loadedMap = new Map<string, LoadedExtension>();
      await Promise.allSettled(
        entries.map(async (entry) => {
          const ext = await loadExtension(entry);
          if (ext) loadedMap.set(entry.slug, ext);
        }),
      );

      if (!cancelled) {
        setLoaded(loadedMap);
        setLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  function getSlotExtensions(slotName: string) {
    const results: Array<{
      slug: string;
      label: string;
      Component: React.ComponentType<unknown>;
    }> = [];

    for (const [slug, ext] of loaded) {
      const adminUI = ext.entry.manifest.admin_ui;
      if (!adminUI?.slots?.[slotName]) continue;

      const slotDef = adminUI.slots[slotName];
      const Component = ext.module[slotDef.component];
      if (Component) {
        results.push({ slug, label: slotDef.label, Component });
      }
    }

    return results;
  }

  const routes: Array<AdminUIRoute & { slug: string }> = [];
  const menus: Array<AdminUIMenu & { slug: string }> = [];

  for (const [slug, ext] of loaded) {
    const adminUI = ext.entry.manifest.admin_ui;
    if (!adminUI) continue;

    if (adminUI.routes) {
      for (const route of adminUI.routes) {
        routes.push({ ...route, slug });
      }
    }

    if (adminUI.menu) {
      menus.push({ ...adminUI.menu, slug });
    }
  }

  return (
    <ExtensionsContext.Provider
      value={{ manifests, loaded, loading, getSlotExtensions, routes, menus }}
    >
      {children}
    </ExtensionsContext.Provider>
  );
}

export function useExtensions() {
  return useContext(ExtensionsContext);
}
