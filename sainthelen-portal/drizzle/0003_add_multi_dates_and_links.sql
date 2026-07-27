-- Support multiple event occurrences and multiple labeled sign-up links.
-- The existing single columns (date_of_event, time_of_event, sign_up_url)
-- keep holding the first entry so older records and integrations still work.

ALTER TABLE "announcements" ADD COLUMN "event_dates" json;
ALTER TABLE "announcements" ADD COLUMN "sign_up_links" json;

ALTER TABLE "website_updates" ADD COLUMN "sign_up_links" json;
