import nodemailer from "nodemailer";
import { ENV } from "./env";

export const mailConfigured = () => Boolean(ENV.smtpHost && ENV.smtpUser && ENV.smtpPassword);

export async function sendMail(opts: { to: string; subject: string; html: string; replyTo?: string }) {
  const transporter = nodemailer.createTransport({
    host: ENV.smtpHost,
    port: ENV.smtpPort,
    secure: ENV.smtpPort === 465,
    auth: { user: ENV.smtpUser, pass: ENV.smtpPassword },
  });
  await transporter.sendMail({
    from: `"Hébron-Ivoire Média" <${ENV.emailFrom}>`,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    replyTo: opts.replyTo,
  });
}

export const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
