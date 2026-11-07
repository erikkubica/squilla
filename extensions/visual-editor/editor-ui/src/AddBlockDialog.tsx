import * as React from "react";
import { useMemo, useState } from "react";
import { blockTypeLabel, type BlockType, type IconItem } from "./api";
import { BlockIcon } from "./BlockCard";
import { Modal, SearchInput } from "./ui";

/** Block picker in the admin's style: searchable grid of block types with
 *  their icon and description. */
export function AddBlockDialog({
  blockTypes,
  icons,
  placement,
  onPick,
  onClose,
}: {
  blockTypes: BlockType[];
  icons: Map<string, IconItem | null>;
  /** Human description of where the block lands. */
  placement: string;
  onPick: (slug: string) => void;
  onClose: () => void;
}): React.JSX.Element {
  const [search, setSearch] = useState("");
  const sorted = useMemo(() => [...blockTypes].sort((a, b) => blockTypeLabel(a).localeCompare(blockTypeLabel(b))), [blockTypes]);
  const filtered = useMemo(() => {
    const terms = search.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return sorted;
    return sorted.filter((bt) => {
      const hay = `${blockTypeLabel(bt)} ${bt.slug} ${bt.description ?? ""}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  }, [sorted, search]);

  return (
    <Modal title="Add a block" subtitle={placement} size="lg" onClose={onClose}>
      <SearchInput value={search} onChange={setSearch} placeholder="Search blocks…" autoFocus onEnter={() => filtered[0] && onPick(filtered[0].slug)} />
      {filtered.length === 0 ? (
        <p className="vedit-empty">{search ? `No blocks match “${search}”.` : "No block types are registered."}</p>
      ) : (
        <div className="vedit-picker-grid">
          {filtered.map((bt) => (
            <button key={bt.slug} type="button" className="vedit-picker-tile" onClick={() => onPick(bt.slug)}>
              <BlockIcon icon={bt.icon} icons={icons} />
              <span className="vedit-picker-text">
                <span className="vedit-picker-label">{blockTypeLabel(bt)}</span>
                {bt.description && <span className="vedit-picker-desc">{bt.description}</span>}
              </span>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
