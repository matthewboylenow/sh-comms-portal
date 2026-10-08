-- Where the office has placed a request on the board (review or approved),
-- independent of the ministry approval flow. The app also creates this table
-- on first use if it is missing.
CREATE TABLE IF NOT EXISTS "request_stages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_table" varchar(30) NOT NULL,
	"record_id" varchar(64) NOT NULL,
	"stage" varchar(20) NOT NULL,
	"set_by" varchar(255),
	"updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "request_stages_record_idx" ON "request_stages" ("source_table", "record_id");
