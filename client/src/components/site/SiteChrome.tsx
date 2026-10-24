import { useState } from "react";
import { Link, useLocation } from "wouter";
import { SITE_DEFAULTS } from "@shared/siteSettings";
import { trpc } from "@/lib/trpc";
import { ArrowUpRight, LoaderCircle, Mail, MapPin, Menu, Search, X } from "lucide-react";
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
      <header className="site-header is-scrolled">
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
  if (done) return <p className="subscribe-done">Merci ! Vous êtes inscrit(e) aux nouveautés.</p>;
  return (
    <form className="subscribe" onSubmit={(e) => { e.preventDefault(); subscribe.mutate({ email, website }); }}>
      <span className="footer-label">RECEVOIR LES NOUVEAUTÉS</span>
      <div>
        <input type="email" required maxLength={320} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Votre adresse e-mail" aria-label="Adresse e-mail" />
        <input className="hp-field" tabIndex={-1} autoComplete="off" aria-hidden="true" value={website} onChange={(e) => setWebsite(e.target.value)} />
        <button disabled={subscribe.isPending} aria-label="S’abonner">{subscribe.isPending ? <LoaderCircle className="spin" size={15} /> : <ArrowUpRight size={16} />}</button>
      </div>
    </form>
  );
}

export function SiteFooter() {
  const t = useSiteText();
  const { data: content } = trpc.content.listPublished.useQuery(undefined, { staleTime: 30_000 });
  const has = (name: string) => content?.articles.some((a) => a.category.toLocaleLowerCase("fr") === name);
  const links = (items: [string, string, boolean][]) => items.filter(([, , show]) => show).map(([label, href]) => <a key={label} href={href}>{label}</a>);
  const any = Boolean(content?.articles.length);
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div className="footer-brand-col">
          <BrandMark inverse />
          <p>{t("footerAbout")}</p>
          <div className="footer-socials" aria-label="Réseaux sociaux">
            <a href={t("facebookUrl")} aria-label="Facebook" target="_blank" rel="noopener noreferrer"><span>f</span></a>
            <a href={t("instagramUrl")} aria-label="Instagram" target="_blank" rel="noopener noreferrer"><span>ig</span></a>
            <a href={t("youtubeUrl")} aria-label="YouTube" target="_blank" rel="noopener noreferrer"><span>▶</span></a>
          </div>
        </div>
        <div className="footer-links">
          <span className="footer-label">EXPLORER</span>
          {links([
            ["Toute l’actualité", "/actualites", any],
            ["Événements", "/#evenements", Boolean(content?.events.length)],
            ["Interviews", "/rubrique/Interview", Boolean(has("interview"))],
            ["Reportages", "/rubrique/Reportage", Boolean(has("reportage"))],
          ])}
        </div>
        <div className="footer-links">
          <span className="footer-label">LES RENDEZ-VOUS</span>
          {links([
            ["Témoignages", "/rubrique/T%C3%A9moignage", Boolean(has("témoignage"))],
            ["Vie de Hébron-Ivoire", "/rubrique/Vie%20de%20H%C3%A9bron-Ivoire", Boolean(has("vie de hébron-ivoire"))],
            ["Proposer un sujet", "/#contact", true],
          ])}
        </div>
        <div className="footer-contact">
          <span className="footer-label">RESTONS EN LIEN</span>
          <p><MapPin size={15} /> {t("city")}</p>
          <a href={`mailto:${t("contactEmail")}`}><Mail size={15} /> {t("contactEmail")}</a>
          <SubscribeForm />
        </div>
      </div>
      <div className="container footer-bottom"><span>© {new Date().getFullYear()} <a href="/admin" className="footer-admin-link">HÉBRON-IVOIRE.</a> TOUS DROITS RÉSERVÉS.</span><span>Un regard qui rassemble <i>·</i> Une parole qui inspire</span><a href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Retour en haut ↑</a></div>
      {t("footerNote") && <p className="demo-note">{t("footerNote")}</p>}
    </footer>
  );
}
