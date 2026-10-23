// Access to host-provided libraries. Resolved from window.__SQUILLA_SHARED__
// directly (not the @squilla/ui import-map wrapper) so Radix `asChild`
// triggers receive real forwardRef components.

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyComponent = (props: any) => any;

const shared = (typeof window !== "undefined" && window.__SQUILLA_SHARED__) || {};

export const ui: Record<string, AnyComponent> = shared.ui ?? {};

export interface SearchParamsSetterOptions {
  replace?: boolean;
}
type SetSearchParams = (
  next: URLSearchParams | ((prev: URLSearchParams) => URLSearchParams),
  opts?: SearchParamsSetterOptions,
) => void;

const router = shared.ReactRouterDOM ?? {};

export const useSearchParams: () => [URLSearchParams, SetSearchParams] = router.useSearchParams;
export const useNavigate: () => (to: string) => void = router.useNavigate;
export const useParams: () => Record<string, string | undefined> = router.useParams;
export const Link: AnyComponent = router.Link;

export const toast: {
  success: (msg: string) => void;
  error: (msg: string) => void;
  message?: (msg: string) => void;
} = shared.Sonner?.toast ?? { success: () => {}, error: () => {} };

export const BASE_PATH = "/admin/ext/analytics";
