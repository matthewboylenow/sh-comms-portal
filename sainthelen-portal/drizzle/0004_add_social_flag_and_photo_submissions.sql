-- "Consider for Social Media" flag on announcements
ALTER TABLE "announcements" ADD COLUMN "social_consideration" boolean DEFAULT false;
ALTER TABLE "announcements" ADD COLUMN "social_what_to_know" text;
ALTER TABLE "announcements" ADD COLUMN "social_has_photos" varchar(20);

-- Standalone "Share Photos with Communications" submissions
CREATE TABLE "photo_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submitter_name" varchar(255),
	"ministry" varchar(255),
	"description" text NOT NULL,
	"photo_date" date,
	"file_links" text[],
	"privacy_concern" boolean DEFAULT false NOT NULL,
	"privacy_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
