CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TABLE "admin_otps" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(320) NOT NULL,
	"codeHash" varchar(64) NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(191) NOT NULL,
	"title" varchar(300) NOT NULL,
	"category" varchar(100) NOT NULL,
	"excerpt" varchar(700) NOT NULL,
	"body" text NOT NULL,
	"imageUrl" text,
	"author" varchar(160),
	"readMinutes" integer DEFAULT 5 NOT NULL,
	"isFeatured" boolean DEFAULT false NOT NULL,
	"status" "status" DEFAULT 'draft' NOT NULL,
	"publishedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(191) NOT NULL,
	"title" varchar(300) NOT NULL,
	"excerpt" varchar(700) NOT NULL,
	"details" text NOT NULL,
	"imageUrl" text,
	"location" varchar(300) NOT NULL,
	"startsAt" timestamp NOT NULL,
	"endsAt" timestamp,
	"status" "status" DEFAULT 'draft' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "events_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"passwordHash" varchar(255),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE INDEX "admin_otps_email_idx" ON "admin_otps" USING btree ("email");--> statement-breakpoint
CREATE INDEX "articles_status_publishedAt_idx" ON "articles" USING btree ("status","publishedAt");--> statement-breakpoint
CREATE INDEX "articles_category_idx" ON "articles" USING btree ("category");--> statement-breakpoint
CREATE INDEX "events_status_startsAt_idx" ON "events" USING btree ("status","startsAt");