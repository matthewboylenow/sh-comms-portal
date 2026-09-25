import { and, eq, inArray, sql } from 'drizzle-orm';
import { db } from '../index';
import { copyReviews, type CopyReview } from '../schema';

/**
 * Copy Review Service - Claude's suggested edits for submitted copy.
 */

export type CopySourceType = 'announcement' | 'website_update';

// Same DDL as drizzle/0006_add_copy_reviews.sql, so the feature works before
// anyone has run the migration by hand.
let tableReady: Promise<void> | null = null;
function ensureTable(): Promise<void> {
  if (!tableReady) {
    tableReady = (async () => {
      await db.execute(sql.raw(`
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
        )`));
      await db.execute(sql.raw(
        'CREATE UNIQUE INDEX IF NOT EXISTS "copy_reviews_source_idx" ON "copy_reviews" ("source_type", "source_id")'
      ));
    })().catch((err) => {
      tableReady = null;
      throw err;
    });
  }
  return tableReady;
}

/** Start (or restart) the review for one submission, clearing any earlier result. */
export async function beginCopyReview(
  sourceType: CopySourceType,
  sourceId: string,
  original: string
): Promise<CopyReview> {
  await ensureTable();
  const fresh = {
    status: 'processing',
    original,
    cleaned: null,
    unchanged: false,
    changes: null,
    concerns: null,
    aiError: null,
    updatedAt: new Date(),
  };
  const [row] = await db
    .insert(copyReviews)
    .values({ sourceType, sourceId, ...fresh })
    .onConflictDoUpdate({ target: [copyReviews.sourceType, copyReviews.sourceId], set: fresh })
    .returning();
  return row;
}

export async function finishCopyReview(
  id: string,
  data: Pick<CopyReview, 'cleaned' | 'unchanged' | 'changes' | 'concerns' | 'aiError'>
): Promise<CopyReview> {
  const [row] = await db
    .update(copyReviews)
    .set({ ...data, status: 'ready', updatedAt: new Date() })
    .where(eq(copyReviews.id, id))
    .returning();
  return row;
}

export async function getCopyReviews(
  sourceType: CopySourceType,
  sourceIds: string[]
): Promise<CopyReview[]> {
  if (!sourceIds.length) return [];
  await ensureTable();
  return db
    .select()
    .from(copyReviews)
    .where(and(eq(copyReviews.sourceType, sourceType), inArray(copyReviews.sourceId, sourceIds)));
}
