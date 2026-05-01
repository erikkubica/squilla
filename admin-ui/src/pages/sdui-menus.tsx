import { useSearchParams } from "react-router-dom";
import { SduiAdminShell } from "../sdui/admin-shell";
import { useLayout } from "../hooks/use-layout";
import { LayoutRenderer } from "../sdui/renderer";
import { getPageStore } from "../sdui/action-handler";

export function SduiMenusPage() {
  const [searchParams] = useSearchParams();
  const params: Record<string, string> = {};
  const page = searchParams.get("page");
  const language = searchParams.get("language");
  const search = searchParams.get("search");
  const sort = searchParams.get("sort");
  const order = searchParams.get("order");
  if (page) params.page = page;
  if (language && language !== "all") params.language = language;
  if (search) params.search = search;
  if (sort) params.sort = sort;
  const per_page = searchParams.get("per_page");
  if (per_page) params.per_page = per_page;
  if (order) params.order = order;

  const {
    data: layout,
    isLoading,
    isFetching,
    error,
  } = useLayout("menus", params);
  const store = getPageStore("menus");

  const showSpinner = isLoading && !layout;

  return (
    <SduiAdminShell>
      {showSpinner ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{borderColor: "var(--accent-mid)"}} />
        </div>
      ) : error && !layout ? (
        <div className="rounded-lg border p-4 text-sm" style={{background: "var(--danger-bg)", borderColor: "var(--danger-border)", color: "var(--danger)"}}>
          <p className="font-medium">Failed to load menus</p>
          <p className="mt-1" style={{color: "var(--danger)"}}>{error.message}</p>
        </div>
      ) : layout ? (
        <div
          className={isFetching ? "opacity-90 transition-opacity" : undefined}
        >
          <LayoutRenderer layout={layout} pageId="menus" store={store} />
        </div>
      ) : null}
    </SduiAdminShell>
  );
}
