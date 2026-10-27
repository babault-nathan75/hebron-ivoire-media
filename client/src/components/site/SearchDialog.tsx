import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Search, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { timeAgo } from "@/lib/format";

export function SearchDialog({ onClose }: { onClose: () => void }) {
  const [value, setValue] = useState("");
  const [query, setQuery] = useState("");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => { input.current?.focus(); }, []);
  useEffect(() => {
    const t = window.setTimeout(() => setQuery(value.trim()), 250);
    return () => window.clearTimeout(t);
  }, [value]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const { data, isFetching } = trpc.content.search.useQuery({ q: query }, { enabled: query.length >= 2 });

  return (
    <div className="np-search" role="dialog" aria-modal="true" aria-label="Recherche" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="np-search-panel">
        <div className="np-search-field">
          <Search size={20} />
          <input ref={input} value={value} onChange={(e) => setValue(e.target.value)} placeholder="Rechercher un article, un sujet, un nom…" />
          <button onClick={onClose} aria-label="Fermer"><X size={20} /></button>
        </div>
        <div className="np-search-results">
          {query.length < 2 && <p className="np-search-hint">Saisissez au moins 2 lettres.</p>}
          {query.length >= 2 && isFetching && !data && <p className="np-search-hint">Recherche…</p>}
          {data && data.length === 0 && <p className="np-search-hint">Aucun résultat pour « {query} ».</p>}
          {data?.map((a) => (
            <Link key={a.id} href={`/article/${a.slug}`} onClick={onClose} className="np-search-item">
              {a.imageUrl ? <img src={a.imageUrl} alt="" /> : <span className="np-search-ph" />}
              <span>
                <small>{a.category} · {timeAgo(a.publishedAt ?? a.createdAt)}</small>
                <strong>{a.title}</strong>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
