-- Tasks tab: extend the Command Center tasks table with where a task came
-- from, who asked, importance, a timestamped due date and snoozing.
-- The app also adds these columns on first use if they are missing.
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "source" varchar(20) DEFAULT 'manual';
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "source_ref" varchar(500);
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "source_link" text;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "requester_name" varchar(255);
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "requester_email" varchar(255);
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "importance" varchar(20) DEFAULT 'normal';
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "due_at" timestamptz;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "snoozed_until" timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS "tasks_source_ref_idx" ON "tasks" ("source_ref") WHERE "source_ref" IS NOT NULL;
