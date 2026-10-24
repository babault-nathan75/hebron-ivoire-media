import { Fragment, type ReactNode } from "react";

const SAFE_URL = /^(https?:\/\/|mailto:|\/|#)/i;

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const pattern = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > last) out.push(text.slice(last, match.index));
    const key = `${keyBase}-${i++}`;
    if (match[1] !== undefined) out.push(<strong key={key}>{inline(match[1], key)}</strong>);
    else if (match[2] !== undefined) out.push(<em key={key}>{inline(match[2], key)}</em>);
    else if (SAFE_URL.test(match[4])) out.push(<a key={key} href={match[4]} target={match[4].startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">{match[3]}</a>);
    else out.push(match[0]);
    last = match.index + match[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function youtubeId(url: string) {
  const m = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/.exec(url);
  return m?.[1];
}

function media(url: string, key: string): ReactNode | null {
  if (!/^https?:\/\/\S+$/.test(url)) return null;
  const yt = youtubeId(url);
  if (yt) return <div key={key} className="prose-embed"><iframe src={`https://www.youtube-nocookie.com/embed/${yt}`} title="Vidéo YouTube" allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen loading="lazy" /></div>;
  const path = url.split("?")[0].toLowerCase();
  if (/\.(mp3|m4a|wav|ogg|aac|flac)$/.test(path)) return <audio key={key} className="prose-audio" controls preload="none" src={url} />;
  if (/\.(mp4|webm|mov|m4v)$/.test(path) || /res\.cloudinary\.com\/[^/]+\/video\/upload\//.test(url)) return <video key={key} className="prose-video" controls preload="metadata" playsInline src={url} />;
  return null;
}

/** Renders the lightweight markdown the editor produces. Never injects raw HTML. */
export function ArticleBody({ source }: { source: string }) {
  const blocks = source.replace(/\r\n/g, "\n").split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="prose-article">
      {blocks.map((block, index) => {
        const key = `b${index}`;
        const lines = block.split("\n");
        if (block.startsWith("### ")) return <h3 key={key}>{inline(block.slice(4), key)}</h3>;
        if (block.startsWith("## ")) return <h2 key={key}>{inline(block.slice(3), key)}</h2>;
        if (lines.every((l) => l.startsWith(">"))) return <blockquote key={key}>{inline(lines.map((l) => l.replace(/^>\s?/, "")).join(" "), key)}</blockquote>;
        if (lines.every((l) => /^[-*]\s+/.test(l))) return <ul key={key}>{lines.map((l, i) => <li key={i}>{inline(l.replace(/^[-*]\s+/, ""), `${key}-${i}`)}</li>)}</ul>;
        if (lines.every((l) => /^\d+[.)]\s+/.test(l))) return <ol key={key}>{lines.map((l, i) => <li key={i}>{inline(l.replace(/^\d+[.)]\s+/, ""), `${key}-${i}`)}</li>)}</ol>;
        const image = /^!\[([^\]]*)\]\((\S+?)\)$/.exec(block);
        if (image && SAFE_URL.test(image[2])) return <figure key={key}><img src={image[2]} alt={image[1]} loading="lazy" />{image[1] && <figcaption>{image[1]}</figcaption>}</figure>;
        const embedded = lines.length === 1 ? media(block, key) : null;
        if (embedded) return embedded;
        return <p key={key}>{lines.map((l, i) => <Fragment key={i}>{i > 0 && <br />}{inline(l, `${key}-${i}`)}</Fragment>)}</p>;
      })}
    </div>
  );
}
