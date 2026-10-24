import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { useDocumentMeta } from "@/lib/seo";
import { ArticleCard } from "@/components/site/ArticleCard";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { ArrowLeft, ArrowRight, LoaderCircle } from "lucide-react";

/** "Toute l'actualité" (/actualites) and one rubric (/rubrique/:name), paginated. */
export default function ArticlesPage() {
  const [match, params] = useRoute("/rubrique/:name");
  const category = match ? decodeURIComponent(params?.name ?? "") : undefined;
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [category]);
  const { data, isLoading, isFetching } = trpc.content.list.useQuery({ category, page }, { placeholderData: (prev) => prev });
  const { data: categories } = trpc.content.categories.useQuery(undefined, { staleTime: 60_000 });
  const title = category ?? "Toute l’actualité";
  useDocumentMeta({ title: `${title} — Hébron-Ivoire`, description: category ? `Tous les articles de la rubrique ${category}.` : "Tous les récits de la rédaction Hébron-Ivoire." });
  const pages = Math.max(1, Math.ceil((data?.total ?? 0) / 9));
  const go = (p: number) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); };

  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="list-page">
        <div className="container">
          <Link className="back-link" href="/"><ArrowLeft size={15} /> Accueil</Link>
          <header className="list-head">
            <span className="eyebrow"><i /> {category ? "Rubrique" : "La rédaction"}</span>
            <h1>{title}</h1>
            {data && <p>{data.total} article{data.total > 1 ? "s" : ""}</p>}
          </header>
          <div className="chip-row" aria-label="Rubriques">
            <Link href="/actualites" className={!category ? "on" : ""}>Tout</Link>
            {categories?.map((c) => <Link key={c.category} href={`/rubrique/${encodeURIComponent(c.category)}`} className={category === c.category ? "on" : ""}>{c.category} <small>{c.count}</small></Link>)}
          </div>
          {isLoading && <div className="adm-center"><LoaderCircle className="spin" /> Chargement…</div>}
          {data && data.items.length === 0 && <p className="list-empty">Aucun article pour le moment. Revenez bientôt.</p>}
          <div className={`featured-grid list-grid ${isFetching ? "is-fetching" : ""}`}>{data?.items.map((item) => <ArticleCard key={item.id} article={item} />)}</div>
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
