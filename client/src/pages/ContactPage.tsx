import { Mail, MapPin } from "lucide-react";
import { Link } from "wouter";
import { ContactForm } from "@/components/site/ContactForm";
import { SiteFooter, SiteHeader, useSiteText } from "@/components/site/SiteChrome";
import { useDocumentMeta } from "@/lib/seo";

export default function ContactPage() {
  const t = useSiteText();
  useDocumentMeta({
    title: "Contactez-nous — Cité d’Impact",
    description: t("contactText"),
  });

  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="np-static-page np-contact-page">
        <div className="container">
          <nav className="np-crumbs" aria-label="Fil d’Ariane">
            <Link href="/">Accueil</Link><span aria-hidden="true">/</span><span>Contact</span>
          </nav>
          <header className="np-static-heading">
            <span className="np-kicker-plain">Contactez-nous</span>
            <h1>{t("contactTitle")}</h1>
            <p>{t("contactText")}</p>
          </header>

          <div className="np-contact-layout">
            <aside className="np-contact-details" aria-label="Coordonnées de la rédaction">
              <h2>La rédaction</h2>
              <p>Une question ou une proposition de sujet ? Écrivez-nous, nous serons heureux de vous lire.</p>
              <a href={`mailto:${t("contactEmail")}`}><Mail size={18} aria-hidden="true" />{t("contactEmail")}</a>
              <span><MapPin size={18} aria-hidden="true" />{t("city")}</span>
            </aside>
            <ContactForm />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
