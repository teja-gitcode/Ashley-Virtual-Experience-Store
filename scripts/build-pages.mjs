import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const env = { ...process.env, GITHUB_PAGES: "1" };
const result = spawnSync("npx", ["vite", "build"], {
  stdio: "inherit",
  env,
  shell: process.platform === "win32",
});

const dir = join(process.cwd(), ".output", "public");
const indexPath = join(dir, "index.html");
if (!existsSync(indexPath)) {
  console.error("Pages build did not produce .output/public/index.html");
  process.exit(result.status || 1);
}

const base = (process.env.BASE_PATH || "/").endsWith("/")
  ? process.env.BASE_PATH || "/"
  : `${process.env.BASE_PATH}/`;

const css = readdirSync(join(dir, "assets")).find((f) => /^styles-.*\.css$/.test(f));
let html = readFileSync(indexPath, "utf8");
if (css) {
  html = html.replace(
    /href="[^"]*styles-[^"]+\.css"/g,
    `href="${base}assets/${css}"`,
  );
}
writeFileSync(indexPath, html);
copyFileSync(indexPath, join(dir, "404.html"));
writeFileSync(join(dir, ".nojekyll"), "");
console.log("GitHub Pages site ready in .output/public");
