import { randomBytes } from 'crypto';
import { eq, sql } from 'drizzle-orm';
import { db } from '../index';
import {
  calendarReviews,
  type CalendarEventFields,
  type CalendarReview,
} from '../schema';

/**
 * Calendar Review Service - one row per calendar request awaiting approval.
 */

// Same DDL as drizzle/0005_add_calendar_reviews.sql, so the feature works
// before anyone has run the migration by hand.
let tableReady: Promise<void> | null = null;
function ensureTable(): Promise<void> {
  if (!tableReady) {
    tableReady = (async () => {
      await db.execute(sql.raw(`
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
        )`));
      await db.execute(sql.raw(
        'CREATE INDEX IF NOT EXISTS "calendar_reviews_announcement_id_idx" ON "calendar_reviews" ("announcement_id")'
      ));
    })().catch((err) => {
      // Let the next call try again rather than caching the failure
      tableReady = null;
      throw err;
    });
  }
  return tableReady;
}

export async function createCalendarReview(
  announcementId: string,
  original: CalendarEventFields
): Promise<CalendarReview> {
  await ensureTable();
  const [row] = await db
    .insert(calendarReviews)
    .values({
      announcementId,
      token: randomBytes(24).toString('hex'),
      original,
    })
    .returning();
  return row;
}

export async function getCalendarReviewByToken(token: string): Promise<CalendarReview | undefined> {
  if (!/^[a-f0-9]{48}$/.test(token)) return undefined;
  await ensureTable();
  const [row] = await db.select().from(calendarReviews).where(eq(calendarReviews.token, token));
  return row;
}

export async function updateCalendarReview(
  id: string,
  data: Partial<Omit<CalendarReview, 'id' | 'announcementId' | 'token' | 'createdAt'>>
): Promise<CalendarReview> {
  const [row] = await db
    .update(calendarReviews)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(calendarReviews.id, id))
    .returning();
  return row;
}
