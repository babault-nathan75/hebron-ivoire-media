import { and, asc, desc, eq, gte, isNull, lte, ne, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import {
  admins,
  articles,
  contactMessages,
  events,
  type InsertArticle,
  type InsertEvent,
  type InsertUser,
  siteSettings,
  subscribers,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;
const ADMIN_EMAILS = new Set(["babaultnathancharles@gmail.com"]);

/** Admins from the code / ADMIN_EMAILS: they cannot be removed from the back office. */
export function isRootAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const fromEnv = ENV.adminEmails.split(",").map(e => e.trim().toLowerCase());
  return ADMIN_EMAILS.has(normalized) || fromEnv.includes(normalized);
}

export async function isAdminEmail(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  if (isRootAdminEmail(email)) return true;
  const db = await getDb();
  if (!db) return false;
  const rows = await db.select({ id: admins.id }).from(admins).where(eq(admins.email, email.trim().toLowerCase())).limit(1);
  return rows.length > 0;
}

/** Connect lazily so build-time tooling can load the application without a database. */
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  const isAllowlistedAdmin = user.openId === ENV.ownerOpenId || (await isAdminEmail(user.email));
  if (isAllowlistedAdmin) {
    values.role = "admin";
    updateSet.role = "admin";
  } else if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onConflictDoUpdate({ target: users.openId, set: updateSet });
}

export async function setUserPasswordHash(openId: string, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible.");
  await db.update(users).set({ passwordHash }).where(eq(users.openId, openId));
}

export async function listAdmins() {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible.");
  const rows = await db.select().from(admins).orderBy(asc(admins.createdAt));
  const roots = Array.from(new Set([...Array.from(ADMIN_EMAILS), ...ENV.adminEmails.split(",").map(e => e.trim().toLowerCase()).filter(Boolean)]));
  return [
    ...roots.map(email => ({ email, root: true, createdAt: null as Date | null, addedBy: null as string | null })),
    ...rows.filter(r => !roots.includes(r.email)).map(r => ({ email: r.email, root: false, createdAt: r.createdAt as Date | null, addedBy: r.addedBy })),
  ];
}

export async function addAdmin(email: string, addedBy: string) {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible.");
  await db.insert(admins).values({ email, addedBy }).onConflictDoNothing();
}

export async function removeAdmin(email: string) {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible.");
  await db.delete(admins).where(eq(admins.email, email));
  await db.update(users).set({ role: "user", passwordHash: null }).where(eq(users.email, email));
}

export async function getSiteSettings(): Promise<Record<string, string>> {
  const db = await getDb();
  if (!db) return {};
  const rows = await db.select().from(siteSettings);
  return Object.fromEntries(rows.map(r => [r.key, r.value]));
}

export async function saveSiteSettings(values: Record<string, string>) {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible.");
  for (const [key, value] of Object.entries(values)) {
    if (!value.trim()) {
      await db.delete(siteSettings).where(eq(siteSettings.key, key));
      continue;
    }
    await db.insert(siteSettings).values({ key, value }).onConflictDoUpdate({ target: siteSettings.key, set: { value } });
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function listPublishedContent() {
  const db = await getDb();
  if (!db) return { articles: [], events: [] };

  const [publishedArticles, upcomingEvents] = await Promise.all([
    db
      .select()
      .from(articles)
      .where(isLive())
      .orderBy(desc(articles.isFeatured), desc(articles.publishedAt))
      .limit(30),
    db
      .select()
      .from(events)
      .where(and(eq(events.status, "published"), gte(events.startsAt, new Date(Date.now() - 24 * 60 * 60 * 1000))))
      .orderBy(asc(events.startsAt))
      .limit(12),
  ]);

  return {
    articles: publishedArticles.map((article) => ({ ...article, body: "" })),
    events: upcomingEvents.map((event) => ({ ...event, details: "" })),
  };
}

/** Published and not scheduled for later. */
function isLive() {
  return and(eq(articles.status, "published"), lte(articles.publishedAt, new Date()));
}

export async function getArticleBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const [article] = await db.select().from(articles).where(and(eq(articles.slug, slug), isLive())).limit(1);
  if (!article) return undefined;
  const related = await db
    .select()
    .from(articles)
    .where(and(isLive(), ne(articles.id, article.id), eq(articles.category, article.category)))
    .orderBy(desc(articles.publishedAt))
    .limit(3);
  return { article, related: related.map((item) => ({ ...item, body: "" })) };
}

export async function getEventBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const [event] = await db.select().from(events).where(and(eq(events.slug, slug), eq(events.status, "published"))).limit(1);
  return event;
}

export async function listArticles({ category, page, pageSize }: { category?: string; page: number; pageSize: number }) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const where = category ? and(isLive(), eq(articles.category, category)) : isLive();
  const [items, [count]] = await Promise.all([
    db.select().from(articles).where(where).orderBy(desc(articles.publishedAt)).limit(pageSize).offset((page - 1) * pageSize),
    db.select({ n: sql<number>`count(*)::int` }).from(articles).where(where),
  ]);
  return { items: items.map((item) => ({ ...item, body: "" })), total: count?.n ?? 0 };
}

export async function listCategories() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ category: articles.category, count: sql<number>`count(*)::int` })
    .from(articles)
    .where(isLive())
    .groupBy(articles.category)
    .orderBy(desc(sql`count(*)`));
}

export async function listSitemapEntries() {
  const db = await getDb();
  if (!db) return { articles: [], events: [], categories: [] as string[] };
  const [a, e, c] = await Promise.all([
    db.select({ slug: articles.slug, updatedAt: articles.updatedAt }).from(articles).where(isLive()),
    db.select({ slug: events.slug, updatedAt: events.updatedAt }).from(events).where(eq(events.status, "published")),
    listCategories(),
  ]);
  return { articles: a, events: e, categories: c.map((x) => x.category) };
}

export async function submitContactMessage(input: { name: string; email: string; message: string }) {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible.");
  await db.insert(contactMessages).values(input);
}
export async function listContactMessages() {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible.");
  return db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt)).limit(300);
}
export async function setMessageRead(id: number, read: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible.");
  await db.update(contactMessages).set({ readAt: read ? new Date() : null }).where(eq(contactMessages.id, id));
}
export async function deleteMessage(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible.");
  await db.delete(contactMessages).where(eq(contactMessages.id, id));
}
export async function countUnreadMessages() {
  const db = await getDb();
  if (!db) return 0;
  const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(contactMessages).where(isNull(contactMessages.readAt));
  return row?.n ?? 0;
}
export async function addSubscriber(email: string) {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible.");
  await db.insert(subscribers).values({ email }).onConflictDoNothing();
}
export async function listSubscribers() {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible.");
  return db.select().from(subscribers).orderBy(desc(subscribers.createdAt)).limit(2000);
}
export async function deleteSubscriber(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible.");
  await db.delete(subscribers).where(eq(subscribers.id, id));
}

export async function listEditorialContent() {
  const db = await getDb();
  if (!db) throw new Error("La base de données n’est pas configurée pour ce site.");
  const [allArticles, allEvents] = await Promise.all([
    db.select().from(articles).orderBy(desc(articles.updatedAt)).limit(300),
    db.select().from(events).orderBy(desc(events.updatedAt)).limit(300),
  ]);
  return { articles: allArticles, events: allEvents };
}

export async function saveArticle(input: Omit<InsertArticle, "id" | "publishedAt" | "createdAt" | "updatedAt"> & { id?: number; publishAt?: Date | null }) {
  const db = await getDb();
  if (!db) throw new Error("La base de données n’est pas configurée pour ce site.");
  let previous: Date | null = null;
  if (input.id) {
    const [row] = await db.select({ publishedAt: articles.publishedAt }).from(articles).where(eq(articles.id, input.id)).limit(1);
    previous = row?.publishedAt ?? null;
  }
  const values = {
    slug: input.slug,
    title: input.title,
    category: input.category,
    excerpt: input.excerpt,
    body: input.body,
    imageUrl: input.imageUrl ?? null,
    author: input.author ?? null,
    readMinutes: input.readMinutes,
    isFeatured: input.isFeatured,
    status: input.status,
    publishedAt: input.status === "published" ? input.publishAt ?? previous ?? new Date() : null,
  };

  if (input.id) {
    await db.update(articles).set(values).where(eq(articles.id, input.id));
    return { id: input.id };
  }
  const [row] = await db.insert(articles).values(values).returning({ id: articles.id });
  return { id: row.id };
}

export async function saveEvent(input: Omit<InsertEvent, "id" | "createdAt" | "updatedAt"> & { id?: number }) {
  const db = await getDb();
  if (!db) throw new Error("La base de données n’est pas configurée pour ce site.");
  const values = {
    slug: input.slug,
    title: input.title,
    excerpt: input.excerpt,
    details: input.details,
    imageUrl: input.imageUrl ?? null,
    location: input.location,
    startsAt: input.startsAt,
    endsAt: input.endsAt ?? null,
    status: input.status,
  };

  if (input.id) {
    await db.update(events).set(values).where(eq(events.id, input.id));
    return { id: input.id };
  }
  const [row] = await db.insert(events).values(values).returning({ id: events.id });
  return { id: row.id };
}

export async function archiveArticle(id: number) {
  const db = await getDb();
  if (!db) throw new Error("La base de données n’est pas configurée pour ce site.");
  await db.update(articles).set({ status: "archived" }).where(eq(articles.id, id));
  return { success: true as const };
}

export async function archiveEvent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("La base de données n’est pas configurée pour ce site.");
  await db.update(events).set({ status: "archived" }).where(eq(events.id, id));
  return { success: true as const };
}

export async function setArticleStatus(id: number, status: "draft" | "published" | "archived") {
  const db = await getDb();
  if (!db) throw new Error("La base de données n’est pas configurée pour ce site.");
  await db
    .update(articles)
    .set({ status, ...(status === "published" ? { publishedAt: new Date() } : {}) })
    .where(eq(articles.id, id));
  return { success: true as const };
}

export async function setEventStatus(id: number, status: "draft" | "published" | "archived") {
  const db = await getDb();
  if (!db) throw new Error("La base de données n’est pas configurée pour ce site.");
  await db.update(events).set({ status }).where(eq(events.id, id));
  return { success: true as const };
}

export async function deleteArticle(id: number) {
  const db = await getDb();
  if (!db) throw new Error("La base de données n’est pas configurée pour ce site.");
  await db.delete(articles).where(eq(articles.id, id));
  return { success: true as const };
}

export async function deleteEvent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("La base de données n’est pas configurée pour ce site.");
  await db.delete(events).where(eq(events.id, id));
  return { success: true as const };
}
