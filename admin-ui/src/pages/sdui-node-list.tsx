import { useParams, useSearchParams } from "react-router-dom";
import { SduiAdminShell } from "../sdui/admin-shell";
import { useLayout } from "../hooks/use-layout";
import { LayoutRenderer } from "../sdui/renderer";
import { getPageStore } from "../sdui/action-handler";

export function SduiNodeListPage({
  nodeTypeOverride,
}: { nodeTypeOverride?: string } = {}) {
  const { nodeType: urlNodeType } = useParams<{ nodeType: string }>();
  const nodeType = nodeTypeOverride || urlNodeType || "page";
  const [searchParams] = useSearchParams();

  // Pass URL params as layout query params
  const params: Record<string, string> = { nodeType: nodeType || "page" };
  const search = searchParams.get("search");
  const status = searchParams.get("status");
  const page = searchParams.get("page");
  const language = searchParams.get("language");
  const sort = searchParams.get("sort");
  const order = searchParams.get("order");
  if (search) params.search = search;
  if (status && status !== "all") params.status = status;
  if (page) params.page = page;
  if (language && language !== "all") params.language = language;
  if (sort) params.sort = sort;
  const per_page = searchParams.get("per_page");
  if (per_page) params.per_page = per_page;
  if (order) params.order = order;

  const {
    data: layout,
    isLoading,
    isFetching,
    error,
  } = useLayout("node-list", params);
  const store = getPageStore(`node-list-${nodeType}`);

  // Only show full-page spinner on initial load (no data yet).
  // When params change and we're refetching, keep the previous layout mounted
  // so interactive elements (search input, filter dropdowns) don't lose focus.
  const showSpinner = isLoading && !layout;

  return (
    <SduiAdminShell>
      {showSpinner ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{borderColor: "var(--accent-mid)"}} />
        </div>
      ) : error && !layout ? (
        <div className="rounded-lg border p-4 text-sm" style={{background: "var(--danger-bg)", borderColor: "var(--danger-border)", color: "var(--danger)"}}>
          <p className="font-medium">Failed to load content</p>
          <p className="mt-1" style={{color: "var(--danger)"}}>{error.message}</p>
        </div>
      ) : layout ? (
        <div
          className={isFetching ? "opacity-90 transition-opacity" : undefined}
        >
          <LayoutRenderer
            layout={layout}
            pageId={`node-list-${nodeType}`}
            params={params}
            store={store}
          />
        </div>
      ) : null}
    </SduiAdminShell>
  );
}
