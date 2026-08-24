import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const dest = join(root, ".output", "public");
const viteBin = join(root, "node_modules", "vite", "bin", "vite.js");
const env = { ...process.env, GITHUB_PAGES: "1" };
const result = spawnSync(process.execPath, [viteBin, "build"], {
  stdio: "inherit",
  env,
});

if (result.status) process.exit(result.status);

const candidates = [
  join(root, "dist", "client"),
  dest,
  join(root, "dist"),
];
const source = candidates.find((dir) => existsSync(dir) && isStaticSite(dir));
if (!source) {
  console.error("Pages build did not produce a static site in dist/client or .output/public");
  process.exit(1);
}

if (source !== dest) {
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  cpSync(source, dest, { recursive: true });
}

const base = (process.env.BASE_PATH || "/").endsWith("/")
  ? process.env.BASE_PATH || "/"
  : `${process.env.BASE_PATH}/`;

const indexPath = join(dest, "index.html");
const shellPath = join(dest, "_shell.html");
if (!existsSync(indexPath) && existsSync(shellPath)) {
  copyFileSync(shellPath, indexPath);
}
if (!existsSync(indexPath)) {
  console.error("Pages build did not produce index.html or _shell.html");
  process.exit(1);
}

const assetsDir = join(dest, "assets");
const css = existsSync(assetsDir)
  ? readdirSync(assetsDir).find((f) => /^styles-.*\.css$/.test(f))
  : undefined;
let html = readFileSync(indexPath, "utf8");
if (css) {
  html = html.replace(
    /href="[^"]*styles-[^"]+\.css"/g,
    `href="${base}assets/${css}"`,
  );
}
writeFileSync(indexPath, html);
copyFileSync(indexPath, join(dest, "404.html"));
writeFileSync(join(dest, ".nojekyll"), "");
console.log("GitHub Pages site ready in .output/public");

function isStaticSite(dir) {
  return existsSync(join(dir, "index.html")) || existsSync(join(dir, "_shell.html"));
}
