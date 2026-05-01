import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";

interface SidebarCardProps {
  title: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  contentClassName?: string;
}

/**
 * SidebarCard is the standard right-rail card used by editors and settings
 * pages: paper card lifted by shadow + clean header (title + actions) +
 * padded body. Visual styling comes from the global card data-slot cascade
 * in index.css, so we don't need explicit borders/shadows here.
 */
export function SidebarCard({ title, icon, actions, children, contentClassName }: SidebarCardProps) {
  return (
    <Card>
      <SectionHeader title={title} icon={icon} actions={actions} />
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  );
}

export default SidebarCard;
