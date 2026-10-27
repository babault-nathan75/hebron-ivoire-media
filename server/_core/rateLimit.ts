import { TRPCError } from "@trpc/server";
import { eq, inArray } from "drizzle-orm";
import type { Request } from "express";
import { authAttempts } from "../../drizzle/schema";
import { getDb } from "../db";

export type Policy = { max: number; windowMs: number; lockMs: number };

/** Sign-in failures: 5 per 15 min and per e-mail, then a 15 min lock. The IP limit is looser (shared networks). */
export const LOGIN_BY_EMAIL: Policy = { max: 5, windowMs: 15 * 60_000, lockMs: 15 * 60_000 };
export const LOGIN_BY_IP: Policy = { max: 20, windowMs: 15 * 60_000, lockMs: 15 * 60_000 };
/** Code requests: 10 per hour and per IP, then a 1 h lock. */
export const OTP_REQUEST_BY_IP: Policy = { max: 10, windowMs: 60 * 60_000, lockMs: 60 * 60_000 };

export function clientIp(req: Request): string {
  const header = req.headers["x-nf-client-connection-ip"]; // set by Netlify
  return (Array.isArray(header) ? header[0] : header) || req.ip || "unknown";
}

const tooMany = (until: Date) => {
  const minutes = Math.max(1, Math.ceil((until.getTime() - Date.now()) / 60_000));
  return new TRPCError({ code: "TOO_MANY_REQUESTS", message: `Trop de tentatives. Réessayez dans ${minutes} minute${minutes > 1 ? "s" : ""}.` });
};

/** Throws if any of the keys is currently locked. State lives in the database, so it holds across serverless instances. */
export async function assertNotLocked(keys: string[]) {
  const db = await getDb();
  if (!db) return;
  const rows = await db.select().from(authAttempts).where(inArray(authAttempts.key, keys));
  const now = Date.now();
  const locked = rows.filter((r) => r.lockedUntil && r.lockedUntil.getTime() > now).sort((a, b) => b.lockedUntil!.getTime() - a.lockedUntil!.getTime())[0];
  if (locked?.lockedUntil) throw tooMany(locked.lockedUntil);
}

/** Counts one failure; reaching the maximum locks the key for `lockMs`. */
export async function registerFailure(key: string, policy: Policy) {
  const db = await getDb();
  if (!db) return;
  const now = new Date();
  const [row] = await db.select().from(authAttempts).where(eq(authAttempts.key, key)).limit(1);
  const fresh = !row || now.getTime() - row.windowStart.getTime() > policy.windowMs;
  const failures = fresh ? 1 : row.failures + 1;
  const lock = failures >= policy.max;
  const values = {
    failures: lock ? 0 : failures,
    windowStart: fresh || lock ? now : row!.windowStart,
    lockedUntil: lock ? new Date(now.getTime() + policy.lockMs) : fresh ? null : row!.lockedUntil,
  };
  await db.insert(authAttempts).values({ key, ...values }).onConflictDoUpdate({ target: authAttempts.key, set: values });
}

export async function clearFailures(key: string) {
  const db = await getDb();
  if (!db) return;
  await db.delete(authAttempts).where(eq(authAttempts.key, key));
}
