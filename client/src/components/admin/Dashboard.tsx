import { trpc } from "@/lib/trpc";
import { AlertTriangle, ArrowRight, CalendarDays, CheckCircle2, FileText, LoaderCircle, Plus, Send, Pencil } from "lucide-react";

type Props = { onNavigate: (section: "content" | "messages" | "site" | "admins", kind?: "articles" | "events") => void };

const formatDate = (value: Date | string) =>
  new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(new Date(value));

export function Dashboard({ onNavigate }: Props) {
  const content = trpc.content.editorialList.useQuery(undefined, { retry: false });
  const setup = trpc.site.setup.useQuery();
  const unread = trpc.contact.unread.useQuery();
  const articles = content.data?.articles ?? [];
  const events = content.data?.events ?? [];
  const now = Date.now();

  const stats = [
    { label: "Articles publiés", value: articles.filter((a) => a.status === "published").length, icon: Send, go: () => onNavigate("content", "articles") },
    { label: "Brouillons", value: articles.filter((a) => a.status === "draft").length + events.filter((e) => e.status === "draft").length, icon: Pencil, go: () => onNavigate("content", "articles") },
    { label: "Événements à venir", value: events.filter((e) => e.status === "published" && new Date(e.startsAt).getTime() >= now).length, icon: CalendarDays, go: () => onNavigate("content", "events") },
    { label: "Total contenus", value: articles.length + events.length, icon: FileText, go: () => onNavigate("content", "articles") },
  ];

  const recent = [
    ...articles.map((a) => ({ id: `a${a.id}`, title: a.title, status: a.status, kind: "Article", at: a.updatedAt })),
    ...events.map((e) => ({ id: `e${e.id}`, title: e.title, status: e.status, kind: "Événement", at: e.updatedAt })),
  ].sort((x, y) => new Date(y.at).getTime() - new Date(x.at).getTime()).slice(0, 6);

  const todo = [
    (unread.data ?? 0) > 0 && { text: `${unread.data} nouveau${(unread.data ?? 0) > 1 ? "x" : ""} message${(unread.data ?? 0) > 1 ? "s" : ""} à lire.`, hint: "Ouvrez l’onglet Messages pour répondre." },
    setup.data && !setup.data.cloudinary && { text: "Cloudinary n’est pas configuré : le téléversement d’images est désactivé.", hint: "Renseignez CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY et CLOUDINARY_API_SECRET dans .env." },
    setup.data && !setup.data.email && { text: "L’envoi d’e-mails n’est pas configuré : les codes de connexion s’affichent seulement dans la console.", hint: "Renseignez EMAIL_SERVER_* dans .env." },
    !content.isLoading && articles.filter((a) => a.status === "published").length === 0 && { text: "Aucun article publié : la page d’accueil affiche un message « bientôt ».", hint: "Créez et publiez votre premier article." },
  ].filter(Boolean) as { text: string; hint: string }[];

  return (
    <div className="adm-stack">
      <div className="adm-head">
        <div><h1>Tableau de bord</h1><p>Un aperçu de l’activité du média et des actions à mener.</p></div>
        <div className="adm-head-actions">
          <button className="adm-btn adm-btn-primary" onClick={() => onNavigate("content", "articles")}><Plus size={16} /> Nouvel article</button>
        </div>
      </div>

      {content.isLoading && <div className="adm-center"><LoaderCircle className="spin" /> Chargement…</div>}

      <div className="adm-stats">
        {stats.map(({ label, value, icon: Icon, go }) => (
          <button className="adm-card adm-stat" key={label} onClick={go}>
            <span className="adm-stat-icon"><Icon size={18} /></span>
            <strong>{value}</strong>
            <small>{label}</small>
          </button>
        ))}
      </div>

      <div className="adm-dash-grid">
        <section className="adm-card">
          <div className="adm-card-head"><h2>Activité récente</h2><button className="adm-link" onClick={() => onNavigate("content", "articles")}>Tout voir <ArrowRight size={14} /></button></div>
          {recent.length === 0 && <p className="adm-muted">Rien pour l’instant.</p>}
          <ul className="adm-recent">
            {recent.map((r) => (
              <li key={r.id}>
                <span className={`adm-dot s-${r.status}`} />
                <span className="adm-recent-copy"><strong>{r.title}</strong><small>{r.kind} · {formatDate(r.at)}</small></span>
                <span className={`adm-pill s-${r.status}`}>{r.status === "published" ? "Publié" : r.status === "draft" ? "Brouillon" : "Archivé"}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="adm-card">
          <div className="adm-card-head"><h2>À faire</h2></div>
          {todo.length === 0 && <p className="adm-ok"><CheckCircle2 size={16} /> Tout est en place.</p>}
          <ul className="adm-todo">
            {todo.map((t) => (
              <li key={t.text}><AlertTriangle size={16} /><span><strong>{t.text}</strong><small>{t.hint}</small></span></li>
            ))}
          </ul>
          <div className="adm-quick">
            <button onClick={() => onNavigate("content", "events")}><CalendarDays size={15} /> Nouvel événement</button>
            <button onClick={() => onNavigate("site")}><FileText size={15} /> Modifier les textes du site</button>
            <button onClick={() => onNavigate("admins")}><Plus size={15} /> Ajouter un administrateur</button>
          </div>
        </section>
      </div>
    </div>
  );
}
