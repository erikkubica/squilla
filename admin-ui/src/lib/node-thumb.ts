/** Best-effort thumbnail URL from a node's featured_image payload. */
export function thumbURL(img: unknown): string {
  // theme-asset:<key> refs only resolve server-side at render time.
  if (typeof img === "string") return img.startsWith("theme-asset:") ? "" : img;
  if (img && typeof img === "object" && typeof (img as { url?: unknown }).url === "string") {
    return (img as { url: string }).url;
  }
  return "";
}
