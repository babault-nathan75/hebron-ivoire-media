import { useRef, useState } from "react";
import { useCloudinaryUpload } from "@/lib/cloudinary";
import { ArticleBody } from "@/components/site/ArticleBody";
import { Bold, Heading2, Heading3, Image as ImageIcon, Italic, Link2, List, ListOrdered, LoaderCircle, Paperclip, Quote } from "lucide-react";
import { toast } from "sonner";

type Props = { label: string; value: string; onChange: (value: string) => void; rows?: number; placeholder?: string; footer?: React.ReactNode };

/** Textarea with a formatting toolbar, media upload (image / audio / video) and a live preview. */
export function RichTextField({ label, value, onChange, rows = 16, placeholder, footer }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const files = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [busy, setBusy] = useState(false);
  const uploadFile = useCloudinaryUpload();

  function edit(fn: (selected: string) => { text: string; select?: [number, number] }) {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end } = el;
    const { text, select } = fn(value.slice(start, end));
    onChange(value.slice(0, start) + text + value.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      const [a, b] = select ?? [start + text.length, start + text.length];
      el.setSelectionRange(start + a, start + b);
    });
  }
  const wrap = (mark: string, fallback: string) => () => edit((s) => { const t = s || fallback; return { text: `${mark}${t}${mark}`, select: [mark.length, mark.length + t.length] }; });
  const linePrefix = (prefix: string, fallback: string) => () => edit((s) => { const t = (s || fallback).split("\n").map((l) => prefix + l).join("\n"); return { text: `\n\n${t}\n\n` }; });
  const numbered = () => edit((s) => ({ text: `\n\n${(s || "Élément").split("\n").map((l, i) => `${i + 1}. ${l}`).join("\n")}\n\n` }));
  const link = () => {
    const url = window.prompt("Adresse du lien (https://…)");
    if (url) edit((s) => ({ text: `[${s || "texte du lien"}](${url})` }));
  };
  const embed = () => {
    const url = window.prompt("Adresse d’une vidéo YouTube, d’une vidéo ou d’un audio (https://…)");
    if (url) edit(() => ({ text: `\n\n${url.trim()}\n\n` }));
  };

  async function upload(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      const { url, kind } = await uploadFile(file);
      edit(() => ({ text: kind === "image" ? `\n\n![Légende de l’image](${url})\n\n` : `\n\n${url}\n\n` }));
      toast.success(kind === "image" ? "Image insérée." : kind === "video" ? "Vidéo insérée." : "Audio inséré.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec du téléversement.");
    } finally {
      setBusy(false);
      if (files.current) files.current.value = "";
    }
  }

  const Btn = ({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) => (
    <button type="button" title={title} aria-label={title} onClick={onClick} disabled={tab === "preview"}>{children}</button>
  );

  return (
    <div className="adm-field">
      <span>{label}</span>
      <div className="rt">
        <div className="rt-bar">
          <Btn title="Intertitre" onClick={linePrefix("## ", "Intertitre")}><Heading2 size={16} /></Btn>
          <Btn title="Sous-titre" onClick={linePrefix("### ", "Sous-titre")}><Heading3 size={16} /></Btn>
          <Btn title="Gras" onClick={wrap("**", "texte")}><Bold size={16} /></Btn>
          <Btn title="Italique" onClick={wrap("*", "texte")}><Italic size={16} /></Btn>
          <Btn title="Citation" onClick={linePrefix("> ", "Citation")}><Quote size={16} /></Btn>
          <Btn title="Liste à puces" onClick={linePrefix("- ", "Élément")}><List size={16} /></Btn>
          <Btn title="Liste numérotée" onClick={numbered}><ListOrdered size={16} /></Btn>
          <Btn title="Lien" onClick={link}><Link2 size={16} /></Btn>
          <span className="rt-sep" />
          <Btn title="Téléverser une image, une vidéo ou un audio" onClick={() => files.current?.click()}>{busy ? <LoaderCircle className="spin" size={16} /> : <ImageIcon size={16} />}</Btn>
          <Btn title="Intégrer YouTube / un lien vidéo ou audio" onClick={embed}><Paperclip size={16} /></Btn>
          <div className="rt-tabs">
            <button type="button" className={tab === "write" ? "on" : ""} onClick={() => setTab("write")}>Écrire</button>
            <button type="button" className={tab === "preview" ? "on" : ""} onClick={() => setTab("preview")}>Aperçu</button>
          </div>
        </div>
        {tab === "write"
          ? <textarea ref={ref} className="adm-body" required minLength={10} maxLength={100000} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
          : <div className="rt-preview">{value.trim() ? <ArticleBody source={value} /> : <p className="adm-muted">Rien à prévisualiser pour l’instant.</p>}</div>}
        <input ref={files} type="file" accept="image/*,video/*,audio/*" hidden onChange={(e) => void upload(e.target.files?.[0])} />
      </div>
      {footer}
    </div>
  );
}
