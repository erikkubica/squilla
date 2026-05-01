import { Suspense, useState } from "react";
import { Loader2, Puzzle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useExtensions } from "@/hooks/use-extensions";
import { ExtensionErrorBoundary } from "@/components/extension-error-boundary";

interface ExtensionSlotProps {
  name: string;
  fallback?: React.ReactNode;
}

export function ExtensionSlot({ name, fallback }: ExtensionSlotProps) {
  const { getSlotExtensions, loading } = useExtensions();
  const extensions = getSlotExtensions(name);
  const [activeTab, setActiveTab] = useState<string>("");

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--accent-strong)" }} />
      </div>
    );
  }

  if (extensions.length === 0) {
    return (
      fallback || (
        <Card className="rounded-xl border border-border shadow-sm">
          <CardContent className="flex h-32 flex-col items-center justify-center gap-2" style={{ color: "var(--fg-subtle)" }}>
            <Puzzle className="h-8 w-8" />
            <p className="text-sm">No extensions available for this section</p>
          </CardContent>
        </Card>
      )
    );
  }

  if (extensions.length === 1) {
    const { slug, Component } = extensions[0];
    return (
      <ExtensionErrorBoundary extensionName={slug}>
        <Suspense
          fallback={
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--accent-strong)" }} />
            </div>
          }
        >
          <Component />
        </Suspense>
      </ExtensionErrorBoundary>
    );
  }

  const defaultTab = activeTab || extensions[0].slug;

  return (
    <Tabs value={defaultTab} onValueChange={setActiveTab}>
      <TabsList>
        {extensions.map((ext) => (
          <TabsTrigger key={ext.slug} value={ext.slug}>
            {ext.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {extensions.map((ext) => (
        <TabsContent key={ext.slug} value={ext.slug}>
          <ExtensionErrorBoundary extensionName={ext.slug}>
            <Suspense
              fallback={
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--accent-strong)" }} />
                </div>
              }
            >
              <ext.Component />
            </Suspense>
          </ExtensionErrorBoundary>
        </TabsContent>
      ))}
    </Tabs>
  );
}
