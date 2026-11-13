// Host-provided dependencies. The admin SPA shell resolves these at runtime
// via import-map shims backed by window.__SQUILLA_SHARED__; they are never
// installed in this extension. Typed loosely on purpose.
declare module "@squilla/ui";
declare module "@squilla/icons";
declare module "@squilla/api";
declare module "sonner";
declare module "react-router-dom";

interface Window {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __SQUILLA_SHARED__: any;
}
