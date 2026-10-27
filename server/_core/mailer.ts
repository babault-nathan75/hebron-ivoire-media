import nodemailer from "nodemailer";
import { BRAND } from "@shared/brand";
import { ENV } from "./env";

export const mailConfigured = () => Boolean(ENV.smtpHost && ENV.smtpUser && ENV.smtpPassword);

export async function sendMail(opts: { to: string; subject: string; html: string; text?: string; replyTo?: string }) {
  const transporter = nodemailer.createTransport({
    host: ENV.smtpHost,
    port: ENV.smtpPort,
    secure: ENV.smtpPort === 465,
    auth: { user: ENV.smtpUser, pass: ENV.smtpPassword },
  });
  await transporter.sendMail({
    from: `"${BRAND.name}" <${ENV.emailFrom}>`,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
    replyTo: opts.replyTo,
  });
}

export const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
