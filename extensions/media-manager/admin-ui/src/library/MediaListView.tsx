import { Copy, Download, Trash2, AlertTriangle } from "@squilla/icons";
import {
  MediaFile,
  isImage,
  humanFileSize,
  imageSize,
  fmtDate,
  MediaImage,
  FileTypeIcon,
} from "./helpers";
import SelectCheck from "./SelectCheck";

// Pull the shared list-table primitives via the import-map shim. We type
// minimally here so MediaListView can compose ListTable / Th / SortableTh /
// Tr / Td just like the core admin pages (users, languages, …) without
// introducing a hard dep on @squilla/ui type defs (extension micro-frontends
// don't ship with the d.ts).
const SHARED_UI = (window as unknown as {
  __SQUILLA_SHARED__: {
    ui: {
      ListTable: React.ComponentType<{ children: React.ReactNode; minWidth?: number }>;
      Th: React.ComponentType<{
        children?: React.ReactNode;
        width?: string | number;
        align?: "left" | "right" | "center";
        className?: string;
      }>;
      SortableTh: React.ComponentType<{
        column: string;
        children: React.ReactNode;
        sortBy?: string;
        sortOrder?: string;
        onSort: (column: string, order: "asc" | "desc") => void;
        width?: string | number;
        align?: "left" | "right" | "center";
        defaultOrder?: "asc" | "desc";
      }>;
      Tr: React.ComponentType<{
        children: React.ReactNode;
        onClick?: (e: React.MouseEvent<HTMLTableRowElement>) => void;
        className?: string;
        style?: React.CSSProperties;
      }>;
      Td: React.ComponentType<{
        children?: React.ReactNode;
        align?: "left" | "right" | "center";
        className?: string;
        style?: React.CSSProperties;
        onClick?: (e: React.MouseEvent<HTMLTableCellElement>) => void;
      }>;
    };
  };
}).__SQUILLA_SHARED__.ui;
const { ListTable, Th, SortableTh, Tr, Td } = SHARED_UI;

interface MediaListViewProps {
  files: MediaFile[];
  selected: Set<number>;
  /** Legacy combined "field_order" key (e.g. "date_desc"). */
  sortBy: string;
  /** Receives a legacy combined key. */
  onSort: (v: string) => void;
  onOpen: (f: MediaFile) => void;
  onToggle: (id: number, e: React.MouseEvent) => void;
  onToggleAll: () => void;
  onCopy: (f: MediaFile) => void;
  onDownload: (f: MediaFile) => void;
  onDelete: (f: MediaFile) => void;
}

// Map UI column ids ↔ legacy sort_by tokens. The backend understands
// name/size/date — we keep that contract and only translate at the edges.
const COLUMN_TO_FIELD: Record<string, string> = {
  name: "name",
  size: "size",
  created_at: "date",
};
const FIELD_TO_COLUMN: Record<string, string> = {
  name: "name",
  size: "size",
  date: "created_at",
};

function parseSort(sortBy: string): { column: string; order: "asc" | "desc" } {
  const m = /^(name|size|date)_(asc|desc)$/.exec(sortBy);
  if (!m) return { column: "created_at", order: "desc" };
  return { column: FIELD_TO_COLUMN[m[1]], order: m[2] as "asc" | "desc" };
}

export default function MediaListView({
  files,
  selected,
  sortBy,
  onSort,
  onOpen,
  onToggle,
  onToggleAll,
  onCopy,
  onDownload,
  onDelete,
}: MediaListViewProps) {
  const { column: sortCol, order: sortOrder } = parseSort(sortBy);
  const allSelected = files.length > 0 && files.every((f) => selected.has(f.id));

  const handleSort = (column: string, order: "asc" | "desc") => {
    const field = COLUMN_TO_FIELD[column];
    if (!field) return;
    onSort(`${field}_${order}`);
  };

  return (
    <ListTable minWidth={920}>
      <thead>
        <tr>
          <Th width={36}>
            <span onClick={(e) => e.stopPropagation()} className="inline-flex">
              <SelectCheck
                checked={allSelected}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleAll();
                }}
                size={14}
              />
            </span>
          </Th>
          <SortableTh
            column="name"
            sortBy={sortCol}
            sortOrder={sortOrder}
            onSort={handleSort}
            defaultOrder="asc"
          >
            File
          </SortableTh>
          <Th>Alt text</Th>
          <SortableTh
            column="size"
            sortBy={sortCol}
            sortOrder={sortOrder}
            onSort={handleSort}
            defaultOrder="desc"
            width={100}
          >
            Size
          </SortableTh>
          <Th width={110}>Dimensions</Th>
          <SortableTh
            column="created_at"
            sortBy={sortCol}
            sortOrder={sortOrder}
            onSort={handleSort}
            defaultOrder="desc"
            width={130}
          >
            Uploaded
          </SortableTh>
          <Th width={110} align="right">
            Actions
          </Th>
        </tr>
      </thead>
      <tbody>
        {files.map((f) => {
          const isSelected = selected.has(f.id);
          return (
            <Tr
              key={f.id}
              onClick={() => onOpen(f)}
              style={isSelected ? { background: "var(--accent-mid)" } : undefined}
            >
              <Td onClick={(e) => e.stopPropagation()}>
                <SelectCheck checked={isSelected} onClick={(e) => onToggle(f.id, e)} size={14} />
              </Td>
              <Td>
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="rounded-md overflow-hidden shrink-0 grid place-items-center"
                    style={{
                      width: 40,
                      height: 30,
                      border: "1px solid var(--border)",
                      background: "var(--sub-bg)",
                    }}
                  >
                    {isImage(f.mime_type) ? (
                      <MediaImage
                        src={imageSize(f.url, "thumbnail", f.updated_at)}
                        alt={f.original_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FileTypeIcon mime={f.mime_type} className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div
                      className="truncate"
                      style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)" }}
                    >
                      {f.original_name}
                    </div>
                    <div
                      className="truncate"
                      style={{
                        fontSize: 10.5,
                        fontFamily: "var(--font-mono)",
                        color: "var(--fg-subtle)",
                      }}
                    >
                      {f.url}
                    </div>
                  </div>
                </div>
              </Td>
              <Td className="text-muted-foreground">
                <span className="truncate inline-block max-w-[220px] align-middle">
                  {f.alt || (
                    <span className="text-amber-700 italic inline-flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> missing
                    </span>
                  )}
                </span>
              </Td>
              <Td className="font-mono tabular-nums" style={{ fontSize: 12, color: "var(--fg-muted)" }}>
                {humanFileSize(f.size)}
              </Td>
              <Td className="font-mono tabular-nums" style={{ fontSize: 12, color: "var(--fg-muted)" }}>
                {f.width && f.height ? `${f.width}×${f.height}` : "—"}
              </Td>
              <Td className="font-mono tabular-nums" style={{ fontSize: 12, color: "var(--fg-muted)" }}>
                {fmtDate(f.created_at)}
              </Td>
              <Td align="right" onClick={(e) => e.stopPropagation()}>
                <div className="inline-flex items-center" style={{ gap: 1 }}>
                  <button
                    type="button"
                    onClick={() => onCopy(f)}
                    className="grid place-items-center cursor-pointer"
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 5,
                      border: "none",
                      background: "transparent",
                      color: "var(--fg-subtle)",
                    }}
                    title="Copy URL"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDownload(f)}
                    className="grid place-items-center cursor-pointer"
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 5,
                      border: "none",
                      background: "transparent",
                      color: "var(--fg-subtle)",
                    }}
                    title="Download"
                  >
                    <Download className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(f)}
                    className="grid place-items-center cursor-pointer"
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 5,
                      border: "none",
                      background: "transparent",
                      color: "var(--fg-subtle)",
                    }}
                    title="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </Td>
            </Tr>
          );
        })}
      </tbody>
    </ListTable>
  );
}
