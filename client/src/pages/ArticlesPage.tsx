import { useEffect, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { useDocumentMeta } from "@/lib/seo";
import { MidCard, type CardArticle } from "@/components/site/ArticleCard";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { ArrowLeft, ArrowRight, LoaderCircle } from "lucide-react";
import type { ArticleKind } from "@shared/slug";

/** /actualites, /videos, /podcasts and /rubrique/:slug share the same paginated list. */
export default function ArticlesPage() {
  const [location] = useLocation();
  const [, params] = useRoute("/rubrique/:slug");
  const slug = params?.slug ? decodeURIComponent(params.slug) : undefined;
  const kind: ArticleKind | undefined = location === "/videos" ? "video" : location === "/podcasts" ? "audio" : undefined;
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [slug, kind]);

  const { data, isLoading, isFetching } = trpc.content.list.useQuery({ category: slug, kind, page }, { placeholderData: (prev) => prev });
  const { data: rubrique } = trpc.content.rubrique.useQuery({ slug: slug ?? "" }, { enabled: Boolean(slug) });
  const { data: categories } = trpc.content.categories.useQuery(undefined, { staleTime: 60_000 });

  const title = slug ? rubrique?.name ?? "Rubrique" : kind === "video" ? "Vidéos" : kind === "audio" ? "Podcasts" : "Toute l’actualité";
  const intro = slug ? rubrique?.description : kind === "video" ? "Reportages, interviews et émissions en vidéo." : kind === "audio" ? "Les podcasts et émissions audio à écouter où vous voulez." : "Tous les récits de la rédaction, du plus récent au plus ancien.";
  useDocumentMeta({ title: `${title} — Impact-Nation`, description: intro || undefined });
  const pages = Math.max(1, Math.ceil((data?.total ?? 0) / 9));
  const go = (p: number) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); };

  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="np-list">
        <div className="container">
          <header className="np-list-head">
            <h1>{title}</h1>
            {intro && <p>{intro}</p>}
          </header>
          <div className="chip-row" aria-label="Rubriques">
            <Link href="/actualites" className={!slug && !kind ? "on" : ""}>Tout</Link>
            {categories?.filter((c) => c.count > 0).map((c) => <Link key={c.id} href={`/rubrique/${c.slug}`} className={slug === c.slug ? "on" : ""}>{c.name} <small>{c.count}</small></Link>)}
          </div>
          {isLoading && <div className="adm-center"><LoaderCircle className="spin" /> Chargement…</div>}
          {data && data.items.length === 0 && <p className="list-empty">Rien à afficher pour le moment. Revenez bientôt.</p>}
          <div className={`np-grid ${isFetching ? "is-fetching" : ""}`}>{data?.items.map((item) => <MidCard key={item.id} article={item as CardArticle} />)}</div>
          {pages > 1 && (
            <nav className="pager" aria-label="Pagination">
              <button disabled={page <= 1} onClick={() => go(page - 1)}><ArrowLeft size={15} /> Précédent</button>
              <span>Page {page} / {pages}</span>
              <button disabled={page >= pages} onClick={() => go(page + 1)}>Suivant <ArrowRight size={15} /></button>
            </nav>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
