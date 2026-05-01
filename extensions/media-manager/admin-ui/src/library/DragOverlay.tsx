import { UploadCloud } from "@squilla/icons";

export default function DragOverlay({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="fixed inset-0 z-[60] pointer-events-none">
      <div className="absolute inset-4 rounded-2xl border-2 border-dashed border-border grid place-items-center" style={{ background: "rgba(248, 246, 240, 0.92)" }}>
        <div className="text-center animate-pulse">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary text-white grid place-items-center shadow-lg">
            <UploadCloud className="h-8 w-8" />
          </div>
          <div className="mt-3 text-[15px] font-semibold text-foreground">Drop anywhere to upload</div>
          <div className="text-[12px] text-foreground">We'll handle the rest — optimize, variants, CDN</div>
        </div>
      </div>
    </div>
  );
}
