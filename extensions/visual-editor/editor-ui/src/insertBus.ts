// Tiny single-listener bus for "user clicked the in-page + button at
// position N". The overlay (in EditorRoot) and the side panel live in
// different React subtrees but in the same shadow root; this bus lets
// us bridge without lifting blocks_data state up to EditorRoot for
// v1.
//
// One listener at a time is enough: only one SidePanel exists at a
// time. If we ever support multiple editors per page, this becomes a
// per-instance event emitter.

type Listener = (atIndex: number) => void;

let current: Listener | null = null;

export function onInsertRequest(listener: Listener): () => void {
  current = listener;
  return () => {
    if (current === listener) current = null;
  };
}

export function requestInsertAt(atIndex: number): void {
  if (current) current(atIndex);
}
