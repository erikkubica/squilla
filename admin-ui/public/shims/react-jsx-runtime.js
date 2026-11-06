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

// jsxs is called for elements with several static children (`<p>a<b/>c</p>`).
// Passing them to createElement as separate arguments marks them as static,
// like React's own runtime does; leaving them in props.children makes React's
// dev build warn about missing keys on every such element.
export function jsxs(type, props, key) {
  const { children, ...rest } = props;
  if (key !== undefined) rest.key = key;
  return Array.isArray(children) ? R.createElement(type, rest, ...children) : R.createElement(type, rest, children);
}

export const jsxDEV = jsx;
export const Fragment = R.Fragment;
