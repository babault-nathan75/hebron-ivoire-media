import { escapeHtml } from "./mailer";

const NAVY = "#001a53";
const DEEP = "#00113a";
const ORANGE = "#ff8500";

/** Branded sign-in code e-mail (table layout + inline styles so it renders in Gmail, Outlook and mobile clients). */
export function otpEmail({ code, minutes, siteName, siteUrl }: { code: string; minutes: number; siteName: string; siteUrl?: string }) {
  const digits = code.split("").map((d) => `<td style="width:44px;height:56px;background:#eef2fa;border:1px solid #d2d9e8;border-radius:10px;text-align:center;font:700 28px Helvetica,Arial,sans-serif;color:${DEEP};">${escapeHtml(d)}</td><td style="width:6px"></td>`).join("");
  const logo = siteUrl ? `<div style="margin-bottom:12px;"><img src="${escapeHtml(siteUrl)}/brand/logo-full.png" alt="Cité d’Impact.net" height="64" style="display:block;height:64px;width:auto;max-width:100%;background:#ffffff;padding:6px 10px;border-radius:8px;"></div>` : "";
  const home = siteUrl ? `<a href="${escapeHtml(siteUrl)}" style="color:${ORANGE};text-decoration:none;">${escapeHtml(siteUrl.replace(/^https?:\/\//, ""))}</a>` : "";
  const subject = `${code} est votre code de connexion ${siteName}`;
  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:#eef1f7;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Votre code de connexion : ${escapeHtml(code)}. Il expire dans ${minutes} minutes.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef1f7;padding:28px 12px;">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;font-family:Helvetica,Arial,sans-serif;">
    <tr><td style="background:${DEEP};padding:26px 28px;">
      ${logo}<div style="margin-top:4px;font:12px Helvetica,Arial,sans-serif;letter-spacing:1.5px;color:#d4def2;text-transform:uppercase;">Espace r&eacute;daction</div>
    </td></tr>
    <tr><td style="padding:32px 28px 8px;">
      <h1 style="margin:0 0 10px;font:normal 26px Georgia,'Times New Roman',serif;color:${DEEP};">Votre code de connexion</h1>
      <p style="margin:0;font:15px/1.6 Helvetica,Arial,sans-serif;color:#4b5670;">Saisissez ce code sur la page de connexion pour acc&eacute;der &agrave; l&rsquo;espace r&eacute;daction de ${escapeHtml(siteName)}.</p>
    </td></tr>
    <tr><td align="center" style="padding:22px 28px;">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>${digits}</tr></table>
    </td></tr>
    <tr><td style="padding:0 28px 8px;">
      <p style="margin:0;padding:12px 14px;background:#fff3e4;border-radius:10px;font:13px/1.55 Helvetica,Arial,sans-serif;color:#8a4a0a;">
        &#9201;&nbsp;Ce code est valable <strong>${minutes} minutes</strong> et ne peut &ecirc;tre utilis&eacute; qu&rsquo;une seule fois.
      </p>
    </td></tr>
    <tr><td style="padding:18px 28px 30px;">
      <p style="margin:0 0 8px;font:13px/1.6 Helvetica,Arial,sans-serif;color:#6d7588;"><strong style="color:${NAVY};">Vous n&rsquo;&ecirc;tes pas &agrave; l&rsquo;origine de cette demande ?</strong> Ignorez simplement ce message : sans le code, personne ne peut se connecter. Ne communiquez jamais ce code, m&ecirc;me &agrave; quelqu&rsquo;un qui pr&eacute;tend faire partie de l&rsquo;&eacute;quipe.</p>
    </td></tr>
    <tr><td style="background:#f4f6fb;padding:16px 28px;border-top:1px solid #e1e5ef;">
      <p style="margin:0;font:12px/1.6 Helvetica,Arial,sans-serif;color:#7a8292;">${escapeHtml(siteName)} &mdash; le m&eacute;dia qui inspire.${home ? ` ${home}` : ""}<br>Message automatique, merci de ne pas y r&eacute;pondre.</p>
    </td></tr>
  </table>
</td></tr>
</table>
</body></html>`;
  const text = `Votre code de connexion ${siteName} : ${code}\n\nIl est valable ${minutes} minutes et ne peut être utilisé qu'une seule fois.\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez ce message. Ne communiquez jamais ce code.\n\n${siteName} — Espace rédaction`;
  return { subject, html, text };
}
