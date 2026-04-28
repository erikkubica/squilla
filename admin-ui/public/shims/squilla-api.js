// API shim for extension micro-frontends.
// Uses lazy accessors to avoid timing issues where the shim evaluates before main.tsx.

function getAPI(name) {
  const api = window.__SQUILLA_SHARED__?.api;
  if (!api || !api[name]) {
    console.warn(`@squilla/api: function "${name}" not found in shared API`);
    return () => Promise.reject(new Error(`API function ${name} not available`));
  }
  return api[name];
}

function lazy(name) {
  return function(...args) {
    return getAPI(name)(...args);
  };
}

export default new Proxy({}, {
  get(_, prop) {
    return lazy(prop);
  },
});

export const getExtensionSettings = lazy("getExtensionSettings");
export const updateExtensionSettings = lazy("updateExtensionSettings");
export const getEmailSettings = lazy("getEmailSettings");
export const saveEmailSettings = lazy("saveEmailSettings");
export const sendTestEmail = lazy("sendTestEmail");
export const getEmailTemplates = lazy("getEmailTemplates");
export const getEmailTemplate = lazy("getEmailTemplate");
export const createEmailTemplate = lazy("createEmailTemplate");
export const updateEmailTemplate = lazy("updateEmailTemplate");
export const deleteEmailTemplate = lazy("deleteEmailTemplate");
export const getEmailRules = lazy("getEmailRules");
export const getEmailRule = lazy("getEmailRule");
export const createEmailRule = lazy("createEmailRule");
export const updateEmailRule = lazy("updateEmailRule");
export const deleteEmailRule = lazy("deleteEmailRule");
export const getEmailLogs = lazy("getEmailLogs");
export const resendEmail = lazy("resendEmail");
export const getSystemActions = lazy("getSystemActions");
export const getNodeTypes = lazy("getNodeTypes");
export const getRoles = lazy("getRoles");
export const getLanguages = lazy("getLanguages");
