-- AI-assisted review of calendar events before they go on sainthelen.org.
-- The app also creates this table on first use if it is missing.
CREATE TABLE IF NOT EXISTS "calendar_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"announcement_id" uuid NOT NULL REFERENCES "announcements"("id"),
	"token" varchar(64) NOT NULL UNIQUE,
	"status" varchar(20) DEFAULT 'processing' NOT NULL,
	"original" json NOT NULL,
	"cleaned" json,
	"changes" json,
	"concerns" json,
	"ai_error" text,
	"wordpress_event_id" integer,
	"wordpress_event_url" varchar(500),
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "calendar_reviews_announcement_id_idx" ON "calendar_reviews" ("announcement_id");
