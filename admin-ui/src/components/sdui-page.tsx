import { useParams } from "react-router-dom";
import { useLayout } from "../hooks/use-layout";
import { useBoot } from "../hooks/use-boot";
import { LayoutRenderer } from "../sdui/renderer";
import { getPageStore } from "../sdui/action-handler";

export function SduiPage() {
  const { page } = useParams<{ page: string }>();
  const store = getPageStore(page || "default");

  // Fetch boot manifest — validates the /admin/api/boot round-trip.
  // In production this would live in AdminLayout and feed the sidebar +
  // user context. For validation we show the summary here.
  const { data: boot, isLoading: bootLoading } = useBoot();

  const {
    data: layout,
    isLoading: layoutLoading,
    error,
  } = useLayout(page || "dashboard");

  const isLoading = bootLoading || layoutLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !layout) {
    return (
      <div className="rounded-lg border p-4 text-sm" style={{ borderColor: "var(--danger-border)", background: "var(--danger-bg)", color: "var(--danger)" }}>
        <p className="font-medium">Failed to load page</p>
        <p className="mt-1" style={{ color: "var(--danger)" }}>
          {error?.message || "No layout data"}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Boot manifest debug strip — remove after validation */}
      {boot && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-800">
          <span className="font-semibold">VDUS Boot</span>{" "}
          <span className="text-blue-600">
            v{boot.version} · {boot.user.email} ({boot.user.role}) ·{" "}
            {boot.extensions.length} extensions · {boot.node_types.length} node
            types · {boot.navigation.length} nav groups
          </span>
        </div>
      )}

      <LayoutRenderer
        layout={layout}
        pageId={page}
        params={page ? { page } : undefined}
        store={store}
      />
    </div>
  );
}
