import { ArrowRight, BookOpen, Eye, Hammer } from "lucide-react";
import { Link } from "wouter";
import { SiteFooter, SiteHeader, useSiteText } from "@/components/site/SiteChrome";
import { useDocumentMeta } from "@/lib/seo";

export default function AboutPage() {
  const t = useSiteText();
  useDocumentMeta({
    title: `${t("aboutTitle")} — Cité d’Impact`,
    description: t("aboutDescription"),
  });

  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="np-static-page np-about-page">
        <div className="container">
          <nav className="np-crumbs" aria-label="Fil d’Ariane">
            <Link href="/">Accueil</Link><span aria-hidden="true">/</span><span>{t("aboutBreadcrumb")}</span>
          </nav>
          <header className="np-static-heading">
            <span className="np-kicker-plain">{t("aboutEyebrow")}</span>
            <h1>{t("aboutTitle")}</h1>
            <p>{t("aboutSubtitle")}</p>
          </header>

          <section className="np-about-intro">
            <h2>{t("aboutIntroTitle")}</h2>
            <p>{t("aboutIntroText")}</p>
            <p>{t("aboutIntroText2")}</p>
          </section>

          <section className="np-about-values" aria-label={t("aboutValuesLabel")}>
            <article>
              <Eye size={22} aria-hidden="true" />
              <h2>{t("aboutValue1Title")}</h2>
              <p>{t("aboutValue1Text")}</p>
            </article>
            <article>
              <BookOpen size={22} aria-hidden="true" />
              <h2>{t("aboutValue2Title")}</h2>
              <p>{t("aboutValue2Text")}</p>
            </article>
            <article>
              <Hammer size={22} aria-hidden="true" />
              <h2>{t("aboutValue3Title")}</h2>
              <p>{t("aboutValue3Text")}</p>
            </article>
          </section>

          <Link className="np-about-contact" href="/contact">
            {t("aboutContactLabel")} <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
