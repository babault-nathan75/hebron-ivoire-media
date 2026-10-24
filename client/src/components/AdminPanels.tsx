import { useEffect, useMemo, useState } from "react";
import { SITE_FIELDS } from "@shared/siteSettings";
import { trpc } from "@/lib/trpc";
import { Eye, EyeOff, LoaderCircle, Mail, Save, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

export function SiteSettingsPanel() {
  const utils = trpc.useUtils();
  const query = trpc.site.settings.useQuery();
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (query.data) setValues({ ...query.data });
  }, [query.data]);

  const save = trpc.site.saveSettings.useMutation({
    onSuccess: async () => {
      toast.success("Textes du site enregistrés.");
      await utils.site.settings.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const groups = useMemo(() => {
    const map = new Map<string, typeof SITE_FIELDS>();
    SITE_FIELDS.forEach((f) => map.set(f.group, [...(map.get(f.group) ?? []), f]));
    return Array.from(map.entries());
  }, []);

  if (query.isLoading) return <div className="editor-loading"><LoaderCircle className="spin" />Chargement…</div>;

  return (
    <form className="admin-panel" onSubmit={(e) => { e.preventDefault(); save.mutate({ values: Object.fromEntries(SITE_FIELDS.map((f) => [f.key, values[f.key] ?? ""])) }); }}>
      <div className="admin-panel-head">
        <div>
          <span className="editor-kicker">CONTENU DU SITE</span>
          <h2>Textes de la page publique</h2>
          <p>Laissez un champ vide pour garder le texte par défaut (affiché en grisé). Les articles et événements se gèrent dans « Publications ».</p>
        </div>
        <button className="editor-primary" type="submit" disabled={save.isPending}>
          {save.isPending ? <LoaderCircle className="spin" size={16} /> : <Save size={16} />} Enregistrer
        </button>
      </div>
      {groups.map(([group, fields]) => (
        <fieldset className="admin-card" key={group}>
          <legend>{group}</legend>
          <div className="admin-grid">
            {fields.map((f) => (
              <label key={f.key} className={f.multiline ? "admin-span" : ""}>
                <span>{f.label}</span>
                {f.multiline
                  ? <textarea rows={3} placeholder={f.default} value={values[f.key] ?? ""} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} />
                  : <input placeholder={f.default} value={values[f.key] ?? ""} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} />}
                {f.hint && <small>{f.hint}</small>}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
    </form>
  );
}

export function AdminsPanel({ currentEmail }: { currentEmail?: string | null }) {
  const utils = trpc.useUtils();
  const list = trpc.admins.list.useQuery();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);

  const add = trpc.admins.add.useMutation({
    onSuccess: async () => {
      toast.success("Administrateur ajouté.");
      setEmail("");
      setPassword("");
      await utils.admins.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const remove = trpc.admins.remove.useMutation({
    onSuccess: async () => {
      toast.success("Administrateur retiré.");
      await utils.admins.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="admin-panel">
      <div className="admin-panel-head">
        <div>
          <span className="editor-kicker">ÉQUIPE</span>
          <h2>Administrateurs</h2>
          <p>Un administrateur peut tout publier et modifier. Il se connecte avec son mot de passe, ou avec un code reçu par e-mail.</p>
        </div>
      </div>

      <form className="admin-card admin-add" onSubmit={(e) => { e.preventDefault(); add.mutate({ email, password: password || undefined }); }}>
        <div className="admin-grid">
          <label><span>E-mail du nouvel administrateur</span><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="prenom@exemple.com" /></label>
          <label>
            <span>Mot de passe initial (facultatif)</span>
            <div className="admin-pw">
              <input type={show ? "text" : "password"} minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Laisser vide pour une connexion par code" autoComplete="new-password" />
              <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Masquer" : "Afficher"}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>
          </label>
        </div>
        <button className="editor-primary" type="submit" disabled={add.isPending}>
          {add.isPending ? <LoaderCircle className="spin" size={16} /> : <UserPlus size={16} />} Ajouter l’administrateur
        </button>
      </form>

      <div className="admin-card">
        {list.isLoading && <div className="editor-loading"><LoaderCircle className="spin" /></div>}
        {list.data?.map((a) => (
          <div className="admin-person" key={a.email}>
            <span className="admin-avatar">{a.email[0].toUpperCase()}</span>
            <span className="admin-person-copy">
              <strong>{a.email}</strong>
              <small>{a.addedBy === "console" ? "Créé depuis la console" : `Ajouté par ${a.addedBy ?? "—"}`}</small>
            </span>
            {a.email === currentEmail
                ? <span className="admin-badge">Vous</span>
                : <button className="admin-remove" disabled={remove.isPending} onClick={() => { if (window.confirm(`Retirer ${a.email} ?`)) remove.mutate({ email: a.email }); }} aria-label={`Retirer ${a.email}`}><Trash2 size={15} /></button>}
          </div>
        ))}
        <p className="admin-note"><Mail size={13} /> Pour la connexion par code, les e-mails partent depuis l’adresse SMTP configurée.</p>
      </div>
    </div>
  );
}
