-- Tasks tab, second pass: a fresh table in place of the Command Center's,
-- an audit trail, and individual items on website update requests.
-- The Command Center is gone; its tables are dropped.
DROP TABLE IF EXISTS "tasks";
DROP TABLE IF EXISTS "notes";
DROP TABLE IF EXISTS "recurring_reminders";
DROP TABLE IF EXISTS "social_media_content";

CREATE TABLE IF NOT EXISTS "portal_tasks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_email" varchar(255) NOT NULL,
  "title" text NOT NULL,
  "notes" text,
  "source" varchar(20) DEFAULT 'manual' NOT NULL,
  "source_ref" varchar(500),
  "source_link" text,
  "conversation_id" varchar(500),
  "requester_name" varchar(255),
  "requester_email" varchar(255),
  "category" varchar(20) DEFAULT 'other' NOT NULL,
  "due_at" timestamptz,
  "importance" varchar(20) DEFAULT 'normal' NOT NULL,
  "status" varchar(20) DEFAULT 'open' NOT NULL,
  "snoozed_until" timestamptz,
  "first_requested_at" timestamptz,
  "last_follow_up_at" timestamptz,
  "follow_up_count" integer DEFAULT 0 NOT NULL,
  "committed_for" timestamptz,
  "page_url" varchar(1000),
  "page_hash" varchar(64),
  "completion_confidence" integer,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "completed_at" timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS "portal_tasks_source_ref_idx" ON "portal_tasks" ("source_ref") WHERE "source_ref" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "portal_tasks_owner_status_idx" ON "portal_tasks" ("owner_email", "status");

CREATE TABLE IF NOT EXISTS "task_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "task_id" uuid NOT NULL,
  "kind" varchar(30) NOT NULL,
  "detail" text,
  "confidence" integer,
  "source_ref" varchar(500),
  "source_link" text,
  "actor" varchar(255),
  "created_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "task_events_task_idx" ON "task_events" ("task_id");

CREATE TABLE IF NOT EXISTS "website_update_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "update_id" uuid NOT NULL,
  "position" integer DEFAULT 0 NOT NULL,
  "text" text NOT NULL,
  "done" boolean DEFAULT false NOT NULL,
  "done_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "website_update_items_update_idx" ON "website_update_items" ("update_id");

ALTER TABLE "website_updates" ADD COLUMN IF NOT EXISTS "new_page" boolean DEFAULT false;
