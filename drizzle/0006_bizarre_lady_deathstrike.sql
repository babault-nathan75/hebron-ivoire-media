CREATE TABLE "auth_attempts" (
	"key" varchar(200) PRIMARY KEY NOT NULL,
	"failures" integer DEFAULT 0 NOT NULL,
	"windowStart" timestamp DEFAULT now() NOT NULL,
	"lockedUntil" timestamp
);
