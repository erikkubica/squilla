import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { EditorRoot } from "./EditorRoot";
import type { BootstrapConfig } from "./types";
import styles from "./styles.css?inline";

// Bootstrap path: the Go plugin emits two tags into <body> for admins:
//
//   <script type="application/json" id="__squilla_vedit_config">{...}</script>
//   <script type="module" src="/admin/api/ext/visual-editor/static/editor.js" defer></script>
//
// This module reads the JSON config, mounts a host element with a
// shadow root attached to <body>, and renders the React editor inside
// the shadow root. Theme CSS can't reach in; editor CSS can't leak
// out.
function readConfig(): BootstrapConfig | null {
  const el = document.getElementById("__squilla_vedit_config");
  if (!el) return null;
  try {
    const cfg = JSON.parse(el.textContent ?? "{}") as Partial<BootstrapConfig>;
    if (typeof cfg.nodeId !== "number") return null;
    return cfg as BootstrapConfig;
  } catch {
    return null;
  }
}

function bootstrap(): void {
  const cfg = readConfig();
  if (!cfg) {
    console.warn("[squilla:visual-editor] missing or invalid config; skipping");
    return;
  }

  // Use a single host element marked with data-vedit-host so click /
  // pointermove handlers in EditorRoot can detect when an event
  // originated inside the editor (and skip block resolution).
  const host = document.createElement("div");
  host.setAttribute("data-vedit-host", "");
  host.style.position = "fixed";
  host.style.zIndex = "2147483600";
  host.style.top = "0";
  host.style.left = "0";
  host.style.pointerEvents = "none"; // child elements opt back in
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });

  // Inject CSS into the shadow root. Vite's `?inline` import returns
  // the compiled CSS as a string at build time, so we don't need a
  // separate fetch and there's no FOUC.
  const styleEl = document.createElement("style");
  styleEl.textContent = styles;
  shadow.appendChild(styleEl);

  // Container for React. `pointer-events: auto` reverses the host's
  // none default so the toggle button + side panel are clickable.
  const mount = document.createElement("div");
  mount.style.pointerEvents = "auto";
  shadow.appendChild(mount);

  const root = createRoot(mount);
  root.render(
    <StrictMode>
      <EditorRoot config={cfg} />
    </StrictMode>,
  );
}

// document.readyState gating: the bootstrap script runs with `defer`
// so the DOM is parsed by the time we execute, but body-end load
// timing varies across browsers. Wait for "complete" to be safe; if
// already complete (e.g. SPA-style late inject), run immediately.
if (document.readyState === "complete" || document.readyState === "interactive") {
  bootstrap();
} else {
  document.addEventListener("DOMContentLoaded", bootstrap);
}
