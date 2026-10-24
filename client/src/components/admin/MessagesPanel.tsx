import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Download, Inbox, LoaderCircle, Mail, MailOpen, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

const fmt = (d: Date | string) =>
  new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(d));

export function MessagesPanel() {
  const utils = trpc.useUtils();
  const [tab, setTab] = useState<"messages" | "subscribers">("messages");
  const messages = trpc.contact.messages.useQuery();
  const subscribers = trpc.contact.subscribers.useQuery();
  const [open, setOpen] = useState<number | null>(null);
  const refresh = () => Promise.all([utils.contact.messages.invalidate(), utils.contact.unread.invalidate(), utils.contact.subscribers.invalidate()]);
  const fail = (e: { message: string }) => toast.error(e.message);
  const markRead = trpc.contact.markRead.useMutation({ onSuccess: refresh, onError: fail });
  const removeMessage = trpc.contact.removeMessage.useMutation({ onSuccess: async () => { toast.success("Message supprimé."); await refresh(); }, onError: fail });
  const removeSubscriber = trpc.contact.removeSubscriber.useMutation({ onSuccess: async () => { toast.success("Abonné supprimé."); await refresh(); }, onError: fail });

  const exportCsv = () => {
    const rows = ["email,inscrit_le", ...(subscribers.data ?? []).map((s) => `${s.email},${new Date(s.createdAt).toISOString()}`)];
    const url = URL.createObjectURL(new Blob([rows.join("\n")], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "abonnes.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const unread = messages.data?.filter((m) => !m.readAt).length ?? 0;

  return (
    <div className="adm-stack">
      <div className="adm-head">
        <div><h1>Messages</h1><p>Les messages envoyés depuis le formulaire de contact et les personnes abonnées aux nouveautés.</p></div>
        {tab === "subscribers" && (subscribers.data?.length ?? 0) > 0 && <button className="adm-btn adm-btn-ghost" onClick={exportCsv}><Download size={15} /> Exporter en CSV</button>}
      </div>

      <div className="adm-card adm-list-card">
        <div className="adm-toolbar">
          <div className="adm-seg">
            <button className={tab === "messages" ? "on" : ""} onClick={() => setTab("messages")}><Inbox size={14} /> Messages <span>{unread > 0 ? `${unread} nouveau${unread > 1 ? "x" : ""}` : messages.data?.length ?? 0}</span></button>
            <button className={tab === "subscribers" ? "on" : ""} onClick={() => setTab("subscribers")}><Users size={14} /> Abonnés <span>{subscribers.data?.length ?? 0}</span></button>
          </div>
        </div>

        {tab === "messages" && (
          <>
            {messages.isLoading && <div className="adm-center"><LoaderCircle className="spin" /> Chargement…</div>}
            {messages.data?.length === 0 && <div className="adm-empty"><span><Inbox size={22} /></span><h3>Aucun message</h3><p>Les messages du formulaire de contact apparaîtront ici.</p></div>}
            <ul className="adm-rows">
              {messages.data?.map((m) => (
                <li key={m.id} className={`msg ${m.readAt ? "" : "unread"}`}>
                  <button className="msg-head" onClick={() => { setOpen(open === m.id ? null : m.id); if (!m.readAt) markRead.mutate({ id: m.id, read: true }); }}>
                    <span className="msg-dot" />
                    <span className="msg-from"><strong>{m.name}</strong><small>{m.email}</small></span>
                    <span className="msg-preview">{m.message}</span>
                    <time>{fmt(m.createdAt)}</time>
                  </button>
                  {open === m.id && (
                    <div className="msg-body">
                      <p>{m.message}</p>
                      <div className="adm-actions">
                        <a className="adm-btn adm-btn-primary" href={`mailto:${m.email}?subject=${encodeURIComponent("Re: votre message à Hébron-Ivoire")}`}><Mail size={15} /> Répondre</a>
                        <button className="adm-btn adm-btn-ghost" onClick={() => markRead.mutate({ id: m.id, read: !m.readAt })}><MailOpen size={15} /> {m.readAt ? "Marquer non lu" : "Marquer lu"}</button>
                        <button className="adm-icon adm-danger" title="Supprimer" onClick={() => { if (window.confirm("Supprimer ce message ?")) removeMessage.mutate({ id: m.id }); }}><Trash2 size={16} /></button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}

        {tab === "subscribers" && (
          <>
            {subscribers.data?.length === 0 && <div className="adm-empty"><span><Users size={22} /></span><h3>Aucun abonné</h3><p>Les adresses saisies dans le pied de page du site apparaîtront ici.</p></div>}
            <ul className="adm-rows">
              {subscribers.data?.map((s) => (
                <li key={s.id} className="adm-row">
                  <span className="admin-avatar" style={{ display: "grid", placeItems: "center", width: 36, height: 36, borderRadius: "50%", background: "var(--sage)", color: "var(--forest)", fontWeight: 700 }}>{s.email[0].toUpperCase()}</span>
                  <div className="adm-row-main"><h3>{s.email}</h3><small>Inscrit le {fmt(s.createdAt)}</small></div>
                  <button className="adm-icon adm-danger" title="Supprimer" onClick={() => { if (window.confirm(`Supprimer ${s.email} ?`)) removeSubscriber.mutate({ id: s.id }); }}><Trash2 size={16} /></button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
