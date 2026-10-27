import { useState } from "react";
import { Link } from "wouter";
import { Headphones, Play } from "lucide-react";
import { slugify, type ArticleKind } from "@shared/slug";
import { formatShort, timeAgo } from "@/lib/format";

export type CardArticle = {
  id: number;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  imageUrl: string | null;
  kind: string;
  readMinutes: number;
  author: string | null;
  publishedAt: Date | string | null;
  createdAt: Date | string;
};

export const articleHref = (a: Pick<CardArticle, "slug">) => `/article/${a.slug}`;
export const rubriqueHref = (name: string) => `/rubrique/${slugify(name)}`;
const when = (a: CardArticle) => a.publishedAt ?? a.createdAt;

export const formatLongDate = (value: Date | string) =>
  new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(value));

/** Cover image with a play / headphones badge for video and podcasts; a green placeholder when there is no image. */
export function Thumb({ article, ratio = "r169", className = "" }: { article: CardArticle; ratio?: "r169" | "r32" | "r11" | "r43"; className?: string }) {
  const kind = article.kind as ArticleKind;
  const [broken, setBroken] = useState(false);
  return (
    <Link href={articleHref(article)} className={`np-thumb ${ratio} ${className}`} aria-label={article.title} tabIndex={-1}>
      {article.imageUrl && !broken ? <img src={article.imageUrl} alt="" loading="lazy" onError={() => setBroken(true)} /> : <span className="np-ph"><b>{article.category}</b></span>}
      {kind === "video" && <span className="np-badge"><Play size={14} fill="currentColor" /></span>}
      {kind === "audio" && <span className="np-badge np-badge-audio"><Headphones size={14} /></span>}
    </Link>
  );
}

export function Kicker({ article }: { article: CardArticle }) {
  const kind = article.kind as ArticleKind;
  return (
    <Link href={rubriqueHref(article.category)} className="np-kicker">
      {kind === "video" ? "Vidéo · " : kind === "audio" ? "Podcast · " : ""}
      {article.category}
    </Link>
  );
}

export const Byline = ({ article }: { article: CardArticle }) => (
  <p className="np-byline">{article.author ? <>Par <b>{article.author}</b> · </> : null}{timeAgo(when(article))}</p>
);

/** Large story: picture above, headline and standfirst below. */
export function LeadCard({ article }: { article: CardArticle }) {
  return (
    <article className="np-lead">
      <Thumb article={article} ratio="r169" />
      <Kicker article={article} />
      <h2><Link href={articleHref(article)}>{article.title}</Link></h2>
      <p className="np-standfirst">{article.excerpt}</p>
      <Byline article={article} />
    </article>
  );
}

/** Medium story used in rows of three. */
export function MidCard({ article }: { article: CardArticle }) {
  return (
    <article className="np-mid">
      <Thumb article={article} ratio="r32" />
      <Kicker article={article} />
      <h3><Link href={articleHref(article)}>{article.title}</Link></h3>
      <Byline article={article} />
    </article>
  );
}

/** Compact row: small thumbnail on the right, headline on the left. */
export function RowCard({ article, showKicker = true }: { article: CardArticle; showKicker?: boolean }) {
  return (
    <article className="np-row">
      <div>
        {showKicker && <Kicker article={article} />}
        <h4><Link href={articleHref(article)}>{article.title}</Link></h4>
        <Byline article={article} />
      </div>
      <Thumb article={article} ratio="r43" className="np-row-thumb" />
    </article>
  );
}

/** "Dernières nouvelles" entry: time in bold, headline underneath. */
export function NewsItem({ article }: { article: CardArticle }) {
  const date = new Date(when(article));
  const today = date.toDateString() === new Date().toDateString();
  return (
    <li className="np-news-item">
      <time dateTime={date.toISOString()}>{today ? new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(date) : formatShort(date)}</time>
      <Link href={articleHref(article)}>{article.title}</Link>
    </li>
  );
}
