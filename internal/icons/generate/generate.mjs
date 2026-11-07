// Regenerates the icon data files embedded in the Squilla kernel
// (internal/icons/data/<provider>.json.gz) from the pinned npm packages in
// this directory's package.json.
//
//   cd internal/icons/generate
//   npm ci            # or: npm install <pkg>@<new-version> to update
//   npm run generate
//
// Output format (gzip-compressed JSON, keys sorted so the output is
// reproducible for a given package version):
//
//   {
//     "id": "lucide", "label": "Lucide", "license": "ISC", "version": "1.70.0",
//     "viewBox": "0 0 24 24",
//     "attrs": { "fill": "none", "stroke": "currentColor", ... },
//     "icons": { "map-pin": ["<path d=\"...\"/><circle .../>", ["tag", ...]], ... }
//   }
//
// "attrs" are the presentation attributes every icon of the set shares;
// the Go renderer puts them on the outer <svg>. Each icon stores only its
// inner markup plus optional search tags.
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "data");
mkdirSync(outDir, { recursive: true });

function pkgVersion(name) {
  return JSON.parse(readFileSync(join(here, "node_modules", name, "package.json"), "utf8")).version;
}

// innerMarkup extracts the children of the root <svg> and minifies the
// whitespace between elements. Comments are dropped.
function innerMarkup(svg) {
  const noComments = svg.replace(/<!--[\s\S]*?-->/g, "");
  const open = noComments.indexOf(">", noComments.indexOf("<svg"));
  const close = noComments.lastIndexOf("</svg>");
  if (open < 0 || close < 0) throw new Error("not an svg");
  return noComments
    .slice(open + 1, close)
    .replace(/>\s+</g, "><")
    .replace(/\s+\/>/g, "/>")
    .replace(/\s+/g, " ")
    .trim();
}

function viewBoxOf(svg) {
  const m = svg.match(/viewBox="([^"]+)"/);
  return m ? m[1] : "";
}

function sortedObject(obj) {
  return Object.fromEntries(Object.keys(obj).sort().map((k) => [k, obj[k]]));
}

function write(provider) {
  const json = JSON.stringify({ ...provider, icons: sortedObject(provider.icons) });
  const gz = gzipSync(Buffer.from(json), { level: 9 });
  const file = join(outDir, `${provider.id}.json.gz`);
  writeFileSync(file, gz);
  console.log(
    `${provider.id}: ${Object.keys(provider.icons).length} icons, ` +
      `${(json.length / 1024).toFixed(0)} KiB raw, ${(gz.length / 1024).toFixed(0)} KiB gz -> ${file}`,
  );
}

// --- Lucide (ISC) -----------------------------------------------------------
{
  const dir = join(here, "node_modules", "lucide-static", "icons");
  const tags = JSON.parse(readFileSync(join(here, "node_modules", "lucide-static", "tags.json"), "utf8"));
  const icons = {};
  let viewBox = "";
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".svg")).sort()) {
    const name = file.slice(0, -4);
    const svg = readFileSync(join(dir, file), "utf8");
    viewBox ||= viewBoxOf(svg);
    const t = Array.isArray(tags[name]) ? tags[name] : [];
    icons[name] = t.length ? [innerMarkup(svg), t] : [innerMarkup(svg)];
  }
  write({
    id: "lucide",
    label: "Lucide",
    license: "ISC",
    version: pkgVersion("lucide-static"),
    viewBox,
    attrs: {
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    icons,
  });
}

// --- Material Symbols Outlined, weight 400 (Apache-2.0) ---------------------
{
  const dir = join(here, "node_modules", "@material-symbols", "svg-400", "outlined");
  const icons = {};
  let viewBox = "";
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".svg") && !f.endsWith("-fill.svg")).sort()) {
    const name = file.slice(0, -4);
    const svg = readFileSync(join(dir, file), "utf8");
    viewBox ||= viewBoxOf(svg);
    icons[name] = [innerMarkup(svg)];
  }
  write({
    id: "material",
    label: "Material Symbols",
    license: "Apache-2.0",
    version: pkgVersion("@material-symbols/svg-400"),
    viewBox,
    attrs: { fill: "currentColor" },
    icons,
  });
}
