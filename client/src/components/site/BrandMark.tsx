import { Link } from "wouter";
import { BRAND } from "@shared/brand";
import { useSiteText } from "@/lib/useSiteText";

/** Official emblem + wordmark ("Impact" navy, "-nation" green, ".net" orange, as in the logo). */
export function BrandMark({ inverse = false }: { inverse?: boolean }) {
  const t = useSiteText();
  const [a, b, c] = BRAND.wordmark;
  return (
    <Link className={`bm ${inverse ? "bm-inverse" : ""}`} href="/" aria-label={`${BRAND.name}, accueil`}>
      <img className="bm-emblem" src="/brand/logo-emblem.png" alt="" width={110} height={56} />
      <span className="bm-text">
        <strong><b className="bm-a">{a}</b><b className="bm-b">{b}</b><b className="bm-c">{c}</b></strong>
        <small>{t("tagline")}</small>
      </span>
    </Link>
  );
}
