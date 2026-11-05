// Fixture server: serves the generated page and records /_s requests.
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const dir = dirname(fileURLToPath(import.meta.url));
const GIF = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");
let log = [];
const t0 = Date.now();

createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  if (url.pathname === "/__log") {
    res.setHeader("content-type", "application/json");
    return res.end(JSON.stringify(log));
  }
  if (url.pathname === "/__reset") {
    log = [];
    return res.end("ok");
  }
  if (url.pathname.startsWith("/_s/")) {
    const h = req.headers;
    log.push({
      t: Date.now() - t0, method: req.method, path: url.pathname, query: Object.fromEntries(url.searchParams),
      referer: h.referer ?? null, pingFrom: h["ping-from"] ?? null, pingTo: h["ping-to"] ?? null,
      secPurpose: h["sec-purpose"] ?? null, purpose: h.purpose ?? null, fetchSite: h["sec-fetch-site"] ?? null,
      fetchDest: h["sec-fetch-dest"] ?? null, ua: h["user-agent"] ?? null, lang: h["accept-language"] ?? null,
    });
    res.setHeader("cache-control", "no-store");
    if (req.method === "POST") {
      res.statusCode = 204;
      return res.end();
    }
    res.setHeader("content-type", "image/gif");
    return res.end(GIF);
  }
  if (url.pathname === "/page") {
    res.setHeader("content-type", "text/html; charset=utf-8");
    return res.end(readFileSync(join(dir, "fixtures/page.html")));
  }
  // Link targets: tiny pages so same-origin clicks complete.
  res.setHeader("content-type", "text/html; charset=utf-8");
  res.end(`<!doctype html><title>${url.pathname}</title><p>${url.pathname}</p>`);
}).listen(4789, "127.0.0.1");
