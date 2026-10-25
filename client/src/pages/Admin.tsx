import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import AdminLogin from "@/components/AdminLogin";
import { AdminsPanel, SiteSettingsPanel } from "@/components/AdminPanels";
import { ContentManager, type Kind } from "@/components/admin/ContentManager";
import { Dashboard } from "@/components/admin/Dashboard";
import { Guide } from "@/components/admin/Guide";
import { MessagesPanel } from "@/components/admin/MessagesPanel";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Sparkles,
  Eye,
  EyeOff,
  Inbox,
  FileText,
  KeyRound,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Newspaper,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

type Section = "dashboard" | "content" | "messages" | "site" | "admins" | "guide";

const NAV: { id: Section; label: string; icon: typeof FileText }[] = [
  { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { id: "content", label: "Publications", icon: FileText },
  { id: "messages", label: "Messages", icon: Inbox },
  { id: "site", label: "Contenu du site", icon: SlidersHorizontal },
  { id: "admins", label: "Administrateurs", icon: ShieldCheck },
  { id: "guide", label: "Guide", icon: BookOpen },
];

function WelcomeDialog({ name, onGuide, onClose }: { name: string; onGuide: () => void; onClose: () => void }) {
  const steps = [
    ["Publications", "Écrivez des articles et créez des événements, en brouillon ou publiés."],
    ["Contenu du site", "Modifiez les textes fixes et les liens des réseaux sociaux."],
    ["Messages", "Lisez les messages des visiteurs et la liste des abonnés."],
    ["Administrateurs", "Invitez ou retirez des membres de l’équipe."],
  ];
  return (
    <div className="adm-modal" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <div className="adm-card adm-modal-card adm-welcome">
        <span className="adm-welcome-icon"><Sparkles size={22} /></span>
        <h2 id="welcome-title">Bienvenue{name ? `, ${name}` : ""} !</h2>
        <p>Voici votre espace rédaction. En un coup d’œil, voici à quoi sert chaque section :</p>
        <ul className="adm-welcome-list">
          {steps.map(([title, text]) => <li key={title}><strong>{title}</strong><span>{text}</span></li>)}
        </ul>
        <p>Un <strong>guide complet</strong> est disponible à tout moment dans le menu (« Guide »). Il explique chaque fonction pas à pas.</p>
        <div className="adm-modal-actions">
          <button className="adm-btn adm-btn-ghost" onClick={onClose}>Plus tard</button>
          <button className="adm-btn adm-btn-primary" onClick={onGuide}><BookOpen size={15} /> Lire le guide</button>
        </div>
      </div>
    </div>
  );
}

function PasswordDialog({ onClose }: { onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const mutation = trpc.auth.setPassword.useMutation({
    onSuccess: () => { toast.success("Mot de passe enregistré."); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  return (
    <div className="adm-modal" role="dialog" aria-modal="true" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form className="adm-card adm-modal-card" onSubmit={(e) => { e.preventDefault(); mutation.mutate({ password }); }}>
        <div className="adm-modal-head"><h2>Mon mot de passe</h2><button type="button" className="adm-icon" onClick={onClose} aria-label="Fermer"><X size={16} /></button></div>
        <p>Définissez ou changez votre mot de passe. Vous pourrez toujours vous connecter par code e-mail.</p>
        <label className="adm-field">
          <span>Nouveau mot de passe</span>
          <div className="admin-pw">
            <input autoFocus type={show ? "text" : "password"} required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8 caractères minimum" autoComplete="new-password" />
            <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Masquer" : "Afficher"}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
          </div>
        </label>
        <div className="adm-modal-actions">
          <button type="button" className="adm-btn adm-btn-ghost" onClick={onClose}>Annuler</button>
          <button className="adm-btn adm-btn-primary" disabled={mutation.isPending}>{mutation.isPending && <LoaderCircle className="spin" size={15} />} Enregistrer</button>
        </div>
      </form>
    </div>
  );
}

export default function Admin() {
  const { user, loading, logout } = useAuth();
  const [section, setSection] = useState<Section>("dashboard");
  const [kind, setKind] = useState<Kind>("articles");
  const [passwordOpen, setPasswordOpen] = useState(false);
  const utils = trpc.useUtils();
  const onboarding = trpc.admins.onboarding.useQuery(undefined, { enabled: user?.role === "admin", retry: false });
  const completeOnboarding = trpc.admins.completeOnboarding.useMutation({ onSuccess: () => utils.admins.onboarding.invalidate() });
  const unread = trpc.contact.unread.useQuery(undefined, { enabled: user?.role === "admin", refetchInterval: 60_000 });

  if (loading) return <div className="editor-loading"><LoaderCircle className="spin" />Chargement de l’espace rédaction…</div>;

  if (!user) {
    return (
      <div className="editor-gate">
        <div className="editor-gate-mark"><Newspaper size={25} /></div>
        <span className="editor-kicker">ESPACE ÉDITORIAL</span>
        <h1>Réservé à la rédaction.</h1>
        <p>Connectez-vous avec un compte administrateur pour gérer les contenus du média.</p>
        <AdminLogin />
        <Link className="editor-back-link" href="/">Retour au média <ArrowLeft size={15} /></Link>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="editor-gate">
        <div className="editor-gate-mark"><X size={24} /></div>
        <span className="editor-kicker">ACCÈS LIMITÉ</span>
        <h1>Espace rédaction.</h1>
        <p>Ce compte n’a pas les droits administrateur nécessaires pour modifier les contenus du média.</p>
        <button className="editor-secondary" onClick={() => void logout()}>Se déconnecter <LogOut size={15} /></button>
        <Link className="editor-back-link" href="/">Retour au média <ArrowLeft size={15} /></Link>
      </div>
    );
  }

  const go = (s: Section, k?: Kind) => { setSection(s); if (k) setKind(k); };
  const initial = (user.name || user.email || "A")[0].toUpperCase();

  return (
    <div className="adm-shell">
      <aside className="adm-sidebar">
        <Link className="adm-brand" href="/"><span><Newspaper size={18} /></span><strong>HÉBRON · IVOIRE<small>Espace rédaction</small></strong></Link>
        <nav aria-label="Navigation de l’espace rédaction">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button key={id} className={section === id ? "on" : ""} onClick={() => go(id)}><Icon size={17} /><span>{label}</span>{id === "messages" && (unread.data ?? 0) > 0 && <b className="adm-badge">{unread.data}</b>}</button>
          ))}
        </nav>
        <div className="adm-sidebar-foot">
          <Link className="adm-view-site" href="/">Voir le média <ArrowUpRight size={14} /></Link>
          <div className="adm-user">
            <span className="adm-avatar">{initial}</span>
            <span className="adm-user-copy"><strong>{user.name || "Administrateur"}</strong><small>{user.email}</small></span>
          </div>
          <div className="adm-user-actions">
            <button onClick={() => setPasswordOpen(true)}><KeyRound size={14} /> Mot de passe</button>
            <button onClick={() => void logout()}><LogOut size={14} /> Quitter</button>
          </div>
        </div>
      </aside>

      <main className="adm-main">
        {section === "dashboard" && <Dashboard onNavigate={go} />}
        {section === "guide" && <Guide onNavigate={go} />}
        {section === "content" && <ContentManager kind={kind} onKindChange={setKind} />}
        {section === "messages" && <MessagesPanel />}
        {section === "site" && <SiteSettingsPanel />}
        {section === "admins" && <AdminsPanel currentEmail={user.email} />}
      </main>

      {passwordOpen && <PasswordDialog onClose={() => setPasswordOpen(false)} />}
      {onboarding.data && !onboarding.data.seen && !completeOnboarding.isPending && (
        <WelcomeDialog
          name={user.name && user.name !== user.email ? user.name : ""}
          onClose={() => completeOnboarding.mutate()}
          onGuide={() => { completeOnboarding.mutate(); setSection("guide"); }}
        />
      )}
    </div>
  );
}
