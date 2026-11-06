import type { CSSProperties, ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface TabsCardItem {
  value: string;
  label: ReactNode;
  /** Optional count/marker shown next to the label. */
  badge?: ReactNode;
  content: ReactNode;
  disabled?: boolean;
  /** Per-tab panel style, e.g. a recessed background for a block list. */
  panelStyle?: CSSProperties;
}

interface TabsCardProps {
  tabs: TabsCardItem[];
  /** Controlled active tab. Pair with onValueChange. */
  value?: string;
  onValueChange?: (value: string) => void;
  /** Uncontrolled initial tab. Falls back to first tab's value. */
  defaultValue?: string;
  /** Override panel padding. Default matches the node-editor v2 design. */
  panelPadding?: string;
}

/**
 * TabsCard — the shared editor surface: a Card containing Tabs + TabsList +
 * one TabsContent per item. Pages pass a `tabs` array of `{ value, label,
 * badge?, content }` and the primitive renders identical chrome everywhere
 * (admin pages and extension micro-frontends via the shim).
 */
export function TabsCard({
  tabs,
  value,
  onValueChange,
  defaultValue,
  panelPadding = "18px 18px 20px",
}: TabsCardProps) {
  if (tabs.length === 0) return null;
  const fallback = defaultValue ?? tabs[0].value;

  return (
    <Card>
      <Tabs
        value={value}
        onValueChange={onValueChange}
        defaultValue={value === undefined ? fallback : undefined}
      >
        <TabsList style={{ outline: "none", paddingLeft: 12, paddingRight: 12 }}>
          {tabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value} disabled={t.disabled}>
              {t.label}
              {t.badge !== undefined && t.badge !== null && (
                <span data-slot="count">{t.badge}</span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((t) => (
          <TabsContent key={t.value} value={t.value} style={{ padding: panelPadding, ...t.panelStyle }}>
            {t.content}
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  );
}

export default TabsCard;
