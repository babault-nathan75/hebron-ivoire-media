import { Link } from "wouter";

export function BrandMark({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link className={`brand ${inverse ? "brand-inverse" : ""}`} href="/" aria-label="Hébron-Ivoire, accueil">
      <span className="brand-symbol" aria-hidden="true">
        <svg viewBox="0 0 48 48" fill="none">
          <path d="M24 5.5c10.2 0 18.5 8.3 18.5 18.5S34.2 42.5 24 42.5 5.5 34.2 5.5 24 13.8 5.5 24 5.5Z" stroke="currentColor" strokeWidth="1.5" />
          <path d="M24 12v24M16.5 19.5h15" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M11.5 34.5c4.4-1 8.6-1 12.5 0 4-1 8.2-1 12.5 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="36.7" cy="11.4" r="3.1" fill="#E88A49" />
        </svg>
      </span>
      <span className="brand-copy"><strong>HÉBRON<span>·</span>IVOIRE</strong><small>Le média qui inspire</small></span>
    </Link>
  );
}
