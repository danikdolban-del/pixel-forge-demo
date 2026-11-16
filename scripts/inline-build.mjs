import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = resolve(projectRoot, "dist");
const htmlPath = resolve(distDir, "index.html");
let html = await readFile(htmlPath, "utf8");
const emittedFiles = new Set();

function assetPath(reference) {
  const pathname = decodeURIComponent(new URL(reference, "https://vite.invalid").pathname);
  const candidate = resolve(distDir, pathname.replace(/^\/+/, ""));
  if (candidate !== distDir && !candidate.startsWith(distDir + sep)) {
    throw new Error("Unexpected asset path in built HTML: " + reference);
  }
  emittedFiles.add(candidate);
  return candidate;
}

const scriptTags = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>\s*<\/script>/gi)];
if (scriptTags.length !== 1) {
  throw new Error("Expected one bundled JavaScript entry in dist/index.html; found " + scriptTags.length);
}
const scriptTag = scriptTags[0][0];
const scriptSource = await readFile(assetPath(scriptTags[0][1]), "utf8");
const safeScript = scriptSource.replace(/<\/script/gi, "<\\/script");
html = html.replace(scriptTag, "<script type=\"module\">" + safeScript + "</script>");

const styleTags = [...html.matchAll(/<link\b[^>]*>/gi)]
  .map((match) => match[0])
  .filter((tag) => /\brel=["']stylesheet["']/i.test(tag) && /\bhref=["'][^"']+["']/i.test(tag));
for (const styleTag of styleTags) {
  const href = styleTag.match(/\bhref=["']([^"']+)["']/i)?.[1];
  if (!href) continue;
  const css = await readFile(assetPath(href), "utf8");
  const safeCss = css.replace(/<\/style/gi, "<\\/style");
  html = html.replace(styleTag, "<style>" + safeCss + "</style>");
}

await writeFile(htmlPath, html, "utf8");
const singleFileDir = resolve(projectRoot, "single-file");
await mkdir(singleFileDir, { recursive: true });
await writeFile(resolve(singleFileDir, "index.html"), html, "utf8");
await Promise.all([...emittedFiles].map((file) => unlink(file)));
console.log("Inlined " + emittedFiles.size + " JavaScript and CSS asset(s) into dist/index.html.");