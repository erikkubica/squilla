import { Download } from "@squilla/icons";
import { exportUrl, type ExportSpec } from "../api/client";
import { ui } from "../shared";

const { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } = ui;

export interface ExportOption {
  label: string;
  spec: Omit<ExportSpec, "format">;
}

/** Download menu: each option offered as CSV and JSON via plain <a download>. */
export function ExportMenu({ query, options, compact = true, label = "Export" }: { query: URLSearchParams; options: ExportOption[]; compact?: boolean; label?: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className="an-focus inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-2 text-xs font-medium text-an-muted hover:bg-an-hover hover:text-an-ink"
        >
          <Download className="size-3.5" aria-hidden="true" />
          {!compact && <span>Export</span>}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        {options.map((o, i) => (
          <div key={o.label}>
            {i > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="text-xs">{o.label}</DropdownMenuLabel>
            {(["csv", "json"] as const).map((format) => (
              <DropdownMenuItem key={format} asChild>
                <a href={exportUrl(query, { ...o.spec, format })} download className="cursor-pointer text-[13px]">
                  Download {format.toUpperCase()}
                </a>
              </DropdownMenuItem>
            ))}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
