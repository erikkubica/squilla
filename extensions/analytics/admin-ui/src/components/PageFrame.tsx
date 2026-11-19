import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { useWidth } from "../hooks/useWidth";

/** The frame's window and document (same origin), or null. */
export function frameWin(f: RefObject<HTMLIFrameElement | null>): Window | null {
  return f.current?.contentWindow ?? null;
}

export function frameDoc(f: RefObject<HTMLIFrameElement | null>): Document | null {
  try {
    return f.current?.contentDocument ?? null;
  } catch {
    return null;
  }
}

interface Props {
  path: string;
  /** Viewport the page is shown at, in CSS px. */
  width: number;
  height: number;
  /** Largest height on screen; the frame is scaled down to fit. */
  maxHeight?: number;
  /** Lets the mouse wheel scroll the page (heatmaps); the player scrolls it itself. */
  wheel?: boolean;
  onLoad?: () => void;
  onScroll?: (y: number) => void;
  /** Gives the caller the frame element (the host's React shim has no useImperativeHandle). */
  frameRef?: RefObject<HTMLIFrameElement | null>;
  /** Drawn over the page, in page-viewport pixels (scaled with the frame). */
  children?: ReactNode;
}

/**
 * The live page in a same-origin frame at a recorded viewport size, scaled
 * to the space available. A transparent layer on top keeps clicks from
 * following links inside the frame.
 */
export function PageFrame({ path, width, height, maxHeight = 640, wheel = false, onLoad, onScroll, frameRef, children }: Props) {
  const [box, avail] = useWidth<HTMLDivElement>(800);
  const own = useRef<HTMLIFrameElement | null>(null);
  const frame = frameRef ?? own;
  const [failed, setFailed] = useState(false);
  const w = Math.max(320, width || 1280);
  const h = Math.max(320, height || 800);
  const k = Math.min(1, avail / w, maxHeight / h);

  useEffect(() => {
    const f = frame.current;
    if (!f) return;
    let off: (() => void) | undefined;
    const loaded = () => {
      try {
        const win = f.contentWindow;
        if (!win || !f.contentDocument) throw new Error("cross-origin");
        setFailed(false);
        // The page loads as the signed-in admin: drop the admin bar (and the
        // space it reserves) so the page looks as the visitor saw it.
        f.contentDocument.getElementById("squilla-admin-bar")?.remove();
        f.contentDocument.getElementById("squilla-admin-bar-css")?.remove();
        const fn = () => onScroll?.(win.scrollY);
        win.addEventListener("scroll", fn, { passive: true });
        off = () => win.removeEventListener("scroll", fn);
      } catch {
        setFailed(true);
      }
      onLoad?.();
    };
    f.addEventListener("load", loaded);
    return () => {
      f.removeEventListener("load", loaded);
      off?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  // Wheel over the frame scrolls the page inside it, not the admin. A
  // native listener, because React's wheel handler is passive and can't
  // stop the outer scroll. At the frame's top or bottom the admin scrolls.
  const layer = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = layer.current;
    if (!el || !wheel) return;
    const fn = (e: globalThis.WheelEvent) => {
      const win = frame.current?.contentWindow;
      const doc = win?.document?.documentElement;
      if (!win || !doc) return;
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      const maxY = doc.scrollHeight - win.innerHeight;
      if ((dy < 0 && win.scrollY <= 0) || (dy > 0 && win.scrollY >= maxY - 1)) return;
      e.preventDefault();
      win.scrollBy({ top: dy / k, left: 0, behavior: "instant" as ScrollBehavior });
    };
    el.addEventListener("wheel", fn, { passive: false });
    return () => el.removeEventListener("wheel", fn);
  }, [wheel, k, frame]);



  return (
    <div ref={box} className="w-full">
      <div className="an-pageframe" style={{ width: w * k, height: h * k }}>
        <div style={{ width: w, height: h, transform: `scale(${k})`, transformOrigin: "0 0", position: "absolute", inset: 0 }}>
          <iframe
            ref={frame}
            src={`${path}${path.includes("?") ? "&" : "?"}sq_replay=1`}
            title="Your page as the visitor saw it"
            width={w}
            height={h}
            sandbox="allow-same-origin allow-scripts"
            tabIndex={-1}
            style={{ border: 0, display: "block", width: w, height: h, background: "#fff" }}
          />
          <div ref={layer} className="an-pageframe-layer">
            {children}
          </div>
        </div>
      </div>
      {failed && <p className="mt-2 text-xs text-an-muted">The page couldn’t be shown here (it may block framing or live on another domain).</p>}
    </div>
  );
}
