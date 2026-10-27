import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, ArrowUpRight, CalendarDays, Clock3, Headphones, MapPin, Newspaper, Play } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useSiteText } from "@/lib/useSiteText";
import { formatShort } from "@/lib/format";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { ContactForm } from "@/components/site/ContactForm";
import { LeadCard, MidCard, NewsItem, RowCard, Thumb, articleHref, rubriqueHref, type CardArticle } from "@/components/site/ArticleCard";
import { useDocumentMeta } from "@/lib/seo";

const when = (a: CardArticle) => new Date(a.publishedAt ?? a.createdAt).getTime();

function SectionBar({ title, to, label = "Tout voir" }: { title: string; to?: string; label?: string }) {
  return (
    <div className="np-bar">
      <h2>{title}</h2>
      {to && <Link href={to}>{label} <ArrowRight size={14} /></Link>}
    </div>
  );
}

export default function Home() {
  const t = useSiteText();
  const { data, isLoading } = trpc.content.listPublished.useQuery(undefined, { staleTime: 30_000 });
  const { data: categories } = trpc.content.categories.useQuery(undefined, { staleTime: 60_000 });
  const [scrolled, setScrolled] = useState(false);
  useDocumentMeta({ title: "Impact-Nation.net — Le média d’impact social et sociétal", description: t("siteDescription") });

  const view = useMemo(() => {
    const articles = (data?.articles ?? []) as CardArticle[];
    const byDate = [...articles].sort((a, b) => when(b) - when(a));
    const lead = articles[0]; // featured first, then newest
    const secondary = byDate.filter((a) => a !== lead).slice(0, 3);
    const used = new Set<CardArticle>([lead, ...secondary].filter(Boolean));
    const blocks = (categories ?? [])
      .map((c) => ({ category: c, items: byDate.filter((a) => a.category === c.name && !used.has(a)).slice(0, 3) }))
      .filter((b) => b.items.length > 0);
    return {
      lead,
      secondary,
      latest: byDate.slice(0, 7),
      blocks,
      videos: byDate.filter((a) => a.kind === "video").slice(0, 4),
      podcasts: byDate.filter((a) => a.kind === "audio").slice(0, 4),
      empty: articles.length === 0,
    };
  }, [data, categories]);

  const events = data?.events.slice(0, 4) ?? [];

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const timer = window.setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" }), 350);
    return () => window.clearTimeout(timer);
  }, [isLoading]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 520);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const { lead, secondary, latest, blocks, videos, podcasts } = view;

  return (
    <div className="site-shell" id="top">
      <SiteHeader />

      <main>
        {view.empty && !isLoading && (
          <section className="np-empty">
            <div className="container">
              <Newspaper size={34} />
              <h1>Les premières publications arrivent.</h1>
              <p>La rédaction prépare ses premiers récits. Revenez très vite.</p>
            </div>
          </section>
        )}

        {lead && (
          <section className="np-front container">
            <div className="np-front-main">
              <LeadCard article={lead} />
              {secondary.length > 0 && <div className="np-trio">{secondary.map((a) => <MidCard key={a.id} article={a} />)}</div>}
            </div>
            <aside className="np-news" aria-label="Dernières nouvelles">
              <div className="np-bar np-bar-sm"><h2>Dernières nouvelles</h2></div>
              <ul>{latest.map((a) => <NewsItem key={a.id} article={a} />)}</ul>
              <Link className="np-news-all" href="/actualites">Toute l’actualité <ArrowRight size={14} /></Link>
            </aside>
          </section>
        )}

        {blocks.map(({ category, items }) => (
          <section key={category.id} className="np-block container">
            <SectionBar title={category.name} to={rubriqueHref(category.name)} />
            <div className="np-block-grid" data-n={items.length}>{items.map((a) => <MidCard key={a.id} article={a} />)}</div>
          </section>
        ))}

        {videos.length > 0 && (
          <section className="np-videos">
            <div className="container">
              <SectionBar title={t("videosTitle")} to="/videos" label="Toutes les vidéos" />
              <div className="np-videos-grid">
                <Link href={articleHref(videos[0])} className="np-video-feature">
                  <span className="np-video-img">
                    {videos[0].imageUrl ? <img src={videos[0].imageUrl} alt="" loading="lazy" /> : <span className="np-ph"><b>{videos[0].category}</b></span>}
                    <span className="np-play"><Play size={30} fill="currentColor" /></span>
                  </span>
                  <strong>{videos[0].title}</strong>
                  <small>{videos[0].category} · {formatShort(videos[0].publishedAt ?? videos[0].createdAt)}</small>
                </Link>
                <div className="np-video-list">
                  {videos.slice(1).map((v) => (
                    <Link key={v.id} href={articleHref(v)} className="np-video-item">
                      <span className="np-video-img">
                        {v.imageUrl ? <img src={v.imageUrl} alt="" loading="lazy" /> : <span className="np-ph" />}
                        <span className="np-play np-play-sm"><Play size={16} fill="currentColor" /></span>
                      </span>
                      <span><strong>{v.title}</strong><small>{v.category} · {formatShort(v.publishedAt ?? v.createdAt)}</small></span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {podcasts.length > 0 && (
          <section className="np-podcasts">
            <div className="container">
              <SectionBar title={t("podcastsTitle")} to="/podcasts" label="Tous les podcasts" />
              <div className="np-pod-grid">
                {podcasts.map((p) => (
                  <Link key={p.id} href={articleHref(p)} className="np-pod">
                    <span className="np-pod-play"><Headphones size={20} /></span>
                    <span className="np-pod-copy">
                      <small>{p.category}</small>
                      <strong>{p.title}</strong>
                      <em><Clock3 size={12} /> {p.readMinutes} min · {formatShort(p.publishedAt ?? p.createdAt)}</em>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {events.length > 0 && (
          <section className="np-agenda container" id="evenements">
            <SectionBar title={t("agendaTitle")} />
            <div className="np-agenda-grid">
              {events.map((e) => {
                const d = new Date(e.startsAt);
                return (
                  <Link key={e.id} href={`/evenement/${e.slug}`} className="np-event">
                    <span className="np-event-date">
                      <b>{d.toLocaleDateString("fr-FR", { day: "2-digit", timeZone: "Africa/Abidjan" })}</b>
                      <small>{d.toLocaleDateString("fr-FR", { month: "short", timeZone: "Africa/Abidjan" }).replace(".", "")}</small>
                    </span>
                    <span className="np-event-copy">
                      <strong>{e.title}</strong>
                      <em><MapPin size={12} /> {e.location}</em>
                    </span>
                    <CalendarDays size={16} className="np-event-icon" />
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <section className="np-contact" id="contact">
          <div className="container">
            <div>
              <span className="np-kicker-plain">Contact</span>
              <h2>{t("contactTitle")}</h2>
              <p>{t("contactText")}</p>
              <a className="np-contact-mail" href={`mailto:${t("contactEmail")}`}>{t("contactEmail")} <ArrowUpRight size={16} /></a>
            </div>
            <ContactForm />
          </div>
        </section>
      </main>

      <SiteFooter />

      <a className={`to-top ${scrolled ? "show" : ""}`} href="#top" aria-label="Retour en haut de page"><ArrowUpRight size={18} style={{ transform: "rotate(-45deg)" }} /></a>
    </div>
  );
}
