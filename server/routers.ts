import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import {
  adminOpenId,
  consumeOtp,
  ensureAdminUser,
  hashPassword,
  normalizeEmail,
  requestOtp,
  verifyPassword,
} from "./_core/adminAuth";
import { sdk } from "./_core/sdk";
import * as dbm from "./db";
import { LOGIN_BY_EMAIL, LOGIN_BY_IP, OTP_REQUEST_BY_IP, assertNotLocked, clearFailures, clientIp, registerFailure } from "./_core/rateLimit";
import { createHash } from "node:crypto";
import { escapeHtml, mailConfigured, sendMail } from "./_core/mailer";
import { ENV } from "./_core/env";
import { SITE_FIELDS } from "@shared/siteSettings";
import { ARTICLE_KINDS } from "@shared/slug";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  archiveArticle,
  archiveEvent,
  listEditorialContent,
  listPublishedContent,
  saveArticle,
  saveEvent,
} from "./db";

const statusSchema = z.enum(["draft", "published", "archived"]);
const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(191)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Utilisez un slug en minuscules séparé par des tirets.");

const articleSchema = z.object({
  id: z.number().int().positive().optional(),
  slug: slugSchema,
  title: z.string().trim().min(3).max(300),
  category: z.string().trim().min(2).max(100),
  excerpt: z.string().trim().min(10).max(700),
  body: z.string().trim().max(100000),
  kind: z.enum(ARTICLE_KINDS).default("text"),
  mediaUrl: z.string().trim().max(2000).optional().or(z.literal("")),
  imageUrl: z.string().trim().max(2000).optional().or(z.literal("")),
  author: z.string().trim().max(160).optional().or(z.literal("")),
  readMinutes: z.number().int().min(1).max(180),
  isFeatured: z.boolean(),
  status: statusSchema,
  publishAt: z.string().datetime().optional().nullable(),
}).superRefine((value, ctx) => {
  if (value.kind === "text" && value.body.length < 10) ctx.addIssue({ code: "custom", path: ["body"], message: "Le texte de l’article est trop court (10 caractères minimum)." });
  if (value.kind !== "text" && !value.mediaUrl) ctx.addIssue({ code: "custom", path: ["mediaUrl"], message: "Ajoutez la vidéo ou l’audio (fichier ou lien)." });
});

const eventSchema = z.object({
  id: z.number().int().positive().optional(),
  slug: slugSchema,
  title: z.string().trim().min(3).max(300),
  excerpt: z.string().trim().min(10).max(700),
  details: z.string().trim().min(10).max(100000),
  imageUrl: z.string().trim().max(2000).optional().or(z.literal("")),
  location: z.string().trim().min(2).max(300),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional().nullable(),
  status: statusSchema,
});

const idSchema = z.object({ id: z.number().int().positive() });

async function editorialList() {
  try {
    return await listEditorialContent();
  } catch (error) {
    console.error("[Editorial] Failed to read content:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: error instanceof Error ? error.message : "Impossible de lire le contenu éditorial.",
    });
  }
}

const hits = new Map<string, number[]>();
/** Tiny in-memory limiter: `max` calls per hour per IP and action. */
function limit(ip: string, action: string, max: number) {
  const key = `${action}:${ip}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < 3_600_000);
  if (recent.length >= max) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Trop de tentatives. Réessayez plus tard." });
  hits.set(key, [...recent, now]);
}

async function startSession(ctx: { req: any; res: any }, openId: string, name: string) {
  const token = await sdk.createSessionToken(openId, { name, expiresInMs: ONE_YEAR_MS });
  ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: ONE_YEAR_MS });
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    loginWithPassword: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string().min(1).max(200) }))
      .mutation(async ({ ctx, input }) => {
        const email = normalizeEmail(input.email);
        const ip = clientIp(ctx.req);
        const emailKey = `pw:${email}`;
        const ipKey = `ip:${ip}`;
        await assertNotLocked([emailKey, ipKey]);
        const user = (await dbm.isAdminEmail(email)) ? await dbm.getUserByOpenId(adminOpenId(email)) : undefined;
        // Hash check runs even for unknown users to keep timing uniform.
        const ok = await verifyPassword(input.password, user?.passwordHash);
        if (!user || !ok) {
          await Promise.all([registerFailure(emailKey, LOGIN_BY_EMAIL), registerFailure(ipKey, LOGIN_BY_IP)]);
          throw new TRPCError({ code: "UNAUTHORIZED", message: "E-mail ou mot de passe incorrect." });
        }
        await clearFailures(emailKey);
        await startSession(ctx, user.openId, email);
        return { success: true } as const;
      }),
    requestOtp: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ ctx, input }) => {
        const ipKey = `otpreq:${clientIp(ctx.req)}`;
        await assertNotLocked([ipKey]);
        await registerFailure(ipKey, OTP_REQUEST_BY_IP); // every request counts: 10 per hour per IP
        try {
          await requestOtp(input.email);
        } catch (error) {
          console.error("[OTP] request failed:", error);
          throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Envoi impossible." });
        }
        return { success: true } as const;
      }),
    verifyOtp: publicProcedure
      .input(z.object({ email: z.string().email(), code: z.string().regex(/^\d{6}$/) }))
      .mutation(async ({ ctx, input }) => {
        const email = normalizeEmail(input.email);
        const ip = clientIp(ctx.req);
        const emailKey = `otp:${email}`;
        const ipKey = `ip:${ip}`;
        await assertNotLocked([emailKey, ipKey]);
        if (!(await consumeOtp(input.email, input.code))) {
          await Promise.all([registerFailure(emailKey, LOGIN_BY_EMAIL), registerFailure(ipKey, LOGIN_BY_IP)]);
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Code invalide ou expiré." });
        }
        await clearFailures(emailKey);
        const openId = await ensureAdminUser(input.email);
        await startSession(ctx, openId, email);
        return { success: true } as const;
      }),
    setPassword: protectedProcedure
      .input(z.object({ password: z.string().min(8).max(200) }))
      .mutation(async ({ ctx, input }) => {
        await dbm.setUserPasswordHash(ctx.user.openId, await hashPassword(input.password));
        return { success: true } as const;
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  media: router({
    /** Signed parameters so the browser can upload straight to Cloudinary; the API secret never leaves the server. */
    sign: adminProcedure.mutation(() => {
      if (!ENV.cloudinaryCloudName || !ENV.cloudinaryApiKey || !ENV.cloudinaryApiSecret) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Cloudinary n’est pas configuré (CLOUDINARY_* dans .env)." });
      }
      const timestamp = Math.floor(Date.now() / 1000);
      const folder = "impact-nation";
      const signature = createHash("sha1")
        .update(`folder=${folder}&timestamp=${timestamp}${ENV.cloudinaryApiSecret}`)
        .digest("hex");
      return { cloudName: ENV.cloudinaryCloudName, apiKey: ENV.cloudinaryApiKey, timestamp, folder, signature };
    }),
  }),
  site: router({
    setup: adminProcedure.query(() => ({
      cloudinary: Boolean(ENV.cloudinaryCloudName && ENV.cloudinaryApiKey && ENV.cloudinaryApiSecret),
      email: Boolean(ENV.smtpHost && ENV.smtpUser && ENV.smtpPassword),
    })),
    settings: publicProcedure.query(() => dbm.getSiteSettings()),
    saveSettings: adminProcedure
      .input(z.object({ values: z.record(z.string().max(64), z.string().max(2000)) }))
      .mutation(async ({ input }) => {
        const allowed = new Set(SITE_FIELDS.map(f => f.key));
        const values = Object.fromEntries(Object.entries(input.values).filter(([k]) => allowed.has(k)));
        await dbm.saveSiteSettings(values);
        return { success: true } as const;
      }),
  }),
  admins: router({
    list: adminProcedure.query(() => dbm.listAdmins()),
    onboarding: adminProcedure.query(async ({ ctx }) => ({ seen: await dbm.hasSeenGuide(ctx.user.email) })),
    completeOnboarding: adminProcedure.mutation(async ({ ctx }) => {
      await dbm.markGuideSeen(ctx.user.email);
      return { success: true } as const;
    }),
    add: adminProcedure
      .input(z.object({ email: z.string().email(), password: z.string().min(8).max(200).optional() }))
      .mutation(async ({ ctx, input }) => {
        const email = normalizeEmail(input.email);
        await dbm.addAdmin(email, ctx.user.email ?? ctx.user.openId);
        if (input.password) {
          const openId = await ensureAdminUser(email);
          await dbm.setUserPasswordHash(openId, await hashPassword(input.password));
        }
        return { success: true } as const;
      }),
    remove: adminProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ ctx, input }) => {
        const email = normalizeEmail(input.email);
        if (email === ctx.user.email) throw new TRPCError({ code: "BAD_REQUEST", message: "Vous ne pouvez pas vous retirer vous-même." });
        await dbm.removeAdmin(email);
        return { success: true } as const;
      }),
  }),
  categories: router({
    list: adminProcedure.query(() => dbm.listCategoriesAdmin()),
    create: adminProcedure
      .input(z.object({ name: z.string().trim().min(2).max(100), description: z.string().trim().max(300).default("") }))
      .mutation(async ({ input }) => {
        try { await dbm.createCategory(input.name, input.description); } catch { throw new TRPCError({ code: "BAD_REQUEST", message: "Une rubrique de ce nom existe déjà." }); }
        return { success: true } as const;
      }),
    update: adminProcedure
      .input(idSchema.extend({ name: z.string().trim().min(2).max(100), description: z.string().trim().max(300).default("") }))
      .mutation(async ({ input }) => {
        try { await dbm.updateCategory(input.id, input.name, input.description); } catch { throw new TRPCError({ code: "BAD_REQUEST", message: "Impossible d’enregistrer : ce nom est peut-être déjà utilisé." }); }
        return { success: true } as const;
      }),
    move: adminProcedure.input(idSchema.extend({ direction: z.enum(["up", "down"]) })).mutation(async ({ input }) => { await dbm.moveCategory(input.id, input.direction); return { success: true } as const; }),
    remove: adminProcedure.input(idSchema).mutation(async ({ input }) => {
      try { await dbm.deleteCategory(input.id); } catch (e) { throw new TRPCError({ code: "BAD_REQUEST", message: e instanceof Error ? e.message : "Suppression impossible." }); }
      return { success: true } as const;
    }),
  }),
  contact: router({
    send: publicProcedure
      .input(z.object({
        name: z.string().trim().min(2).max(160),
        email: z.string().trim().email().max(320),
        message: z.string().trim().min(10).max(5000),
        website: z.string().max(200).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (input.website) return { success: true } as const; // honeypot: bots fill it
        limit(ctx.req.ip ?? "?", "contact", 5);
        await dbm.submitContactMessage({ name: input.name, email: input.email, message: input.message });
        if (mailConfigured()) {
          void sendMail({
            to: ENV.emailFrom,
            replyTo: input.email,
            subject: `Nouveau message de ${input.name}`,
            html: `<p><strong>${escapeHtml(input.name)}</strong> (${escapeHtml(input.email)}) a écrit :</p><p>${escapeHtml(input.message).replace(/\n/g, "<br>")}</p>`,
          }).catch((error) => console.error("[Contact] notification failed:", error));
        }
        return { success: true } as const;
      }),
    subscribe: publicProcedure
      .input(z.object({ email: z.string().trim().email().max(320), website: z.string().max(200).optional() }))
      .mutation(async ({ ctx, input }) => {
        if (input.website) return { success: true } as const;
        limit(ctx.req.ip ?? "?", "subscribe", 5);
        await dbm.addSubscriber(input.email.toLowerCase());
        return { success: true } as const;
      }),
    messages: adminProcedure.query(() => dbm.listContactMessages()),
    unread: adminProcedure.query(() => dbm.countUnreadMessages()),
    markRead: adminProcedure.input(idSchema.extend({ read: z.boolean() })).mutation(({ input }) => dbm.setMessageRead(input.id, input.read)),
    removeMessage: adminProcedure.input(idSchema).mutation(({ input }) => dbm.deleteMessage(input.id)),
    subscribers: adminProcedure.query(() => dbm.listSubscribers()),
    removeSubscriber: adminProcedure.input(idSchema).mutation(({ input }) => dbm.deleteSubscriber(input.id)),
  }),
  content: router({
    article: publicProcedure.input(z.object({ slug: z.string().max(191) })).query(({ input }) => dbm.getArticleBySlug(input.slug)),
    event: publicProcedure.input(z.object({ slug: z.string().max(191) })).query(({ input }) => dbm.getEventBySlug(input.slug)),
    list: publicProcedure
      .input(z.object({ category: z.string().max(120).optional(), kind: z.enum(ARTICLE_KINDS).optional(), page: z.number().int().min(1).max(500).default(1) }))
      .query(({ input }) => dbm.listArticles({ categorySlug: input.category, kind: input.kind, page: input.page, pageSize: 9 })),
    categories: publicProcedure.query(() => dbm.listCategories()),
    search: publicProcedure.input(z.object({ q: z.string().trim().min(2).max(80) })).query(({ input }) => dbm.searchArticles(input.q)),
    rubrique: publicProcedure.input(z.object({ slug: z.string().max(120) })).query(async ({ input }) => {
      const c = await dbm.getCategoryBySlug(input.slug);
      return c ? { name: c.name, slug: c.slug, description: c.description } : null;
    }),
    listPublished: publicProcedure.query(() => listPublishedContent()),
    editorialList: adminProcedure.query(() => editorialList()),
    saveArticle: adminProcedure.input(articleSchema).mutation(async ({ input }) => {
      try {
        if (!(await dbm.categoryExists(input.category))) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Cette rubrique n’existe pas. Créez-la d’abord dans l’onglet Rubriques." });
        }
        return await saveArticle({ ...input, publishAt: input.publishAt ? new Date(input.publishAt) : null });
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Editorial] Failed to save article:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Impossible d’enregistrer l’article. Vérifiez que son slug n’est pas déjà utilisé.",
        });
      }
    }),
    saveEvent: adminProcedure.input(eventSchema).mutation(async ({ input }) => {
      try {
        return await saveEvent({ ...input, startsAt: new Date(input.startsAt), endsAt: input.endsAt ? new Date(input.endsAt) : null });
      } catch (error) {
        console.error("[Editorial] Failed to save event:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Impossible d’enregistrer l’événement. Vérifiez que son slug n’est pas déjà utilisé.",
        });
      }
    }),
    archiveArticle: adminProcedure.input(idSchema).mutation(({ input }) => archiveArticle(input.id)),
    archiveEvent: adminProcedure.input(idSchema).mutation(({ input }) => archiveEvent(input.id)),
    setArticleStatus: adminProcedure
      .input(idSchema.extend({ status: statusSchema }))
      .mutation(({ input }) => dbm.setArticleStatus(input.id, input.status)),
    setEventStatus: adminProcedure
      .input(idSchema.extend({ status: statusSchema }))
      .mutation(({ input }) => dbm.setEventStatus(input.id, input.status)),
    deleteArticle: adminProcedure.input(idSchema).mutation(({ input }) => dbm.deleteArticle(input.id)),
    deleteEvent: adminProcedure.input(idSchema).mutation(({ input }) => dbm.deleteEvent(input.id)),
  }),
});

export type AppRouter = typeof appRouter;
