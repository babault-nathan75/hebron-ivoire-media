import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Check, LoaderCircle, Send } from "lucide-react";
import { toast } from "sonner";

export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "", website: "" });
  const [sent, setSent] = useState(false);
  const send = trpc.contact.send.useMutation({
    onSuccess: () => { setSent(true); setForm({ name: "", email: "", message: "", website: "" }); },
    onError: (e) => toast.error(e.message),
  });

  if (sent) {
    return (
      <div className="contact-form contact-sent" role="status">
        <span><Check size={22} /></span>
        <h3>Message envoyé</h3>
        <p>Merci ! La rédaction vous répondra très vite.</p>
        <button type="button" onClick={() => setSent(false)}>Écrire un autre message</button>
      </div>
    );
  }
  return (
    <form className="contact-form" onSubmit={(e) => { e.preventDefault(); send.mutate(form); }}>
      <div className="contact-form-row">
        <label><span>Votre nom</span><input required minLength={2} maxLength={160} autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Prénom Nom" /></label>
        <label><span>Votre e-mail</span><input required type="email" maxLength={320} autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="vous@exemple.com" /></label>
      </div>
      <label><span>Votre message</span><textarea required minLength={10} maxLength={5000} rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Proposez un sujet, partagez un témoignage, posez une question…" /></label>
      <input className="hp-field" tabIndex={-1} autoComplete="off" aria-hidden="true" name="website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
      <button className="contact-submit" disabled={send.isPending}>{send.isPending ? <LoaderCircle className="spin" size={16} /> : <Send size={16} />} Envoyer à la rédaction</button>
    </form>
  );
}
