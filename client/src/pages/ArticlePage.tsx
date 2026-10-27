import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { useDocumentMeta } from "@/lib/seo";
import { formatDay } from "@/lib/format";
import { ArticleBody } from "@/components/site/ArticleBody";
import { MediaEmbed } from "@/components/site/MediaEmbed";
import { RowCard, rubriqueHref, type CardArticle } from "@/components/site/ArticleCard";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { Check, ChevronRight, Clock3, Facebook, Headphones, Link2, LoaderCircle, MessageCircle, Play, UserRound } from "lucide-react";
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

  useDocumentMeta({ title: article ? `${article.title} — Impact-Nation` : "Impact-Nation", description: article?.excerpt, image: article?.imageUrl });
  useEffect(() => { window.scrollTo({ top: 0 }); }, [slug]);

  if (isLoading) return <div className="editor-loading"><LoaderCircle className="spin" /> Chargement…</div>;
  if (!article) return <NotFound />;

  const url = typeof window !== "undefined" ? window.location.href : "";
  const text = encodeURIComponent(`${article.title} — ${url}`);
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); window.setTimeout(() => setCopied(false), 2200); } catch { /* ignore */ }
  };
  const published = article.publishedAt ?? article.createdAt;
  const updated = new Date(article.updatedAt).getTime() - new Date(published).getTime() > 3_600_000 ? article.updatedAt : null;
  const isVideo = article.kind === "video";
  const isAudio = article.kind === "audio";

  return (
    <div className="site-shell">
      <ReadingProgress />
      <SiteHeader />
      <main className="np-article">
        <div className="container">
          <nav className="np-crumbs" aria-label="Fil d’Ariane">
            <Link href="/">Accueil</Link><ChevronRight size={13} />
            <Link href={rubriqueHref(article.category)}>{article.category}</Link>
          </nav>

          <header className="np-article-head">
            <Link href={rubriqueHref(article.category)} className="np-kicker">
              {isVideo ? <><Play size={12} fill="currentColor" /> Vidéo · </> : isAudio ? <><Headphones size={13} /> Podcast · </> : null}{article.category}
            </Link>
            <h1>{article.title}</h1>
            <p className="np-article-standfirst">{article.excerpt}</p>
            <div className="np-article-meta">
              {article.author && <span><UserRound size={14} /> <b>{article.author}</b></span>}
              <span>Publié le {formatDay(published)}</span>
              {updated && <span>Mis à jour le {formatDay(updated)}</span>}
              <span><Clock3 size={14} /> {article.readMinutes} min {isVideo ? "de vidéo" : isAudio ? "d’écoute" : "de lecture"}</span>
            </div>
          </header>

          {(isVideo || isAudio) && article.mediaUrl && (
            <div className={`np-player ${isAudio ? "np-player-audio" : ""}`}>
              {isAudio && article.imageUrl && <img src={article.imageUrl} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} />}
              <MediaEmbed url={article.mediaUrl} poster={article.imageUrl} />
            </div>
          )}
          {!isVideo && !isAudio && article.imageUrl && <figure className="np-cover"><img src={article.imageUrl} alt="" fetchPriority="high" onError={(e) => { e.currentTarget.parentElement!.style.display = "none"; }} /></figure>}

          <div className="np-article-body">
            {article.body.trim() && <ArticleBody source={article.body} />}
            <div className="share-bar">
              <span>Partager</span>
              <button onClick={copy}>{copied ? <><Check size={15} /> Lien copié</> : <><Link2 size={15} /> Copier le lien</>}</button>
              <a href={`https://wa.me/?text=${text}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={15} /> WhatsApp</a>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer"><Facebook size={15} /> Facebook</a>
            </div>
          </div>
        </div>

        {data && data.related.length > 0 && (
          <section className="np-related">
            <div className="container">
              <div className="np-bar"><h2>Dans la même rubrique</h2><Link href={rubriqueHref(article.category)}>Tout voir</Link></div>
              <div className="np-related-grid">{data.related.map((item) => <RowCard key={item.id} article={item as CardArticle} showKicker={false} />)}</div>
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
