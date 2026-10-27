/** URL-safe slug (accents stripped). Used by both the server and the client so links always agree. */
export const slugify = (value: string) =>
  value
    .trim()
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);

export const ARTICLE_KINDS = ["text", "video", "audio"] as const;
export type ArticleKind = (typeof ARTICLE_KINDS)[number];
export const KIND_LABEL: Record<ArticleKind, string> = { text: "Article", video: "Vidéo", audio: "Podcast" };
