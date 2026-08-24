/** Public-file URL. Built with string concat only so Vite will not rewrite it. */
export function assetUrl(path: string) {
  const clean = path.replace(/^\//, "");
  if (typeof window === "undefined") return `/${clean}`;
  let dir = window.location.pathname;
  if (!dir.endsWith("/")) {
    const slash = dir.lastIndexOf("/");
    dir = slash >= 0 ? dir.slice(0, slash + 1) : "/";
  }
  return `${window.location.origin}${dir}${clean}`;
}
