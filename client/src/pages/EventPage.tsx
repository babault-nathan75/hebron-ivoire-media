import { useEffect } from "react";
import { Link, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { useDocumentMeta } from "@/lib/seo";
import { ArticleBody } from "@/components/site/ArticleBody";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { ArrowLeft, CalendarDays, LoaderCircle, MapPin } from "lucide-react";
import NotFound from "./NotFound";

const fmt = (d: Date | string) =>
  new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Abidjan" }).format(new Date(d));

export default function EventPage() {
  const [, params] = useRoute("/evenement/:slug");
  const slug = params?.slug ?? "";
  const { data: event, isLoading } = trpc.content.event.useQuery({ slug }, { enabled: Boolean(slug), retry: false });
  useDocumentMeta({ title: event ? `${event.title} — Hébron-Ivoire` : "Hébron-Ivoire", description: event?.excerpt, image: event?.imageUrl });
  useEffect(() => { window.scrollTo({ top: 0 }); }, [slug]);

  if (isLoading) return <div className="editor-loading"><LoaderCircle className="spin" /> Chargement…</div>;
  if (!event) return <NotFound />;

  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="article-page">
        <div className="container article-wrap">
          <Link className="back-link" href="/"><ArrowLeft size={15} /> Accueil</Link>
          <header className="article-head">
            <span className="category-label">Événement</span>
            <h1>{event.title}</h1>
            <p className="article-standfirst">{event.excerpt}</p>
            <div className="article-byline">
              <span><CalendarDays size={14} /> {fmt(event.startsAt)}</span>
              <span><MapPin size={14} /> {event.location}</span>
            </div>
          </header>
          {event.imageUrl && <figure className="article-cover"><img src={event.imageUrl} alt="" /></figure>}
          <ArticleBody source={event.details} />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
