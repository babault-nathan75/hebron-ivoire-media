import { createHash, randomBytes, randomInt, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { and, desc, eq, gt } from "drizzle-orm";
import { adminOtps } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";
import { mailConfigured, sendMail } from "./mailer";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_COOLDOWN_MS = 60 * 1000;

export const normalizeEmail = (email: string) => email.trim().toLowerCase();
export const adminOpenId = (email: string) => `admin:${normalizeEmail(email)}`;

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64);
  return `${salt.toString("hex")}:${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string | null | undefined) {
  // Fixed dummy hash so a missing user costs the same as a wrong password.
  const [saltHex, keyHex] = (stored ?? `${"00".repeat(16)}:${"00".repeat(64)}`).split(":");
  const expected = Buffer.from(keyHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length);
  return Boolean(stored) && timingSafeEqual(actual, expected);
}

const hashCode = (email: string, code: string) =>
  createHash("sha256").update(`${ENV.cookieSecret}:${email}:${code}`).digest("hex");

async function sendOtpEmail(email: string, code: string) {
  if (!mailConfigured()) {
    if (ENV.isProduction) throw new Error("L'envoi d'e-mails n'est pas configuré (EMAIL_SERVER_*).");
    console.log(`[OTP] SMTP non configuré — code de connexion pour ${email} : ${code}`);
    return;
  }
  await sendMail({
    to: email,
    subject: `Votre code de connexion : ${code}`,
    html: `<p>Votre code de connexion à l'espace rédaction :</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p><p>Il expire dans 10 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>`,
  });
}

/** Resolves silently for non-admin emails so the endpoint doesn't reveal who is an admin. */
export async function requestOtp(rawEmail: string) {
  const email = normalizeEmail(rawEmail);
  if (!(await db.isAdminEmail(email))) return;
  const conn = await db.getDb();
  if (!conn) throw new Error("Base de données indisponible.");

  const [last] = await conn
    .select()
    .from(adminOtps)
    .where(eq(adminOtps.email, email))
    .orderBy(desc(adminOtps.createdAt))
    .limit(1);
  if (last && Date.now() - last.createdAt.getTime() < OTP_COOLDOWN_MS) {
    throw new Error("Patientez une minute avant de redemander un code.");
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await conn.delete(adminOtps).where(eq(adminOtps.email, email));
  await conn
    .insert(adminOtps)
    .values({ email, codeHash: hashCode(email, code), expiresAt: new Date(Date.now() + OTP_TTL_MS) });
  await sendOtpEmail(email, code);
}

export async function consumeOtp(rawEmail: string, code: string): Promise<boolean> {
  const email = normalizeEmail(rawEmail);
  if (!(await db.isAdminEmail(email))) return false;
  const conn = await db.getDb();
  if (!conn) return false;
  const [row] = await conn
    .select()
    .from(adminOtps)
    .where(and(eq(adminOtps.email, email), gt(adminOtps.expiresAt, new Date())))
    .limit(1);
  if (!row || row.attempts >= OTP_MAX_ATTEMPTS) return false;
  const ok = timingSafeEqual(Buffer.from(row.codeHash), Buffer.from(hashCode(email, code)));
  if (ok) await conn.delete(adminOtps).where(eq(adminOtps.email, email));
  else await conn.update(adminOtps).set({ attempts: row.attempts + 1 }).where(eq(adminOtps.id, row.id));
  return ok;
}

export async function ensureAdminUser(rawEmail: string) {
  const email = normalizeEmail(rawEmail);
  const openId = adminOpenId(email);
  await db.upsertUser({ openId, email, name: email, loginMethod: "admin", lastSignedIn: new Date() });
  return openId;
}
