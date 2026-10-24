import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { useDocumentMeta } from "@/lib/seo";
import { ArticleBody } from "@/components/site/ArticleBody";
import { ArticleCard, formatLongDate } from "@/components/site/ArticleCard";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { ArrowLeft, Check, Clock3, Facebook, Link2, LoaderCircle, MessageCircle, UserRound } from "lucide-react";
import NotFound from "./NotFound";

function ReadingProgress() {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setValue(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return <div className="read-progress" style={{ width: `${value}%` }} aria-hidden="true" />;
}

export default function ArticlePage() {
  const [, params] = useRoute("/article/:slug");
  const slug = params?.slug ?? "";
  const { data, isLoading } = trpc.content.article.useQuery({ slug }, { enabled: Boolean(slug), retry: false });
  const [copied, setCopied] = useState(false);
  const article = data?.article;

  useDocumentMeta({ title: article ? `${article.title} — Hébron-Ivoire` : "Hébron-Ivoire", description: article?.excerpt, image: article?.imageUrl });
  useEffect(() => { window.scrollTo({ top: 0 }); }, [slug]);

  if (isLoading) return <div className="editor-loading"><LoaderCircle className="spin" /> Chargement…</div>;
  if (!article) return <NotFound />;

  const url = typeof window !== "undefined" ? window.location.href : "";
  const text = encodeURIComponent(`${article.title} — ${url}`);
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); window.setTimeout(() => setCopied(false), 2200); } catch { /* ignore */ }
  };

  return (
    <div className="site-shell">
      <ReadingProgress />
      <SiteHeader />
      <main className="article-page">
        <div className="container article-wrap">
          <Link className="back-link" href="/actualites"><ArrowLeft size={15} /> Toute l’actualité</Link>
          <header className="article-head">
            <Link className="category-label" href={`/rubrique/${encodeURIComponent(article.category)}`}>{article.category}</Link>
            <h1>{article.title}</h1>
            <p className="article-standfirst">{article.excerpt}</p>
            <div className="article-byline">
              {article.author && <span><UserRound size={14} /> {article.author}</span>}
              <time dateTime={new Date(article.publishedAt ?? article.createdAt).toISOString()}>{formatLongDate(article.publishedAt ?? article.createdAt)}</time>
              <span><Clock3 size={14} /> {article.readMinutes} min de lecture</span>
            </div>
          </header>
          {article.imageUrl && <figure className="article-cover"><img src={article.imageUrl} alt="" fetchPriority="high" /></figure>}
          <ArticleBody source={article.body} />
          <div className="share-bar">
            <span>Partager</span>
            <button onClick={copy}>{copied ? <><Check size={15} /> Lien copié</> : <><Link2 size={15} /> Copier le lien</>}</button>
            <a href={`https://wa.me/?text=${text}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={15} /> WhatsApp</a>
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer"><Facebook size={15} /> Facebook</a>
          </div>
        </div>
        {data && data.related.length > 0 && (
          <section className="related-section">
            <div className="container">
              <h2>À lire aussi dans « {article.category} »</h2>
              <div className="featured-grid">{data.related.map((item) => <ArticleCard key={item.id} article={item} />)}</div>
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
