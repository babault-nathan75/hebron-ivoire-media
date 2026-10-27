import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { ArrowDown, ArrowUp, Check, LoaderCircle, Pencil, Plus, Tags, Trash2, X } from "lucide-react";
import { toast } from "sonner";

export function RubriquesPanel() {
  const utils = trpc.useUtils();
  const list = trpc.categories.list.useQuery();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editing, setEditing] = useState<{ id: number; name: string; description: string } | null>(null);

  const refresh = () => Promise.all([utils.categories.list.invalidate(), utils.content.categories.invalidate(), utils.content.editorialList.invalidate(), utils.content.listPublished.invalidate()]);
  const fail = (e: { message: string }) => toast.error(e.message);
  const create = trpc.categories.create.useMutation({ onSuccess: async () => { toast.success("Rubrique créée."); setName(""); setDescription(""); await refresh(); }, onError: fail });
  const update = trpc.categories.update.useMutation({ onSuccess: async () => { toast.success("Rubrique modifiée."); setEditing(null); await refresh(); }, onError: fail });
  const move = trpc.categories.move.useMutation({ onSuccess: refresh, onError: fail });
  const remove = trpc.categories.remove.useMutation({ onSuccess: async () => { toast.success("Rubrique supprimée."); await refresh(); }, onError: fail });

  return (
    <div className="adm-stack">
      <div className="adm-head">
        <div><h1>Rubriques</h1><p>Les sections du journal (Société, Sport, Économie…). Elles apparaissent dans le menu et sur la page d’accueil dès qu’elles contiennent une publication.</p></div>
      </div>

      <form className="adm-card adm-form" onSubmit={(e) => { e.preventDefault(); create.mutate({ name, description }); }}>
        <div className="adm-grid">
          <label className="adm-field"><span>Nom de la nouvelle rubrique</span><input required minLength={2} maxLength={100} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Sport" /></label>
          <label className="adm-field"><span>Description (facultatif)</span><input maxLength={300} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Une phrase affichée en haut de la page de la rubrique" /></label>
        </div>
        <button className="adm-btn adm-btn-primary" style={{ justifySelf: "start" }} disabled={create.isPending}>{create.isPending ? <LoaderCircle className="spin" size={15} /> : <Plus size={16} />} Créer la rubrique</button>
      </form>

      <div className="adm-card adm-list-card">
        {list.isLoading && <div className="adm-center"><LoaderCircle className="spin" /> Chargement…</div>}
        <ul className="adm-rows">
          {list.data?.map((r, i) => (
            <li key={r.id} className="adm-row rub-row">
              <span className="rub-icon"><Tags size={17} /></span>
              {editing?.id === r.id ? (
                <form className="rub-edit" onSubmit={(e) => { e.preventDefault(); update.mutate(editing); }}>
                  <input autoFocus required minLength={2} maxLength={100} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                  <input maxLength={300} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="Description" />
                  <button className="adm-icon adm-ok" title="Enregistrer" disabled={update.isPending}><Check size={16} /></button>
                  <button type="button" className="adm-icon" title="Annuler" onClick={() => setEditing(null)}><X size={16} /></button>
                </form>
              ) : (
                <>
                  <div className="adm-row-main">
                    <h3>{r.name}</h3>
                    <small>/rubrique/{r.slug} · {r.count} publication{r.count > 1 ? "s" : ""}{r.description ? ` · ${r.description}` : ""}</small>
                  </div>
                  <div className="adm-actions">
                    <button className="adm-icon" title="Monter" disabled={i === 0} onClick={() => move.mutate({ id: r.id, direction: "up" })}><ArrowUp size={16} /></button>
                    <button className="adm-icon" title="Descendre" disabled={i === (list.data?.length ?? 1) - 1} onClick={() => move.mutate({ id: r.id, direction: "down" })}><ArrowDown size={16} /></button>
                    <button className="adm-icon" title="Renommer / modifier" onClick={() => setEditing({ id: r.id, name: r.name, description: r.description })}><Pencil size={16} /></button>
                    <button className="adm-icon adm-danger" title="Supprimer" onClick={() => { if (window.confirm(`Supprimer la rubrique « ${r.name} » ?`)) remove.mutate({ id: r.id }); }}><Trash2 size={16} /></button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
      <p className="adm-muted">L’ordre ci-dessus est celui du menu et de la page d’accueil. Renommer une rubrique met à jour toutes ses publications ; l’ancienne adresse de la rubrique n’existera plus. Une rubrique qui contient des publications ne peut pas être supprimée.</p>
    </div>
  );
}
