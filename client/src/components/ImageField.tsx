import { useRef, useState } from "react";
import { useCloudinaryUpload } from "@/lib/cloudinary";
import { ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function ImageField({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const uploadFile = useCloudinaryUpload();

  async function upload(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return void toast.error("Choisissez un fichier image.");
    setBusy(true);
    try {
      const { url } = await uploadFile(file);
      onChange(url);
      toast.success("Image téléversée.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec du téléversement.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="image-field">
      <span className="image-field-label">Image de couverture</span>
      <div
        className={`image-drop ${dragging ? "is-dragging" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); void upload(e.dataTransfer.files?.[0]); }}
      >
        {value ? (
          <img src={value} alt="" />
        ) : (
          <button type="button" className="image-drop-empty" onClick={() => input.current?.click()}>
            {busy ? <LoaderCircle className="spin" size={22} /> : <ImagePlus size={22} />}
            <strong>{busy ? "Téléversement…" : "Ajouter une image"}</strong>
            <small>Glissez-déposez ou cliquez · JPG, PNG, WebP</small>
          </button>
        )}
        {value && (
          <div className="image-drop-actions">
            <button type="button" onClick={() => input.current?.click()} disabled={busy}>{busy ? <LoaderCircle className="spin" size={14} /> : <ImagePlus size={14} />} Remplacer</button>
            <button type="button" onClick={() => onChange("")}><Trash2 size={14} /> Retirer</button>
          </div>
        )}
        <input ref={input} type="file" accept="image/*" hidden onChange={(e) => void upload(e.target.files?.[0])} />
      </div>
    </div>
  );
}
