// Ambient module shims for host-provided dependencies. The admin SPA shell
// resolves these at runtime via an import map (window.__SQUILLA_SHARED__),
// so the real implementations never sit in this extension's node_modules.
// We declare them as any-shaped purely to silence module-resolution errors;
// runtime types are owned by the SPA shell.
declare module "@squilla/ui";
declare module "@squilla/icons";
declare module "@squilla/api";
declare module "sonner";
