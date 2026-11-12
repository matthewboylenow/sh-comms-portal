-- A change on a website update can name its own page
ALTER TABLE "website_update_items" ADD COLUMN IF NOT EXISTS "page" varchar(500);
