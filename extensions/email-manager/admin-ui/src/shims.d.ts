// Ambient module shims for shared host-provided dependencies. The extension
// admin-UI imports React Router types from a shimmed entry that the SPA shell
// resolves at runtime via the import map, so TypeScript can't see the real
// types. We declare loose `any`-shaped modules here purely to silence the
// module-resolution errors that don't affect the actual runtime behaviour.
declare module "react-router-dom" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const useSearchParams: () => [URLSearchParams, (next: any) => void];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const useParams: <T = Record<string, string | undefined>>() => T;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const useNavigate: () => (to: string | number, opts?: any) => void;
}
