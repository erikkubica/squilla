import { useRef, type ReactNode } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

interface SearchDropdownProps {
  /** Whether the result list is showing. */
  open: boolean;
  /** Called with false on Escape, a click outside, or focus leaving. */
  onOpenChange: (open: boolean) => void;
  /** The search input. The list hangs below it at the same width. */
  children: ReactNode;
  /** Result rows: `search-option` buttons, `search-empty` and `search-separator`. */
  content: ReactNode;
  maxHeight?: number;
}

/**
 * Search-as-you-type result list that floats over the page instead of pushing
 * the card below the input taller. It renders in a portal, so a card's
 * overflow clipping can't cut it off, and it flips above the input near the
 * bottom of the screen. Focus stays in the input while the list is open.
 */
export function SearchDropdown({ open, onOpenChange, children, content, maxHeight = 260 }: SearchDropdownProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const inAnchor = (target: EventTarget | null) =>
    target instanceof Node && !!anchorRef.current?.contains(target);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <PopoverPrimitive.Anchor asChild>
        <div ref={anchorRef} className="relative">
          {children}
        </div>
      </PopoverPrimitive.Anchor>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          data-slot="search-dropdown"
          side="bottom"
          align="start"
          sideOffset={4}
          collisionPadding={8}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            if (inAnchor(e.target)) e.preventDefault();
          }}
          // Clicking a row or the scrollbar must not blur the input.
          onMouseDown={(e) => e.preventDefault()}
          style={{
            width: "var(--radix-popover-trigger-width)",
            maxHeight: `min(${maxHeight}px, var(--radix-popover-content-available-height))`,
          }}
        >
          {content}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
