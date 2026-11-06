import { UploadCloud } from "@squilla/icons";

export default function DragOverlay({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="fixed inset-0 z-[60] pointer-events-none">
      <div
        className="absolute inset-4 grid place-items-center"
        style={{
          borderRadius: 16,
          border: "2px dashed var(--accent)",
          background: "rgba(236, 239, 243, 0.92)",
        }}
      >
        <div className="text-center">
          <div
            className="mx-auto grid place-items-center"
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "var(--accent)",
              color: "var(--accent-fg)",
              boxShadow: "var(--shadow-md)",
            }}
          >
            <UploadCloud className="h-8 w-8" />
          </div>
          <div style={{ marginTop: 14, fontSize: 16, fontWeight: 600, color: "var(--fg)" }}>Drop to upload</div>
          <div style={{ marginTop: 2, fontSize: 13, color: "var(--fg-muted)" }}>
            Images are optimized and resized automatically.
          </div>
        </div>
      </div>
    </div>
  );
}
