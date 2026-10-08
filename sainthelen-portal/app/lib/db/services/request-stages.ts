// app/lib/db/services/request-stages.ts
// The board stage the office set by dragging a card: "review" or "approved".
// Anything else about a request's status is derived from the record itself.
import { sql } from 'drizzle-orm';
import { db } from '../index';
import { requestStages } from '../schema';

export type Stage = 'review' | 'approved';
export type Flag = 'msgr';
export type StageRow = { stage: Stage | null; flag: Flag | null };

let tableReady: Promise<void> | null = null;
function ensureTable(): Promise<void> {
  if (!tableReady) {
    tableReady = (async () => {
      await db.execute(sql.raw(`
        CREATE TABLE IF NOT EXISTS "request_stages" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "source_table" varchar(30) NOT NULL,
          "record_id" varchar(64) NOT NULL,
          "stage" varchar(20),
          "flag" varchar(30),
          "set_by" varchar(255),
          "updated_at" timestamp DEFAULT now() NOT NULL
        )`));
      await db.execute(sql.raw(
        'CREATE UNIQUE INDEX IF NOT EXISTS "request_stages_record_idx" ON "request_stages" ("source_table", "record_id")'
      ));
      // Older copies of the table predate the flag column
      await db.execute(sql.raw('ALTER TABLE "request_stages" ADD COLUMN IF NOT EXISTS "flag" varchar(30)'));
      await db.execute(sql.raw('ALTER TABLE "request_stages" ALTER COLUMN "stage" DROP NOT NULL'));
    })().catch((err) => {
      tableReady = null;
      throw err;
    });
  }
  return tableReady;
}

/** All stages and flags, keyed "table:recordId". */
export async function getAllStages(): Promise<Map<string, StageRow>> {
  await ensureTable();
  const rows = await db.select().from(requestStages);
  return new Map(rows.map((r) => [`${r.sourceTable}:${r.recordId}`, { stage: (r.stage as Stage) || null, flag: (r.flag as Flag) || null }]));
}

export async function setStage(sourceTable: string, recordId: string, stage: Stage | null, setBy?: string): Promise<void> {
  await ensureTable();
  await db
    .insert(requestStages)
    .values({ sourceTable, recordId, stage, setBy: setBy || null, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [requestStages.sourceTable, requestStages.recordId],
      set: { stage, setBy: setBy || null, updatedAt: new Date() },
    });
}

export async function setFlag(sourceTable: string, recordId: string, flag: Flag | null, setBy?: string): Promise<void> {
  await ensureTable();
  await db
    .insert(requestStages)
    .values({ sourceTable, recordId, stage: null, flag, setBy: setBy || null, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [requestStages.sourceTable, requestStages.recordId],
      set: { flag, setBy: setBy || null, updatedAt: new Date() },
    });
}
