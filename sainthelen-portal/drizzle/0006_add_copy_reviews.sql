-- Claude's suggested edits for announcement and website update copy.
-- The app also creates this table on first use if it is missing.
CREATE TABLE IF NOT EXISTS "copy_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_type" varchar(30) NOT NULL,
	"source_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'processing' NOT NULL,
	"original" text NOT NULL,
	"cleaned" text,
	"unchanged" boolean DEFAULT false NOT NULL,
	"changes" json,
	"concerns" json,
	"ai_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "copy_reviews_source_idx" ON "copy_reviews" ("source_type", "source_id");
