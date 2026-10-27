/** Plays a video (YouTube or file) or an audio file from its URL. Returns null for anything else. */
export function youtubeId(url: string) {
  const m = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/.exec(url);
  return m?.[1];
}

export type MediaType = "youtube" | "video" | "audio" | null;

export function mediaType(url: string): MediaType {
  if (!/^https?:\/\/\S+$/.test(url)) return null;
  if (youtubeId(url)) return "youtube";
  const path = url.split("?")[0].toLowerCase();
  if (/\.(mp3|m4a|wav|ogg|aac|flac)$/.test(path)) return "audio";
  if (/\.(mp4|webm|mov|m4v)$/.test(path) || /res\.cloudinary\.com\/[^/]+\/video\/upload\//.test(url)) return "video";
  return null;
}

export function MediaEmbed({ url, poster, className = "" }: { url: string; poster?: string | null; className?: string }) {
  const type = mediaType(url);
  if (type === "youtube") {
    return (
      <div className={`prose-embed ${className}`}>
        <iframe src={`https://www.youtube-nocookie.com/embed/${youtubeId(url)}`} title="Vidéo YouTube" allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen loading="lazy" />
      </div>
    );
  }
  if (type === "audio") return <audio className={`prose-audio ${className}`} controls preload="none" src={url} />;
  if (type === "video") return <video className={`prose-video ${className}`} controls preload="metadata" playsInline poster={poster ?? undefined} src={url} />;
  return null;
}
