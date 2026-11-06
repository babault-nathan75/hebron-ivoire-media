import { Link } from "wouter";
import { BRAND } from "@shared/brand";

/** Official full logo, including the wordmark and tagline. */
export function BrandMark() {
  return (
    <Link className="bm" href="/" aria-label={`${BRAND.name}, accueil`}>
      <img className="bm-logo" src="/brand/logo-full.png" alt="" width={1188} height={425} />
    </Link>
  );
}
