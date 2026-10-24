import type { Express, Request } from "express";
import { SITE_DEFAULTS } from "@shared/siteSettings";
import { getArticleBySlug, getEventBySlug, getSiteSettings, listSitemapEntries } from "../db";
import { ENV } from "./env";
import { escapeHtml } from "./mailer";

export const baseUrl = (req: Request) => ENV.siteUrl || `${req.protocol}://${req.get("host")}`;

type Meta = { title: string; description: string; image?: string; url: string; type: "website" | "article"; jsonLd?: object };

const strip = (value: string, max = 200) => {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
};
const absolute = (url: string | null | undefined, base: string) =>
  !url ? undefined : /^https?:\/\//.test(url) ? url : `${base}${url.startsWith("/") ? "" : "/"}${url}`;

async function metaFor(req: Request): Promise<Meta> {
  const base = baseUrl(req);
  const path = req.originalUrl.split("?")[0];
  const settings = await getSiteSettings().catch(() => ({} as Record<string, string>));
  const siteName = "Hébron-Ivoire";
  const home: Meta = {
    title: `${siteName} — Le média qui inspire`,
    description: settings.heroIntro || SITE_DEFAULTS.heroIntro,
    url: `${base}/`,
    type: "website",
  };

  let m = /^\/article\/([^/]+)\/?$/.exec(path);
  if (m) {
    const found = await getArticleBySlug(decodeURIComponent(m[1])).catch(() => undefined);
    if (found) {
      const a = found.article;
      const url = `${base}/article/${a.slug}`;
      const image = absolute(a.imageUrl, base);
      return {
        title: `${a.title} — ${siteName}`,
        description: strip(a.excerpt),
        image,
        url,
        type: "article",
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          headline: a.title,
          description: strip(a.excerpt),
          image: image ? [image] : undefined,
          datePublished: a.publishedAt?.toISOString(),
          dateModified: a.updatedAt.toISOString(),
          author: { "@type": "Person", name: a.author || siteName },
          publisher: { "@type": "Organization", name: siteName },
          mainEntityOfPage: url,
        },
      };
    }
  }
  m = /^\/evenement\/([^/]+)\/?$/.exec(path);
  if (m) {
    const e = await getEventBySlug(decodeURIComponent(m[1])).catch(() => undefined);
    if (e) {
      return { title: `${e.title} — ${siteName}`, description: strip(e.excerpt), image: absolute(e.imageUrl, base), url: `${base}/evenement/${e.slug}`, type: "article" };
    }
  }
  m = /^\/rubrique\/([^/]+)\/?$/.exec(path);
  if (m) {
    const name = decodeURIComponent(m[1]);
    return { title: `${name} — ${siteName}`, description: `Tous les articles de la rubrique ${name} sur ${siteName}.`, url: `${base}/rubrique/${encodeURIComponent(name)}`, type: "website" };
  }
  if (path.startsWith("/actualites")) {
    return { title: `Toute l’actualité — ${siteName}`, description: home.description, url: `${base}/actualites`, type: "website" };
  }
  return home;
}

/** Replace the static <title>/description of index.html with per-page tags (what crawlers and link previews read). */
export async function injectSeo(html: string, req: Request): Promise<string> {
  if (req.originalUrl.startsWith("/admin")) return html.replace("<head>", '<head>\n    <meta name="robots" content="noindex,nofollow" />');
  const meta = await metaFor(req);
  const tags = [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    `<link rel="canonical" href="${escapeHtml(meta.url)}" />`,
    `<meta property="og:site_name" content="Hébron-Ivoire" />`,
    `<meta property="og:locale" content="fr_FR" />`,
    `<meta property="og:type" content="${meta.type}" />`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(meta.url)}" />`,
    meta.image ? `<meta property="og:image" content="${escapeHtml(meta.image)}" />` : "",
    `<meta name="twitter:card" content="${meta.image ? "summary_large_image" : "summary"}" />`,
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`,
    meta.image ? `<meta name="twitter:image" content="${escapeHtml(meta.image)}" />` : "",
    meta.jsonLd ? `<script type="application/ld+json">${JSON.stringify(meta.jsonLd).replace(/</g, "\\u003c")}</script>` : "",
  ].filter(Boolean).join("\n    ");
  return html
    .replace(/<title>[\s\S]*?<\/title>/, "")
    .replace(/<meta name="description"[^>]*\/>/, "")
    .replace("</head>", `    ${tags}\n  </head>`);
}

export function registerSeoRoutes(app: Express) {
  app.get("/robots.txt", (req, res) => {
    res.type("text/plain").send(`User-agent: *\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${baseUrl(req)}/sitemap.xml\n`);
  });

  app.get("/sitemap.xml", async (req, res) => {
    const base = baseUrl(req);
    const { articles, events, categories } = await listSitemapEntries();
    const url = (loc: string, lastmod?: Date) => `  <url><loc>${escapeHtml(loc)}</loc>${lastmod ? `<lastmod>${lastmod.toISOString()}</lastmod>` : ""}</url>`;
    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      url(`${base}/`),
      url(`${base}/actualites`),
      ...categories.map((c) => url(`${base}/rubrique/${encodeURIComponent(c)}`)),
      ...articles.map((a) => url(`${base}/article/${a.slug}`, a.updatedAt)),
      ...events.map((e) => url(`${base}/evenement/${e.slug}`, e.updatedAt)),
      "</urlset>",
    ].join("\n");
    res.type("application/xml").send(xml);
  });
}
