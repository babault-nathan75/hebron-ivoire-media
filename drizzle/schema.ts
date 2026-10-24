import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const statusEnum = pgEnum("status", ["draft", "published", "archived"]);
export const roleEnum = pgEnum("role", ["user", "admin"]);

/** Core user table backing the Manus OAuth flow and editorial permissions. */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/** One-time login codes (hashed) sent by email to administrators. */
export const adminOtps = pgTable(
  "admin_otps",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 320 }).notNull(),
    codeHash: varchar("codeHash", { length: 64 }).notNull(),
    attempts: integer("attempts").default(0).notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({ emailIdx: index("admin_otps_email_idx").on(table.email) }),
);

/** Administrators added from the back office (root admins come from ADMIN_EMAILS). */
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  addedBy: varchar("addedBy", { length: 320 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Editable texts of the public site (see shared/siteSettings.ts). */
export const siteSettings = pgTable("site_settings", {
  key: varchar("key", { length: 64 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

/** Messages sent from the public contact form. */
export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  message: text("message").notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Newsletter / "keep me informed" subscribers. */
export const subscribers = pgTable("subscribers", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Editorial articles, interviews, reports, and testimonies. */
export const articles = pgTable(
  "articles",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 191 }).notNull().unique(),
    title: varchar("title", { length: 300 }).notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    excerpt: varchar("excerpt", { length: 700 }).notNull(),
    body: text("body").notNull(),
    imageUrl: text("imageUrl"),
    author: varchar("author", { length: 160 }),
    readMinutes: integer("readMinutes").default(5).notNull(),
    isFeatured: boolean("isFeatured").default(false).notNull(),
    status: statusEnum("status")
      .default("draft")
      .notNull(),
    publishedAt: timestamp("publishedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  (table) => ({
    statusPublishedAtIdx: index("articles_status_publishedAt_idx").on(
      table.status,
      table.publishedAt,
    ),
    categoryIdx: index("articles_category_idx").on(table.category),
  }),
);

/** Public calendar events managed by the Hébron-Ivoire editorial team. */
export const events = pgTable(
  "events",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 191 }).notNull().unique(),
    title: varchar("title", { length: 300 }).notNull(),
    excerpt: varchar("excerpt", { length: 700 }).notNull(),
    details: text("details").notNull(),
    imageUrl: text("imageUrl"),
    location: varchar("location", { length: 300 }).notNull(),
    startsAt: timestamp("startsAt").notNull(),
    endsAt: timestamp("endsAt"),
    status: statusEnum("status")
      .default("draft")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  (table) => ({
    statusStartsAtIdx: index("events_status_startsAt_idx").on(
      table.status,
      table.startsAt,
    ),
  }),
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Article = typeof articles.$inferSelect;
export type InsertArticle = typeof articles.$inferInsert;
export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;
