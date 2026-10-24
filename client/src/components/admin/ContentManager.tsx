import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { ImageField } from "@/components/ImageField";
import { RichTextField } from "@/components/admin/RichTextField";
import {
  Archive,
  ArrowLeft,
  CalendarDays,
  Eye,
  EyeOff,
  FileText,
  LoaderCircle,
  MapPin,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../../server/routers";

export const categories = ["Actualité", "Interview", "Reportage", "Témoignage", "Vie de foi", "Vie de Hébron-Ivoire"];
export type Status = "draft" | "published" | "archived";
export type Kind = "articles" | "events";

type ArticleForm = {
  id?: number; slug: string; title: string; category: string; excerpt: string; body: string;
  imageUrl: string; author: string; readMinutes: number; isFeatured: boolean; status: Status; publishAt: string;
};
type EventForm = {
  id?: number; slug: string; title: string; excerpt: string; details: string; imageUrl: string;
  location: string; startsAt: string; endsAt: string; status: Status;
};

const statusLabel: Record<Status, string> = { draft: "Brouillon", published: "Publié", archived: "Archivé" };
const toLocal = (date: Date | string | null) =>
  date ? new Date(new Date(date).getTime() - new Date(date).getTimezoneOffset() * 60_000).toISOString().slice(0, 16) : "";
const formatDate = (value: Date | string) =>
  new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
const slugify = (value: string) =>
  value.trim().toLocaleLowerCase("fr").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 191);
const readMinutes = (text: string) => Math.max(1, Math.round(text.trim().split(/\s+/).filter(Boolean).length / 200));

const emptyArticle = (): ArticleForm => ({ slug: "", title: "", category: categories[0], excerpt: "", body: "", imageUrl: "", author: "", readMinutes: 1, isFeatured: false, status: "draft", publishAt: "" });
const emptyEvent = (): EventForm => ({ slug: "", title: "", excerpt: "", details: "", imageUrl: "", location: "Abidjan, Côte d’Ivoire", startsAt: toLocal(new Date()), endsAt: "", status: "draft" });

function useInvalidate() {
  const utils = trpc.useUtils();
  return () => Promise.all([utils.content.editorialList.invalidate(), utils.content.listPublished.invalidate()]);
}

/** Warn before leaving with unsaved changes + Ctrl/Cmd+S to save. */
function useEditorShortcuts(dirty: boolean, save: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); save(); }
    };
    const onUnload = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onUnload);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("beforeunload", onUnload); };
  });
}

export function ContentManager({ kind, onKindChange }: { kind: Kind; onKindChange: (k: Kind) => void }) {
  const query = trpc.content.editorialList.useQuery(undefined, { retry: false });
  const invalidate = useInvalidate();
  const [editing, setEditing] = useState<{ article?: ArticleForm; event?: EventForm } | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Status | "all">("all");

  const done = (msg: string) => async () => { toast.success(msg); await invalidate(); };
  const fail = (e: { message: string }) => toast.error(e.message);
  const setArticleStatus = trpc.content.setArticleStatus.useMutation({ onSuccess: done("Statut mis à jour."), onError: fail });
  const setEventStatus = trpc.content.setEventStatus.useMutation({ onSuccess: done("Statut mis à jour."), onError: fail });
  const deleteArticle = trpc.content.deleteArticle.useMutation({ onSuccess: done("Article supprimé."), onError: fail });
  const deleteEvent = trpc.content.deleteEvent.useMutation({ onSuccess: done("Événement supprimé."), onError: fail });

  const items = useMemo(() => {
    const list = (kind === "articles" ? query.data?.articles : query.data?.events) ?? [];
    const q = search.trim().toLocaleLowerCase("fr");
    return list.filter((i) => (filter === "all" || i.status === filter) && (!q || `${i.title} ${i.excerpt}`.toLocaleLowerCase("fr").includes(q)));
  }, [query.data, kind, search, filter]);

  const total = (kind === "articles" ? query.data?.articles.length : query.data?.events.length) ?? 0;

  if (editing?.article) return <ArticleEditor initial={editing.article} onClose={() => setEditing(null)} />;
  if (editing?.event) return <EventEditor initial={editing.event} onClose={() => setEditing(null)} />;

  const create = () => setEditing(kind === "articles" ? { article: emptyArticle() } : { event: emptyEvent() });

  return (
    <div className="adm-stack">
      <div className="adm-head">
        <div>
          <h1>Publications</h1>
          <p>Créez, publiez et organisez les articles et les événements du média.</p>
        </div>
        <button className="adm-btn adm-btn-primary" onClick={create}><Plus size={16} /> {kind === "articles" ? "Nouvel article" : "Nouvel événement"}</button>
      </div>

      <div className="adm-card adm-list-card">
        <div className="adm-toolbar">
          <div className="adm-seg">
            <button className={kind === "articles" ? "on" : ""} onClick={() => onKindChange("articles")}><FileText size={14} /> Articles <span>{query.data?.articles.length ?? 0}</span></button>
            <button className={kind === "events" ? "on" : ""} onClick={() => onKindChange("events")}><CalendarDays size={14} /> Événements <span>{query.data?.events.length ?? 0}</span></button>
          </div>
          <label className="adm-search"><Search size={15} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un titre…" /></label>
          <div className="adm-chips">
            {(["all", "published", "draft", "archived"] as const).map((f) => (
              <button key={f} className={filter === f ? "on" : ""} onClick={() => setFilter(f)}>{f === "all" ? "Tous" : statusLabel[f]}</button>
            ))}
          </div>
        </div>

        {query.isLoading && <div className="adm-center"><LoaderCircle className="spin" /> Chargement…</div>}
        {query.error && <div className="adm-alert"><strong>La base ne répond pas.</strong> {query.error.message} <button onClick={() => query.refetch()}>Réessayer</button></div>}

        {!query.isLoading && !query.error && items.length === 0 && (
          <div className="adm-empty">
            <span>{kind === "articles" ? <FileText size={22} /> : <CalendarDays size={22} />}</span>
            <h3>{total === 0 ? (kind === "articles" ? "Aucun article pour l’instant" : "Aucun événement pour l’instant") : "Aucun résultat"}</h3>
            <p>{total === 0 ? "Commencez par créer votre première publication : elle apparaîtra sur le site dès qu’elle sera publiée." : "Essayez un autre mot-clé ou un autre filtre."}</p>
            {total === 0 && <button className="adm-btn adm-btn-primary" onClick={create}><Plus size={15} /> Créer</button>}
          </div>
        )}

        <ul className="adm-rows">
          {items.map((item) => {
            const isArticle = kind === "articles";
            const setStatus = (status: Status) => (isArticle ? setArticleStatus : setEventStatus).mutate({ id: item.id, status });
            return (
              <li key={item.id} className="adm-row">
                <div className="adm-thumb">{item.imageUrl ? <img src={item.imageUrl} alt="" loading="lazy" /> : isArticle ? <FileText size={18} /> : <CalendarDays size={18} />}</div>
                <div className="adm-row-main">
                  <div className="adm-meta">
                    <span className={`adm-pill s-${item.status}`}>{item.status === "published" && "publishedAt" in item && item.publishedAt && new Date(item.publishedAt) > new Date() ? `Programmé · ${formatDate(item.publishedAt)}` : statusLabel[item.status]}</span>
                    {"category" in item && <span>{item.category}</span>}
                    {"isFeatured" in item && item.isFeatured && <span className="adm-star"><Star size={11} /> À la une</span>}
                    {"location" in item && <span><MapPin size={11} /> {item.location}</span>}
                  </div>
                  <h3>{item.title}</h3>
                  <small>{"startsAt" in item ? `${formatDate(item.startsAt)} · ` : ""}Modifié le {formatDate(item.updatedAt)}</small>
                </div>
                <div className="adm-actions">
                  {item.status === "published"
                    ? <button className="adm-icon" title="Dépublier (repasser en brouillon)" onClick={() => setStatus("draft")}><EyeOff size={16} /></button>
                    : <button className="adm-icon adm-ok" title="Publier" onClick={() => setStatus("published")}><Eye size={16} /></button>}
                  <button className="adm-icon" title="Modifier" onClick={() => setEditing(isArticle ? { article: articleToForm(item as never) } : { event: eventToForm(item as never) })}><Pencil size={16} /></button>
                  {item.status === "archived"
                    ? <button className="adm-icon" title="Restaurer en brouillon" onClick={() => setStatus("draft")}><RotateCcw size={16} /></button>
                    : <button className="adm-icon" title="Archiver" onClick={() => setStatus("archived")}><Archive size={16} /></button>}
                  <button
                    className="adm-icon adm-danger"
                    title="Supprimer définitivement"
                    onClick={() => { if (window.confirm(`Supprimer définitivement « ${item.title} » ? Cette action est irréversible.`)) (isArticle ? deleteArticle : deleteEvent).mutate({ id: item.id }); }}
                  ><Trash2 size={16} /></button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

type Editorial = inferRouterOutputs<AppRouter>["content"]["editorialList"];
type ArticleRow = Editorial["articles"][number];
type EventRow = Editorial["events"][number];
const articleToForm = (a: ArticleRow): ArticleForm => ({ id: a.id, slug: a.slug, title: a.title, category: a.category, excerpt: a.excerpt, body: a.body, imageUrl: a.imageUrl ?? "", author: a.author ?? "", readMinutes: a.readMinutes, isFeatured: a.isFeatured, status: a.status, publishAt: toLocal(a.publishedAt) });
const eventToForm = (e: EventRow): EventForm => ({ id: e.id, slug: e.slug, title: e.title, excerpt: e.excerpt, details: e.details, imageUrl: e.imageUrl ?? "", location: e.location, startsAt: toLocal(e.startsAt), endsAt: toLocal(e.endsAt), status: e.status });

function EditorShell({ title, backLabel, dirty, saving, onBack, onSave, side, children }: {
  title: string; backLabel: string; dirty: boolean; saving: boolean; onBack: () => void; onSave: () => void; side: React.ReactNode; children: React.ReactNode;
}) {
  const back = () => { if (!dirty || window.confirm("Quitter sans enregistrer vos modifications ?")) onBack(); };
  return (
    <form className="adm-stack" onSubmit={(e) => { e.preventDefault(); onSave(); }}>
      <div className="adm-editor-bar">
        <button type="button" className="adm-btn adm-btn-ghost" onClick={back}><ArrowLeft size={16} /> {backLabel}</button>
        <span className="adm-editor-title">{title}{dirty && <i className="adm-dirty" title="Modifications non enregistrées" />}</span>
        <button className="adm-btn adm-btn-primary" disabled={saving}>{saving ? <LoaderCircle className="spin" size={15} /> : <Save size={15} />} Enregistrer <kbd>Ctrl S</kbd></button>
      </div>
      <div className="adm-editor-grid">
        <div className="adm-card adm-form">{children}</div>
        <aside className="adm-side">{side}</aside>
      </div>
    </form>
  );
}

const StatusPicker = ({ value, onChange }: { value: Status; onChange: (s: Status) => void }) => (
  <div className="adm-field">
    <span>Statut</span>
    <div className="adm-seg adm-seg-full">
      {(["draft", "published", "archived"] as const).map((s) => <button type="button" key={s} className={value === s ? "on" : ""} onClick={() => onChange(s)}>{statusLabel[s]}</button>)}
    </div>
    <small>{value === "published" ? "Visible sur le site dès l’enregistrement." : value === "draft" ? "Privé : visible uniquement par l’équipe." : "Retiré du site, conservé dans la base."}</small>
  </div>
);

function ArticleEditor({ initial, onClose }: { initial: ArticleForm; onClose: () => void }) {
  const invalidate = useInvalidate();
  const [form, setForm] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const save = trpc.content.saveArticle.useMutation({
    onSuccess: async (res) => {
      toast.success(form.status === "published" ? (form.publishAt && new Date(form.publishAt) > new Date() ? "Article programmé." : "Article publié.") : "Article enregistré.");
      await invalidate();
      setForm((f) => ({ ...f, id: res.id }));
      setSaved({ ...form, id: res.id });
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });
  const submit = () => {
    const when = form.publishAt ? new Date(form.publishAt) : null;
    if (when && Number.isNaN(when.getTime())) return void toast.error("Vérifiez la date de publication.");
    save.mutate({ ...form, id: form.id, publishAt: when ? when.toISOString() : null });
  };
  useEditorShortcuts(dirty, submit);
  const set = <K extends keyof ArticleForm>(k: K, v: ArticleForm[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <EditorShell title={form.id ? "Modifier l’article" : "Nouvel article"} backLabel="Articles" dirty={dirty} saving={save.isPending} onBack={onClose} onSave={submit}
      side={<>
        <div className="adm-card adm-form">
          <StatusPicker value={form.status} onChange={(s) => set("status", s)} />
          {form.status === "published" && (
            <label className="adm-field"><span>Date de publication</span><input type="datetime-local" value={form.publishAt} onChange={(e) => set("publishAt", e.target.value)} /><small>{form.publishAt && new Date(form.publishAt) > new Date() ? "Programmé : l’article apparaîtra à cette date." : "Laissez vide pour publier immédiatement."}</small></label>
          )}
          <label className="adm-field"><span>Rubrique</span><select value={form.category} onChange={(e) => set("category", e.target.value)}>{categories.map((c) => <option key={c}>{c}</option>)}</select></label>
          <label className="adm-check"><input type="checkbox" checked={form.isFeatured} onChange={(e) => set("isFeatured", e.target.checked)} /><Star size={14} /> Mettre à la une</label>
        </div>
        <div className="adm-card adm-form"><ImageField value={form.imageUrl} onChange={(u) => set("imageUrl", u)} /></div>
        <div className="adm-card adm-form">
          <label className="adm-field"><span>Auteur / signature</span><input maxLength={160} value={form.author} onChange={(e) => set("author", e.target.value)} placeholder="Nom de l’auteur" /></label>
          <label className="adm-field"><span>Adresse (slug)</span><input required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={191} value={form.slug} onChange={(e) => set("slug", slugify(e.target.value))} /><small>Générée à partir du titre.</small></label>
          <label className="adm-field"><span>Temps de lecture (min)</span><input type="number" min={1} max={180} value={form.readMinutes} onChange={(e) => set("readMinutes", Number(e.target.value))} /></label>
        </div>
      </>}>
      <label className="adm-field adm-title"><span>Titre</span><input required minLength={3} maxLength={300} value={form.title} placeholder="Le titre de votre récit" onChange={(e) => setForm((f) => ({ ...f, title: e.target.value, ...(f.id ? {} : { slug: slugify(e.target.value) }) }))} /></label>
      <label className="adm-field"><span>Résumé</span><textarea required minLength={10} maxLength={700} rows={3} value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} placeholder="Quelques lignes pour donner envie de lire…" /><small>{form.excerpt.length}/700</small></label>
      <RichTextField label="Texte de l’article" value={form.body} onChange={(body) => setForm((f) => ({ ...f, body, readMinutes: readMinutes(body) }))} placeholder="Écrivez ici… Séparez les paragraphes par une ligne vide. Utilisez la barre d’outils pour les intertitres, citations, images, vidéos et audios." footer={<small>{form.body.trim().split(/\s+/).filter(Boolean).length} mots · ≈ {form.readMinutes} min de lecture</small>} />
    </EditorShell>
  );
}

function EventEditor({ initial, onClose }: { initial: EventForm; onClose: () => void }) {
  const invalidate = useInvalidate();
  const [form, setForm] = useState(initial);
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const save = trpc.content.saveEvent.useMutation({
    onSuccess: async () => { toast.success(form.status === "published" ? "Événement publié." : "Événement enregistré."); await invalidate(); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const submit = () => {
    const startsAt = new Date(form.startsAt);
    const endsAt = form.endsAt ? new Date(form.endsAt) : null;
    if (Number.isNaN(startsAt.getTime()) || (endsAt && (Number.isNaN(endsAt.getTime()) || endsAt < startsAt))) return void toast.error("Vérifiez les dates de l’événement.");
    save.mutate({ ...form, id: form.id, startsAt: startsAt.toISOString(), endsAt: endsAt?.toISOString() ?? null });
  };
  useEditorShortcuts(dirty, submit);
  const set = <K extends keyof EventForm>(k: K, v: EventForm[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <EditorShell title={form.id ? "Modifier l’événement" : "Nouvel événement"} backLabel="Événements" dirty={dirty} saving={save.isPending} onBack={onClose} onSave={submit}
      side={<>
        <div className="adm-card adm-form"><StatusPicker value={form.status} onChange={(s) => set("status", s)} /></div>
        <div className="adm-card adm-form"><ImageField value={form.imageUrl} onChange={(u) => set("imageUrl", u)} /></div>
        <div className="adm-card adm-form"><label className="adm-field"><span>Adresse (slug)</span><input required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={191} value={form.slug} onChange={(e) => set("slug", slugify(e.target.value))} /></label></div>
      </>}>
      <label className="adm-field adm-title"><span>Titre</span><input required minLength={3} maxLength={300} value={form.title} placeholder="Nom de l’événement" onChange={(e) => setForm((f) => ({ ...f, title: e.target.value, ...(f.id ? {} : { slug: slugify(e.target.value) }) }))} /></label>
      <label className="adm-field"><span>Présentation courte</span><textarea required minLength={10} maxLength={700} rows={3} value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} /></label>
      <div className="adm-two">
        <label className="adm-field"><span>Début</span><input type="datetime-local" required value={form.startsAt} onChange={(e) => set("startsAt", e.target.value)} /></label>
        <label className="adm-field"><span>Fin (facultatif)</span><input type="datetime-local" min={form.startsAt} value={form.endsAt} onChange={(e) => set("endsAt", e.target.value)} /></label>
      </div>
      <label className="adm-field"><span>Lieu</span><input required maxLength={300} value={form.location} onChange={(e) => set("location", e.target.value)} /></label>
      <RichTextField label="Programme et informations pratiques" rows={10} value={form.details} onChange={(details) => set("details", details)} />
    </EditorShell>
  );
}
