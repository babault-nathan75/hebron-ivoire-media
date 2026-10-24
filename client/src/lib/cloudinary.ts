import { trpc } from "@/lib/trpc";

export type MediaKind = "image" | "video" | "audio";

const LIMITS: Record<MediaKind, number> = { image: 10, video: 100, audio: 50 };

/** Ask Cloudinary to serve an optimised format/quality of an uploaded image. */
export const optimiseImage = (url: string) => url.replace("/upload/", "/upload/f_auto,q_auto,w_1600,c_limit/");

export function kindOf(file: File): MediaKind | null {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  return null;
}

/** Signed direct upload (the API secret never leaves the server). Cloudinary stores audio under the "video" resource type. */
export function useCloudinaryUpload() {
  const sign = trpc.media.sign.useMutation();
  return async function upload(file: File): Promise<{ url: string; kind: MediaKind }> {
    const kind = kindOf(file);
    if (!kind) throw new Error("Format non pris en charge (image, vidéo ou audio).");
    if (file.size > LIMITS[kind] * 1024 * 1024) throw new Error(`Fichier trop lourd (${LIMITS[kind]} Mo maximum).`);
    const s = await sign.mutateAsync();
    const body = new FormData();
    body.append("file", file);
    body.append("api_key", s.apiKey);
    body.append("timestamp", String(s.timestamp));
    body.append("folder", s.folder);
    body.append("signature", s.signature);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${s.cloudName}/${kind === "image" ? "image" : "video"}/upload`, { method: "POST", body });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error?.message ?? "Échec du téléversement.");
    return { url: kind === "image" ? optimiseImage(json.secure_url) : json.secure_url, kind };
  };
}
