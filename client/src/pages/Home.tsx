import { useEffect, useMemo, useRef, useState } from "react";
import { useStickyNav } from "@/lib/useStickyNav";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Heart,
  HeartHandshake,
  Mail,
  MapPin,
  Menu,
  Mic2,
  Search,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { BrandMark } from "@/components/site/BrandMark";
import { ContactForm } from "@/components/site/ContactForm";
import { SiteFooter } from "@/components/site/SiteChrome";
import { SITE_DEFAULTS } from "@shared/siteSettings";

type Story = {
  id: string;
  category: string;
  title: string;
  date: string;
  readTime: string;
  image: string;
  excerpt: string;
  section: string;
  href: string;
};

const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#174d3b"/><stop offset="1" stop-color="#28634b"/></linearGradient></defs><rect width="800" height="600" fill="url(#g)"/><circle cx="640" cy="130" r="46" fill="#df8247" opacity=".85"/></svg>',
  );

const navLinks = [
  ["Accueil", "accueil"],
  ["Actualités", "actualites"],
  ["Événements", "evenements"],
  ["Interviews", "interviews"],
  ["Reportages", "reportages"],
  ["Témoignages", "temoignages"],
  ["Hébron-Ivoire", "activites"],
  ["Contact", "contact"],
] as const;

function SectionHeading({ eyebrow, title, description, link, light = false }: { eyebrow: string; title: string; description?: string; link?: string; light?: boolean }) {
  return (
    <div className={`section-heading ${light ? "section-heading-light" : ""}`}>
      <div>
        <span className="eyebrow"><i />{eyebrow}</span>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {link && (link.startsWith("/") ? <Link className="text-link" href={link}>Voir la rubrique <ArrowRight size={16} /></Link> : <a className="text-link" href={`#${link}`}>Voir la rubrique <ArrowRight size={16} /></a>)}
    </div>
  );
}

function StoryCard({ story, onOpen, featured = false }: { story: Story; onOpen: (story: Story) => void; featured?: boolean }) {
  return (
    <article className={`story-card ${featured ? "story-card-featured" : ""}`}>
      <button className="story-image-button" onClick={() => onOpen(story)} aria-label={`Lire : ${story.title}`}>
        <img src={story.image} alt="" loading="lazy" />
        <span className="image-arrow"><ArrowUpRight size={17} /></span>
      </button>
      <div className="story-content">
        <span className="category-label">{story.category}</span>
        <button className="story-title" onClick={() => onOpen(story)}>{story.title}</button>
        <p className="story-excerpt">{story.excerpt}</p>
        <div className="story-meta"><time>{story.date}</time><span className="meta-dot" /><span><Clock3 size={13} />{story.readTime} de lecture</span></div>
      </div>
    </article>
  );
}

export default function Home() {
  const [, navigate] = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  useStickyNav(headerRef);
  const [activeId, setActiveId] = useState("accueil");
  const [scrolled, setScrolled] = useState(false);
  const { data: siteData } = trpc.site.settings.useQuery(undefined, { staleTime: 30_000 });
  const t = (key: string) => siteData?.[key] || SITE_DEFAULTS[key] || "";
  const { data: cmsContent } = trpc.content.listPublished.useQuery(undefined, { staleTime: 30_000 });
  const stories: Story[] = useMemo(() => {
    const published = cmsContent?.articles ?? [];
    const mapped: Story[] = published.map((article) => ({
      id: `article-${article.id}`,
      category: article.category,
      title: article.title,
      date: new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(article.publishedAt ?? article.createdAt),
      readTime: `${article.readMinutes} min`,
      image: article.imageUrl || PLACEHOLDER,
      excerpt: article.excerpt,
      section: article.category,
      href: `/article/${article.slug}`,
    }));
    return mapped.slice(0, 12);
  }, [cmsContent?.articles]);
  const byCategory = (name: string) => stories.find((story) => story.category.toLocaleLowerCase("fr") === name);
  const interview = byCategory("interview");
  const reportage = byCategory("reportage");
  const testimony = byCategory("témoignage");
  const latest = stories[1] ?? stories[0];
  const rail = stories.filter((story) => story !== latest).slice(0, 3);
  const act = (index: number) => stories[index] ?? stories[0];
  const databaseEvent = cmsContent?.events[0];
  const available: Record<string, boolean> = {
    accueil: true,
    actualites: stories.length > 0,
    evenements: Boolean(databaseEvent),
    interviews: Boolean(interview),
    reportages: Boolean(reportage),
    temoignages: Boolean(testimony),
    activites: stories.length > 0,
    contact: true,
  };
  const visibleNav = navLinks.filter(([, id]) => available[id]);
  const footerLink = (label: string, id: string) => (available[id] ? <a key={id + label} href={`#${id}`}>{label}</a> : null);
  const eventDate = databaseEvent ? new Date(databaseEvent.startsAt) : null;
  const eventStory: Story | null = databaseEvent ? {
    id: `event-${databaseEvent.id}`,
    category: "Événement",
    title: databaseEvent.title,
    date: eventDate ? new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(eventDate) : "",
    readTime: "1 min",
    image: databaseEvent.imageUrl || PLACEHOLDER,
    excerpt: databaseEvent.excerpt,
    section: "Événements",
    href: `/evenement/${databaseEvent.slug}`,
  } : null;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
        return;
      }
      if (event.key === "Escape") {
        setSearchOpen(false);
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const timer = window.setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" }), 350);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 520);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Highlight the nav link of the section currently in view.
  useEffect(() => {
    const ids = Object.keys(available).filter((id) => available[id] && id !== "accueil");
    const elements = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => Boolean(el));
    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => visible.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0));
        const best = Array.from(visible.entries()).sort((a, b) => b[1] - a[1])[0];
        setActiveId(best && best[1] > 0 ? best[0] : "accueil");
      },
      { rootMargin: "-30% 0px -50% 0px", threshold: [0, 0.1, 0.4, 0.8] },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stories.length, Boolean(databaseEvent), Boolean(interview), Boolean(reportage), Boolean(testimony)]);

  // Fade sections in as they enter the viewport.
  useEffect(() => {
    document.documentElement.classList.add("js-reveal");
    const targets = Array.from(document.querySelectorAll<HTMLElement>("main > section"));
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); } }),
      { threshold: 0.08 },
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [stories.length, Boolean(databaseEvent), Boolean(interview), Boolean(reportage), Boolean(testimony)]);

  const filteredStories = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase("fr");
    if (!query) return stories;
    return stories.filter((story) => `${story.title} ${story.category} ${story.excerpt}`.toLocaleLowerCase("fr").includes(query));
  }, [searchTerm, stories]);

  const openStory = (story: Story) => navigate(story.href);

  return (
    <div className="site-shell" id="accueil">
      <div className="utility-bar">
        <div className="container utility-inner">
          <p><span className="live-dot" /> {t("utilityLine")}</p>
          <div className="utility-right"><span>{t("city")}</span><span className="utility-separator" /> <a href="#contact">Nous écrire <ArrowUpRight size={12} /></a></div>
        </div>
      </div>

      <header ref={headerRef} className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
        <div className="container header-main">
          <BrandMark />
          <div className="header-actions">
            <button className="search-trigger" onClick={() => setSearchOpen(true)} aria-label="Rechercher"><Search size={18} /><span>Rechercher</span><kbd>Ctrl K</kbd></button>
            <a className="header-cta" href={available.actualites ? "#actualites" : "#contact"}>{available.actualites ? "Explorer le média" : "Nous écrire"} <ArrowUpRight size={15} /></a>
            <button className="mobile-menu-trigger" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"} aria-expanded={menuOpen}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>
          </div>
        </div>
        <nav className={`primary-nav ${menuOpen ? "nav-open" : ""}`} aria-label="Navigation principale">
          <div className="container nav-inner">
            {visibleNav.map(([label, id], index) => <a key={id} className={activeId === id ? "nav-current" : ""} aria-current={activeId === id ? "true" : undefined} href={`#${id}`} onClick={() => setMenuOpen(false)}>{label}</a>)}
            <button className="nav-search" onClick={() => { setSearchOpen(true); setMenuOpen(false); }} aria-label="Ouvrir la recherche"><Search size={18} /></button>
          </div>
        </nav>
      </header>

      <main>
        <section className="hero-section" aria-labelledby="hero-title">
          <div className={`container hero-wrap ${stories[0] ? "" : "hero-wrap-solo"}`}>
            <div className="hero-copy">
              <span className="eyebrow hero-eyebrow"><i /> {t("heroEyebrow")}</span>
              <p className="hero-overline">{t("heroOverline")}</p>
              <h1 id="hero-title">{t("heroTitle1")}<br /><em>{t("heroTitle2")}</em></h1>
              <p className="hero-intro">{t("heroIntro")}</p>
              {stories[0] && <button className="button-primary" onClick={() => openStory(stories[0])}>Lire l’article <ArrowRight size={17} /></button>}
              <div className="hero-note"><span className="hero-note-icon"><Sparkles size={15} /></span><span>Des voix, des parcours,<br /><strong>une même espérance.</strong></span></div>
              {stories.length > 0 && <span className="hero-index">01 <i /> {String(Math.min(stories.length, 6)).padStart(2, "0")}</span>}
            </div>
            {stories[0] && <div className="hero-visual">
              <img src={stories[0]?.image ?? PLACEHOLDER} alt="Un moment de recueillement partagé dans une communauté ivoirienne" fetchPriority="high" />
              <div className="hero-image-shade" />
              <div className="hero-photo-caption"><span>LA UNE</span><span>{stories[0]?.date ?? ""}</span></div>
              <div className="hero-photo-note"><span className="hero-play"><BookOpen size={16} /></span><span><strong>{stories[0]?.category}</strong><small>{stories[0]?.title}</small></span></div>
              <span className="hero-stamp">HISTOIRES<br />D’ESPÉRANCE</span>
            </div>}
          </div>
          <div className="hero-bottom-line"><span /> <span>LE REGARD QUI RASSEMBLE</span><span /></div>
        </section>

        {stories.length === 0 && <section className="empty-media"><div className="container"><span className="eyebrow"><i /> Bientôt</span><h2>Les premières publications arrivent.</h2><p>La rédaction prépare ses premiers récits. Revenez très vite.</p></div></section>}

        {stories.length > 1 && (
<section className="featured-section section-pad" id="actualites">
          <div className="container">
            <SectionHeading eyebrow="Le choix de la rédaction" title={t("featuredTitle")} description={t("featuredDesc")} link="/actualites" />
            <div className="featured-grid">
              {stories.slice(1, 4).map((story) => <StoryCard key={story.id} story={story} onOpen={openStory} />)}
            </div>
          </div>
        </section>
)}

        {latest && (
<section className="latest-section section-pad" id={stories.length > 1 ? "dernieres-actualites" : "actualites"}>
          <div className="container latest-layout">
            <div className="latest-main">
              <SectionHeading eyebrow="Le fil de la rédaction" title={t("latestTitle")} description={t("latestDesc")} />
              <div className="latest-feature">
                <button className="latest-image" onClick={() => openStory(latest)} aria-label="Lire le reportage sur la solidarité"><img src={latest.image} alt="Des bénévoles s'engagent auprès de leur communauté" loading="lazy" /><span className="latest-image-caption">REPORTAGE · TERRAIN</span></button>
                <div className="latest-feature-copy"><span className="category-label">{latest.category}</span><button className="latest-title" onClick={() => openStory(latest)}>{latest.title}</button><p>{latest.excerpt}</p><button className="round-link" onClick={() => openStory(latest)} aria-label="Lire le reportage"><ArrowRight size={18} /></button></div>
              </div>
            </div>
            <aside className="news-rail" aria-label="À lire aussi">
              <div className="rail-heading"><span>À lire aussi</span><ArrowDownRight size={18} /></div>
              {rail.map((story, index) => <button className="rail-story" key={story.id} onClick={() => openStory(story)}><span className="rail-number">0{index + 1}</span><span className="rail-story-copy"><span>{story.category}</span><strong>{story.title}</strong><small>{story.date}</small></span><ChevronRight size={17} /></button>)}
              <a className="rail-all" href="#actualites">Toute l’actualité <ArrowRight size={15} /></a>
            </aside>
          </div>
        </section>
)}

        {databaseEvent && (
<section className="events-section" id="evenements">
          <div className="container events-layout">
            <div className="events-intro"><span className="eyebrow eyebrow-light"><i /> À noter</span><h2>{t("eventsTitle1")}<br /><em>{t("eventsTitle2")}</em></h2><p>{t("eventsIntro")}</p>{eventStory && <Link href={eventStory.href} className="events-link">Découvrir le rendez-vous <ArrowRight size={16} /></Link>}<span className="events-decoration" aria-hidden="true">&</span></div>
            <div className="event-card">
              <div className="event-date"><span>{eventDate?.toLocaleDateString("fr-FR", { month: "short", timeZone: "Africa/Abidjan" }).replace(".", "").toUpperCase() ?? "OCT"}</span><strong>{eventDate?.toLocaleDateString("fr-FR", { day: "2-digit", timeZone: "Africa/Abidjan" }) ?? "12"}</strong><small>{eventDate?.toLocaleDateString("fr-FR", { year: "numeric", timeZone: "Africa/Abidjan" }) ?? "2026"}</small></div>
              <div className="event-details"><span className="event-type"><CalendarDays size={14} /> RENCONTRE & PARTAGE</span><h3>{databaseEvent?.title ?? <>Les conversations<br />qui nous rapprochent</>}</h3><p>{databaseEvent?.excerpt ?? "Un temps de parole et d’écoute ouvert à toutes les générations."}</p><div className="event-location"><MapPin size={14} /> {databaseEvent?.location ?? "Abidjan"} <span>·</span> {eventDate?.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Abidjan" }) ?? "15 h 00"}</div></div>
              <button className="event-arrow" onClick={() => eventStory && openStory(eventStory)} aria-label="En savoir plus sur les événements"><ArrowUpRight size={20} /></button>
              <div className="event-card-bottom"><span>UN RENDEZ-VOUS À PARTAGER</span><span>HÉBRON · IVOIRE</span></div>
            </div>
          </div>
        </section>
)}

        {interview && (
<section className="interviews-section section-pad" id="interviews">
          <div className="container">
            <SectionHeading eyebrow="Regards singuliers" title={t("interviewsTitle")} description={t("interviewsDesc")} link={interview ? `/rubrique/${encodeURIComponent(interview.category)}` : undefined} />
            <div className="interview-feature">
              <button className="interview-image" onClick={() => openStory(interview!)} aria-label="Lire l’interview"><img src={interview!.image} alt="Une femme engagée dans sa communauté partage son histoire" loading="lazy" /><span className="interview-image-label"><Mic2 size={14} /> RENCONTRE</span></button>
              <div className="interview-copy"><span className="category-label">LA PAROLE À</span><span className="quote-mark">“</span><h3>{interview!.title}</h3><p>{interview!.excerpt}</p><div className="interview-author"><span className="author-avatar">A.</span><span><strong>Une voix de la communauté</strong><small>Engagement · 7 minutes de lecture</small></span></div><button className="text-link" onClick={() => openStory(interview!)}>Lire l’entretien <ArrowRight size={16} /></button></div>
            </div>
          </div>
        </section>
)}

        {reportage && (
<section className="field-section section-pad" id="reportages">
          <div className="container field-layout">
            <div className="field-photo"><img src={reportage!.image} alt="Action solidaire menée avec des bénévoles ivoiriens" loading="lazy" /><span className="field-photo-tag">AU PLUS PRÈS DU TERRAIN</span><span className="field-photo-index">REPORTAGE Nº 04</span></div>
            <div className="field-copy"><span className="eyebrow"><i /> En immersion</span><h2>Raconter ce qui<br />nous <em>relie.</em></h2><p>Prendre le temps de voir, d’écouter et de comprendre. Nos reportages mettent en lumière celles et ceux qui, jour après jour, font vivre la solidarité.</p><button className="button-outline" onClick={() => openStory(reportage!)}>Voir les reportages <ArrowRight size={16} /></button><div className="field-stat"><strong>01</strong><span>histoire de terrain,<br />des milliers de liens.</span></div></div>
          </div>
        </section>
)}

        {testimony && (
<section className="testimony-section" id="temoignages">
          <div className="container testimony-layout">
            <div className="testimony-copy"><span className="eyebrow eyebrow-light"><i /> Paroles de vie</span><h2>Chaque parcours<br />a sa <em>lumière.</em></h2><p>Des histoires vraies — racontées avec pudeur, écoutées avec le cœur.</p><button className="testimony-link" onClick={() => openStory(testimony!)}>Lire le témoignage <ArrowRight size={16} /></button></div>
            <div className="testimony-card"><div className="testimony-image"><img src={testimony!.image} alt="Portrait d'un homme partageant son témoignage" loading="lazy" /><span>UNE HISTOIRE, UNE ESPÉRANCE</span></div><div className="testimony-quote"><span className="quote-mark">“</span><blockquote>{testimony!.title}</blockquote><p>Un témoignage recueilli par la rédaction</p><button className="testimony-open" onClick={() => openStory(testimony!)} aria-label="Ouvrir ce témoignage"><ArrowUpRight size={18} /></button></div></div>
            <div className="testimony-watermark" aria-hidden="true">H</div>
          </div>
        </section>
)}

        {stories.length > 0 && (
<section className="activities-section section-pad" id="activites">
          <div className="container">
            <SectionHeading eyebrow="Un média en mouvement" title={t("activitiesTitle")} description={t("activitiesDesc")} />
            <div className="activity-grid">
              <button className="activity-card activity-card-large" onClick={() => openStory(act(0))}><img src={act(0).image} alt="Un temps de rassemblement et de partage" loading="lazy" /><span className="activity-overlay" /><span className="activity-content"><span className="activity-icon"><BookOpen size={17} /></span><span className="activity-title">{t("activity1Title")}</span><span className="activity-desc">{t("activity1Desc")}</span></span><ArrowUpRight className="activity-arrow" size={19} /></button>
              <button className="activity-card" onClick={() => openStory(act(2))}><img src={act(2).image} alt="Une rencontre entre membres de la communauté" loading="lazy" /><span className="activity-overlay" /><span className="activity-content"><span className="activity-icon"><Users size={17} /></span><span className="activity-title">{t("activity2Title")}</span><span className="activity-desc">{t("activity2Desc")}</span></span><ArrowUpRight className="activity-arrow" size={19} /></button>
              <button className="activity-card" onClick={() => openStory(act(3))}><img src={act(3).image} alt="Des bénévoles engagés dans une action solidaire" loading="lazy" /><span className="activity-overlay" /><span className="activity-content"><span className="activity-icon"><HeartHandshake size={17} /></span><span className="activity-title">{t("activity3Title")}</span><span className="activity-desc">{t("activity3Desc")}</span></span><ArrowUpRight className="activity-arrow" size={19} /></button>
              <button className="activity-card" onClick={() => openStory(act(4))}><img src={act(4).image} alt="Un récit personnel partagé avec authenticité" loading="lazy" /><span className="activity-overlay" /><span className="activity-content"><span className="activity-icon"><Heart size={17} /></span><span className="activity-title">{t("activity4Title")}</span><span className="activity-desc">{t("activity4Desc")}</span></span><ArrowUpRight className="activity-arrow" size={19} /></button>
            </div>
            <div className="activity-footnote"><span>UN MÉDIA, DES RENCONTRES, UN MÊME ÉLAN.</span><span>FOI <i /> CULTURE <i /> COMMUNAUTÉ</span></div>
          </div>
        </section>
)}

        <section className="contact-band" id="contact"><div className="container contact-band-inner"><div className="contact-intro"><span className="contact-orbit" aria-hidden="true"><Mail size={23} /></span><div><span className="eyebrow eyebrow-light"><i /> {t("contactKicker")}</span><h2>{t("contactTitle")}</h2><p>{t("contactText")}</p><a className="contact-mail" href={`mailto:${t("contactEmail")}`}>{t("contactEmail")}</a></div></div><ContactForm /></div></section>
      </main>

      <SiteFooter />

      <a className={`to-top ${scrolled ? "show" : ""}`} href="#accueil" aria-label="Retour en haut de page"><ArrowUpRight size={18} style={{ transform: "rotate(-45deg)" }} /></a>

      {searchOpen && <div className="modal-backdrop search-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSearchOpen(false); }}><section className="search-panel" role="dialog" aria-modal="true" aria-labelledby="search-title"><div className="search-panel-head"><span className="eyebrow"><i /> Recherche</span><button className="modal-close" onClick={() => setSearchOpen(false)} aria-label="Fermer"><X size={20} /></button></div><h2 id="search-title">Que souhaitez-vous lire ?</h2><label className="search-field"><Search size={19} /><input autoFocus value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Un sujet, une rubrique, un mot…" /><kbd>ESC</kbd></label><div className="search-results"><span className="search-results-count">{filteredStories.length} résultat{filteredStories.length > 1 ? "s" : ""}</span>{filteredStories.length ? filteredStories.map((story) => <button className="search-result" key={story.id} onClick={() => { setSearchOpen(false); openStory(story); }}><img src={story.image} alt="" /><span><small>{story.category} · {story.date}</small><strong>{story.title}</strong></span><ArrowUpRight size={17} /></button>) : <p className="search-empty">Aucun récit ne correspond à cette recherche. Essayez un autre mot.</p>}</div><div className="search-panel-foot"><span>HÉBRON · IVOIRE</span><span>LA FOI, LA CULTURE ET LA VIE</span></div></section></div>}

    </div>
  );
}
