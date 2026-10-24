import { Link } from "wouter";
import { ArrowUpRight, Clock3 } from "lucide-react";

type CardArticle = {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  imageUrl: string | null;
  readMinutes: number;
  publishedAt: Date | string | null;
  createdAt: Date | string;
};

export const formatLongDate = (value: Date | string) =>
  new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(value));

export function ArticleCard({ article }: { article: CardArticle }) {
  const href = `/article/${article.slug}`;
  return (
    <article className="story-card">
      <Link className="story-image-button card-image" href={href} aria-label={`Lire : ${article.title}`}>
        {article.imageUrl ? <img src={article.imageUrl} alt="" loading="lazy" /> : <span className="card-image-fallback" />}
        <span className="image-arrow"><ArrowUpRight size={17} /></span>
      </Link>
      <div className="story-content">
        <Link className="category-label" href={`/rubrique/${encodeURIComponent(article.category)}`}>{article.category}</Link>
        <Link className="story-title" href={href}>{article.title}</Link>
        <p className="story-excerpt">{article.excerpt}</p>
        <div className="story-meta"><time>{formatLongDate(article.publishedAt ?? article.createdAt)}</time><span className="meta-dot" /><span><Clock3 size={13} />{article.readMinutes} min de lecture</span></div>
      </div>
    </article>
  );
}
