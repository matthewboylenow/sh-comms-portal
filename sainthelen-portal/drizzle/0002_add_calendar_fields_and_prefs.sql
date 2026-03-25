-- Add event calendar detail fields to announcements table
ALTER TABLE "announcements" ADD COLUMN "calendar_event_name" varchar(500);
ALTER TABLE "announcements" ADD COLUMN "calendar_event_date" date;
ALTER TABLE "announcements" ADD COLUMN "calendar_event_start_time" time;
ALTER TABLE "announcements" ADD COLUMN "calendar_event_end_time" time;
ALTER TABLE "announcements" ADD COLUMN "calendar_event_description" text;
ALTER TABLE "announcements" ADD COLUMN "calendar_event_location" varchar(500);
ALTER TABLE "announcements" ADD COLUMN "calendar_event_sign_up_link" varchar(500);

-- Add website update email preference to user_preferences table
ALTER TABLE "user_preferences" ADD COLUMN "website_update_email_enabled" boolean DEFAULT true;

-- Change default for daily_digest_enabled to false
ALTER TABLE "user_preferences" ALTER COLUMN "daily_digest_enabled" SET DEFAULT false;
