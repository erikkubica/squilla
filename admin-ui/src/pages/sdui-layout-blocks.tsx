import { useSearchParams } from "react-router-dom";
import { SduiAdminShell } from "../sdui/admin-shell";
import { useLayout } from "../hooks/use-layout";
import { LayoutRenderer } from "../sdui/renderer";
import { getPageStore } from "../sdui/action-handler";

export function SduiLayoutBlocksPage() {
  const [searchParams] = useSearchParams();
  const params: Record<string, string> = {};
  const page = searchParams.get("page");
  const language = searchParams.get("language");
  const source = searchParams.get("source");
  const search = searchParams.get("search");
  const sort = searchParams.get("sort");
  const order = searchParams.get("order");
  if (page) params.page = page;
  if (language && language !== "all") params.language = language;
  if (source && source !== "all") params.source = source;
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
  } = useLayout("layout-blocks", params);
  const store = getPageStore("layout-blocks");

  const showSpinner = isLoading && !layout;

  return (
    <SduiAdminShell>
      {showSpinner ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{borderColor: "var(--accent-mid)"}} />
        </div>
      ) : error && !layout ? (
        <div className="rounded-lg border p-4 text-sm" style={{background: "var(--danger-bg)", borderColor: "var(--danger-border)", color: "var(--danger)"}}>
          <p className="font-medium">Failed to load layout blocks</p>
          <p className="mt-1" style={{color: "var(--danger)"}}>{error.message}</p>
        </div>
      ) : layout ? (
        <div
          className={isFetching ? "opacity-90 transition-opacity" : undefined}
        >
          <LayoutRenderer
            layout={layout}
            pageId="layout-blocks"
            store={store}
          />
        </div>
      ) : null}
    </SduiAdminShell>
  );
}
