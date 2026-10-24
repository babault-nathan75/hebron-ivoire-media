import fs from "node:fs";
import path from "node:path";
import serverless from "serverless-http";
import { createApp } from "../server/_core/app";
import { baseUrl, injectSeo } from "../server/_core/seo";

const app = createApp();

let cachedHtml: string | null = null;

/** index.html is shipped with the function (included_files); fall back to fetching it from the CDN. */
async function loadIndexHtml(origin: string) {
  if (cachedHtml) return cachedHtml;
  const roots = [process.env.LAMBDA_TASK_ROOT, process.cwd(), "/var/task"].filter(Boolean) as string[];
  for (const root of roots) {
    const file = path.join(root, "dist/public/index.html");
    if (fs.existsSync(file)) return (cachedHtml = await fs.promises.readFile(file, "utf-8"));
  }
  const res = await fetch(`${origin}/index.html`);
  if (!res.ok) throw new Error("index.html introuvable");
  return (cachedHtml = await res.text());
}

// Pages that need per-page meta tags (link previews, search engines).
app.get("*", async (req, res, next) => {
  try {
    const html = await loadIndexHtml(baseUrl(req));
    res.status(200).set({ "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=0, must-revalidate" }).end(await injectSeo(html, req));
  } catch (error) {
    next(error);
  }
});

const handle = serverless(app);

export const handler = async (event: Record<string, any>, context: unknown) => {
  // Rewrites hand us the function path; restore the URL the visitor asked for.
  if (event.rawUrl) {
    const url = new URL(event.rawUrl);
    event.path = url.pathname;
    event.rawQuery = url.search.replace(/^\?/, "");
  }
  return handle(event, context as never);
};
