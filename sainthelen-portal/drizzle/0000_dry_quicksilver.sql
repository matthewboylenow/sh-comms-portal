CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"ministry" varchar(255),
	"ministry_id" uuid,
	"announcement_body" text NOT NULL,
	"date_of_event" date,
	"time_of_event" time,
	"promotion_start_date" date,
	"platforms" json,
	"add_to_events_calendar" boolean DEFAULT false,
	"external_event" boolean DEFAULT false,
	"file_links" text[],
	"sign_up_url" varchar(500),
	"approval_status" varchar(50) DEFAULT 'pending' NOT NULL,
	"requires_approval" boolean DEFAULT false NOT NULL,
	"approved_by" varchar(255),
	"approved_at" timestamp,
	"rejection_reason" text,
	"wordpress_event_id" integer,
	"wordpress_event_url" varchar(500),
	"completed" boolean DEFAULT false,
	"completed_date" timestamp,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "av_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"ministry" varchar(255),
	"event_name" varchar(500) NOT NULL,
	"date_time_entries" json,
	"event_dates_and_times" text,
	"description" text NOT NULL,
	"location" varchar(500) NOT NULL,
	"needs_livestream" boolean DEFAULT false NOT NULL,
	"av_needs" text,
	"expected_attendees" varchar(100),
	"additional_notes" text,
	"file_links" text[],
	"completed" boolean DEFAULT false,
	"completed_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"record_id" varchar(255) NOT NULL,
	"table_name" varchar(100) NOT NULL,
	"message" text NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"public_name" varchar(255),
	"public_email" varchar(255),
	"admin_user" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flyer_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"ministry" varchar(255),
	"event_name" varchar(500) NOT NULL,
	"event_date" date,
	"target_audience" varchar(255),
	"purpose" text,
	"feedback_needed" text,
	"urgency" varchar(50) DEFAULT 'standard' NOT NULL,
	"file_links" text[],
	"status" varchar(50) DEFAULT 'Pending' NOT NULL,
	"completed" boolean DEFAULT false,
	"completed_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "graphic_design_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"ministry" varchar(255),
	"project_type" varchar(255) NOT NULL,
	"project_description" text NOT NULL,
	"deadline" date,
	"priority" varchar(50) DEFAULT 'Standard' NOT NULL,
	"required_dimensions" varchar(255),
	"file_links" text[],
	"status" varchar(50) DEFAULT 'New' NOT NULL,
	"completed" boolean DEFAULT false,
	"completed_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ministries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"requires_approval" boolean DEFAULT false NOT NULL,
	"approval_coordinator" varchar(100) DEFAULT 'adult-discipleship',
	"description" text,
	"active" boolean DEFAULT true NOT NULL,
	"aliases" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ministries_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_email" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"color" varchar(20) DEFAULT 'yellow',
	"is_pinned" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_email" varchar(255) NOT NULL,
	"type" varchar(50) DEFAULT 'info' NOT NULL,
	"message" text NOT NULL,
	"related_record_id" varchar(255),
	"related_record_type" varchar(100),
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"endpoint" text NOT NULL,
	"keys" json NOT NULL,
	"user_email" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE "recurring_reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_email" varchar(255) NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"category" varchar(100) NOT NULL,
	"frequency" varchar(20) NOT NULL,
	"day_of_week" integer,
	"day_of_month" integer,
	"time_of_day" time,
	"priority" varchar(20) DEFAULT 'normal',
	"is_active" boolean DEFAULT true,
	"last_generated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sms_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"ministry" varchar(255),
	"sms_message" varchar(160) NOT NULL,
	"requested_date" date,
	"additional_info" text,
	"file_links" text[],
	"completed" boolean DEFAULT false,
	"completed_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_media_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_email" varchar(255) NOT NULL,
	"platform" varchar(50) NOT NULL,
	"content_type" varchar(50) NOT NULL,
	"content" text NOT NULL,
	"hashtags" text,
	"suggested_date" date,
	"source_record_id" uuid,
	"source_record_type" varchar(50),
	"status" varchar(20) DEFAULT 'draft',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_email" varchar(255) NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"category" varchar(100) NOT NULL,
	"priority" varchar(20) DEFAULT 'normal',
	"status" varchar(20) DEFAULT 'pending',
	"due_date" date,
	"due_time" time,
	"completed_at" timestamp,
	"linked_record_id" uuid,
	"linked_record_type" varchar(50),
	"recurring_reminder_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_email" varchar(255) NOT NULL,
	"daily_digest_enabled" boolean DEFAULT true,
	"daily_digest_time" time DEFAULT '07:30:00',
	"default_view" varchar(20) DEFAULT 'daily',
	"theme" varchar(20) DEFAULT 'system',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_preferences_user_email_unique" UNIQUE("user_email")
);
--> statement-breakpoint
CREATE TABLE "website_updates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"urgent" boolean DEFAULT false NOT NULL,
	"page_to_update" varchar(500) NOT NULL,
	"description" text NOT NULL,
	"sign_up_url" varchar(500),
	"file_links" text[],
	"completed" boolean DEFAULT false,
	"completed_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_ministry_id_ministries_id_fk" FOREIGN KEY ("ministry_id") REFERENCES "public"."ministries"("id") ON DELETE no action ON UPDATE no action;