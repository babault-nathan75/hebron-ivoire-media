import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useSiteText } from "@/lib/useSiteText";
import { formatToday } from "@/lib/format";
import { ArrowUpRight, Facebook, Instagram, LoaderCircle, Mail, MapPin, Search, Send, Youtube } from "lucide-react";
import { toast } from "sonner";
import { ADMIN_PATH } from "@shared/adminPath";
import { BrandMark } from "./BrandMark";
import { SearchDialog } from "./SearchDialog";

export { useSiteText };

/** Newspaper masthead: date strip, logo, then a section bar that stays pinned while the page scrolls. */
export function SiteHeader() {
  const t = useSiteText();
  const [location] = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const { data: categories } = trpc.content.categories.useQuery(undefined, { staleTime: 60_000 });
  const { data: content } = trpc.content.listPublished.useQuery(undefined, { staleTime: 30_000 });
  const hasKind = (kind: string) => content?.articles.some((a) => a.kind === kind);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setSearchOpen(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const links = [
    { label: "Accueil", href: "/" },
    ...(categories ?? []).filter((c) => c.count > 0).map((c) => ({ label: c.name, href: `/rubrique/${c.slug}` })),
    ...(hasKind("video") ? [{ label: "Vidéos", href: "/videos" }] : []),
    ...(hasKind("audio") ? [{ label: "Podcasts", href: "/podcasts" }] : []),
  ];
  const current = decodeURIComponent(location);

  return (
    <>
      <div className="np-top">
        <div className="container">
          <span className="np-date">{formatToday()} · {t("city")}</span>
          <span className="np-top-links">
            <a href="/#contact">Contact</a>
            <a href="#newsletter" onClick={(e) => { e.preventDefault(); document.getElementById("newsletter")?.scrollIntoView({ behavior: "smooth" }); }}>Newsletter</a>
          </span>
        </div>
      </div>
      <header className="np-mast">
        <div className="container">
          <BrandMark />
          <p className="np-motto" aria-label="Notre devise"><b className="m1">Éclairer</b><i>·</i><b className="m2">Transformer</b><i>·</i><b className="m3">Bâtir</b></p>
          <div className="np-mast-actions">
            <button className="np-search-btn" onClick={() => setSearchOpen(true)} aria-label="Rechercher"><Search size={17} /><span>Rechercher</span><kbd>Ctrl K</kbd></button>
          </div>
        </div>
      </header>
      <nav className="np-nav" aria-label="Rubriques">
        <div className="container">
          <ul>
            {links.map((l) => (
              <li key={l.href}><Link href={l.href} className={current === decodeURIComponent(l.href) ? "on" : ""}>{l.label}</Link></li>
            ))}
          </ul>
          <button className="np-nav-search" onClick={() => setSearchOpen(true)} aria-label="Rechercher"><Search size={18} /></button>
        </div>
      </nav>
      {searchOpen && <SearchDialog onClose={() => setSearchOpen(false)} />}
    </>
  );
}

function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [done, setDone] = useState(false);
  const subscribe = trpc.contact.subscribe.useMutation({
    onSuccess: () => { setDone(true); setEmail(""); },
    onError: (e) => toast.error(e.message),
  });
  if (done) return <p className="ft-done">Merci ! Vous êtes inscrit(e) : vous recevrez les prochaines nouveautés.</p>;
  return (
    <form className="ft-subscribe" onSubmit={(e) => { e.preventDefault(); subscribe.mutate({ email, website }); }}>
      <input type="email" required maxLength={320} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Votre adresse e-mail" aria-label="Adresse e-mail" />
      <input className="hp-field" tabIndex={-1} autoComplete="off" aria-hidden="true" value={website} onChange={(e) => setWebsite(e.target.value)} />
      <button disabled={subscribe.isPending}>{subscribe.isPending ? <LoaderCircle className="spin" size={16} /> : <Send size={16} />} S’abonner</button>
    </form>
  );
}

export function SiteFooter() {
  const t = useSiteText();
  const { data: content } = trpc.content.listPublished.useQuery(undefined, { staleTime: 30_000 });
  const { data: categories } = trpc.content.categories.useQuery(undefined, { staleTime: 60_000 });
  const visible = (categories ?? []).filter((c) => c.count > 0);
  const hasKind = (kind: string) => content?.articles.some((a) => a.kind === kind);
  const socials = [
    { label: "Facebook", href: t("facebookUrl"), icon: Facebook, className: "fb" },
    { label: "Instagram", href: t("instagramUrl"), icon: Instagram, className: "ig" },
    { label: "YouTube", href: t("youtubeUrl"), icon: Youtube, className: "yt" },
  ];
  return (
    <footer className="site-footer ft">
      <div className="container ft-cta" id="newsletter">
        <div>
          <span className="ft-kicker">Restez informé</span>
          <h2>Les nouveaux récits, directement dans votre boîte e-mail.</h2>
        </div>
        <SubscribeForm />
      </div>

      <div className="container ft-grid">
        <div className="ft-brand">
          <BrandMark inverse />
          <p>{t("footerAbout")}</p>
          <div className="ft-socials" aria-label="Réseaux sociaux">
            {socials.map(({ label, href, icon: Icon, className }) => (
              <a key={label} className={className} href={href} aria-label={label} title={label} target="_blank" rel="noopener noreferrer"><Icon size={18} /></a>
            ))}
          </div>
        </div>

        <nav className="ft-col" aria-label="Explorer">
          <h3>Explorer</h3>
          <Link href="/">Accueil</Link>
          <Link href="/actualites">Toute l’actualité</Link>
          {hasKind("video") && <Link href="/videos">Vidéos</Link>}
          {hasKind("audio") && <Link href="/podcasts">Podcasts</Link>}
          {content?.events.length ? <a href="/#evenements">Agenda</a> : null}
        </nav>

        <nav className="ft-col" aria-label="Rubriques">
          <h3>Rubriques</h3>
          {visible.length ? visible.slice(0, 7).map((c) => <Link key={c.id} href={`/rubrique/${c.slug}`}>{c.name}</Link>) : <span className="ft-muted">Bientôt</span>}
        </nav>

        <div className="ft-col">
          <h3>Nous joindre</h3>
          <p className="ft-line"><MapPin size={15} /> {t("city")}</p>
          <a className="ft-line" href={`mailto:${t("contactEmail")}`}><Mail size={15} /> {t("contactEmail")}</a>
          <a className="ft-link-cta" href="/#contact">Contacter la rédaction <ArrowUpRight size={14} /></a>
        </div>
      </div>

      <div className="ft-bottom">
        <div className="container">
          <span>© {new Date().getFullYear()} <a href={ADMIN_PATH} className="footer-admin-link">IMPACT-NATION.NET</a>. TOUS DROITS RÉSERVÉS.</span>
          <a href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Retour en haut ↑</a>
        </div>
      </div>
      {t("footerNote") && <p className="demo-note">{t("footerNote")}</p>}
    </footer>
  );
}
