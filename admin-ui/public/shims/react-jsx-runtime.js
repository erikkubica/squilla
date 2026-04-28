const R = window.__SQUILLA_SHARED__.React;

// jsx(type, props, key) — children live inside props.children.
// createElement(type, props, ...children) — 3rd+ args OVERRIDE props.children.
// We must fold `key` into props so it doesn't get interpreted as a child.
export function jsx(type, props, key) {
  if (key !== undefined) {
    return R.createElement(type, { ...props, key });
  }
  return R.createElement(type, props);
}

export const jsxs = jsx;
export const jsxDEV = jsx;
export const Fragment = R.Fragment;
