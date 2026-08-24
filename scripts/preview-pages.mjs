import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, relative, resolve } from "node:path";

const root = resolve(process.cwd(), ".output", "public");
const port = Number(process.env.PORT || 4174);

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".zip": "application/zip",
  ".webmanifest": "application/manifest+json",
};

if (!existsSync(join(root, "index.html"))) {
  console.error("Missing .output/public/index.html — run: npm run build:pages");
  process.exit(1);
}

const server = createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url ?? "/").split("?")[0]);
  const raw = normalize(join(root, urlPath));
  if (relative(root, raw).startsWith("..")) {
    res.writeHead(403).end("Forbidden");
    return;
  }
  let file = raw;
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(root, "404.html");
  if (!existsSync(file)) file = join(root, "index.html");
  const type = types[extname(file).toLowerCase()] ?? "application/octet-stream";
  res.writeHead(200, { "content-type": type });
  createReadStream(file).pipe(res);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Showroom: http://127.0.0.1:${port}/`);
});
