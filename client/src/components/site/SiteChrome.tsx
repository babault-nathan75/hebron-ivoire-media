import { useRef, useState } from "react";
import { useStickyNav } from "@/lib/useStickyNav";
import { Link, useLocation } from "wouter";
import { SITE_DEFAULTS } from "@shared/siteSettings";
import { trpc } from "@/lib/trpc";
import { ArrowUpRight, Facebook, Instagram, LoaderCircle, Mail, MapPin, Menu, Search, Send, X, Youtube } from "lucide-react";
import { toast } from "sonner";
import { BrandMark } from "./BrandMark";

export function useSiteText() {
  const { data } = trpc.site.settings.useQuery(undefined, { staleTime: 30_000 });
  return (key: string) => data?.[key] || SITE_DEFAULTS[key] || "";
}

/** Header used on every page except the home page (which has its own scroll-spy version). */
export function SiteHeader() {
  const t = useSiteText();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  useStickyNav(headerRef);
  const { data: categories } = trpc.content.categories.useQuery(undefined, { staleTime: 60_000 });
  const links = [
    { label: "Accueil", href: "/" },
    { label: "Actualités", href: "/actualites" },
    ...(categories ?? []).slice(0, 4).map((c) => ({ label: c.category, href: `/rubrique/${encodeURIComponent(c.category)}` })),
    { label: "Contact", href: "/#contact" },
  ];
  const active = (href: string) => decodeURIComponent(location) === decodeURIComponent(href);
  return (
    <>
      <div className="utility-bar">
        <div className="container utility-inner">
          <p><span className="live-dot" /> {t("utilityLine")}</p>
          <div className="utility-right"><span>{t("city")}</span></div>
        </div>
      </div>
      <header ref={headerRef} className="site-header is-scrolled">
        <div className="container header-main">
          <BrandMark />
          <div className="header-actions">
            <Link className="header-cta" href="/actualites">Toute l’actualité <ArrowUpRight size={15} /></Link>
            <button className="mobile-menu-trigger" onClick={() => setOpen(!open)} aria-label={open ? "Fermer le menu" : "Ouvrir le menu"} aria-expanded={open}>{open ? <X size={22} /> : <Menu size={22} />}</button>
          </div>
        </div>
        <nav className={`primary-nav ${open ? "nav-open" : ""}`} aria-label="Navigation principale">
          <div className="container nav-inner">
            {links.map((l) => (l.href.includes("#")
              ? <a key={l.label} href={l.href} onClick={() => setOpen(false)}>{l.label}</a>
              : <Link key={l.label} href={l.href} className={active(l.href) ? "nav-current" : ""} onClick={() => setOpen(false)}>{l.label}</Link>))}
            <Link className="nav-search" href="/actualites" aria-label="Rechercher"><Search size={18} /></Link>
          </div>
        </nav>
      </header>
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
  const socials = [
    { label: "Facebook", href: t("facebookUrl"), icon: Facebook, className: "fb" },
    { label: "Instagram", href: t("instagramUrl"), icon: Instagram, className: "ig" },
    { label: "YouTube", href: t("youtubeUrl"), icon: Youtube, className: "yt" },
  ];
  return (
    <footer className="site-footer ft">
      <div className="container ft-cta">
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
          {content?.events.length ? <a href="/#evenements">Événements</a> : null}
          <a href="/#contact">Contact</a>
        </nav>

        <nav className="ft-col" aria-label="Rubriques">
          <h3>Rubriques</h3>
          {categories?.length
            ? categories.slice(0, 6).map((c) => <Link key={c.category} href={`/rubrique/${encodeURIComponent(c.category)}`}>{c.category}</Link>)
            : <span className="ft-muted">Bientôt</span>}
        </nav>

        <div className="ft-col">
          <h3>Nous joindre</h3>
          <p className="ft-line"><MapPin size={15} /> {t("city")}</p>
          <a className="ft-line" href={`mailto:${t("contactEmail")}`}><Mail size={15} /> {t("contactEmail")}</a>
          <a className="ft-link-cta" href="/#contact">Proposer un sujet <ArrowUpRight size={14} /></a>
        </div>
      </div>

      <div className="ft-bottom">
        <div className="container">
          <span>© {new Date().getFullYear()} <a href="/admin" className="footer-admin-link">HÉBRON-IVOIRE.</a> TOUS DROITS RÉSERVÉS.</span>
          <span className="ft-tagline">Un regard qui rassemble <i>·</i> Une parole qui inspire</span>
          <a href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Retour en haut ↑</a>
        </div>
      </div>
      {t("footerNote") && <p className="demo-note">{t("footerNote")}</p>}
    </footer>
  );
}
