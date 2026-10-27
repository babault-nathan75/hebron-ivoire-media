import { useRef, useState } from "react";
import { useCloudinaryUpload } from "@/lib/cloudinary";
import { MediaEmbed, mediaType } from "@/components/site/MediaEmbed";
import { LoaderCircle, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

/** Video or podcast source: upload a file to Cloudinary, or paste a YouTube / file link. */
export function MediaField({ kind, value, poster, onChange }: { kind: "video" | "audio"; value: string; poster?: string; onChange: (url: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const uploadFile = useCloudinaryUpload();
  const label = kind === "video" ? "Vidéo" : "Fichier audio du podcast";

  async function upload(file?: File) {
    if (!file) return;
    if (!file.type.startsWith(kind === "video" ? "video/" : "audio/")) return void toast.error(kind === "video" ? "Choisissez un fichier vidéo." : "Choisissez un fichier audio (MP3, M4A, WAV…).");
    setBusy(true);
    try {
      const { url } = await uploadFile(file);
      onChange(url);
      toast.success(kind === "video" ? "Vidéo téléversée." : "Audio téléversé.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec du téléversement.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  const valid = value && mediaType(value);

  return (
    <div className="adm-field">
      <span>{label}</span>
      <div className="media-field">
        {valid ? <div className="media-preview"><MediaEmbed url={value} poster={poster} /></div> : (
          <button type="button" className="media-drop" onClick={() => input.current?.click()} disabled={busy}>
            {busy ? <LoaderCircle className="spin" size={22} /> : <Upload size={22} />}
            <strong>{busy ? "Téléversement en cours…" : kind === "video" ? "Téléverser une vidéo" : "Téléverser un fichier audio"}</strong>
            <small>{kind === "video" ? "MP4, WebM, MOV — 100 Mo maximum" : "MP3, M4A, WAV — 50 Mo maximum"}</small>
          </button>
        )}
        <div className="media-actions">
          <input ref={input} type="file" accept={kind === "video" ? "video/*" : "audio/*"} hidden onChange={(e) => void upload(e.target.files?.[0])} />
          {valid && <button type="button" className="adm-btn adm-btn-ghost" onClick={() => input.current?.click()} disabled={busy}>{busy ? <LoaderCircle className="spin" size={14} /> : <Upload size={14} />} Remplacer</button>}
          {value && <button type="button" className="adm-btn adm-btn-ghost" onClick={() => onChange("")}><Trash2 size={14} /> Retirer</button>}
        </div>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value.trim())}
          placeholder={kind === "video" ? "… ou collez un lien YouTube (https://youtu.be/…) ou un fichier .mp4" : "… ou collez le lien d’un fichier audio (.mp3)"}
          maxLength={2000}
        />
        {value && !valid && <small className="media-warn">Ce lien n’est pas reconnu : utilisez un lien YouTube ou l’adresse directe d’un fichier {kind === "video" ? ".mp4 / .webm" : ".mp3 / .m4a"}.</small>}
      </div>
    </div>
  );
}
