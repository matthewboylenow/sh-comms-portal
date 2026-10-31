// app/lib/db/services/website-update-items.ts
// The individual changes on one website update request.
import { asc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '../index';
import { websiteUpdateItems, type WebsiteUpdateItem } from '../schema';

let ready: Promise<void> | null = null;
function ensureTable(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await db.execute(sql.raw(`CREATE TABLE IF NOT EXISTS "website_update_items" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "update_id" uuid NOT NULL,
        "position" integer DEFAULT 0 NOT NULL,
        "text" text NOT NULL,
        "done" boolean DEFAULT false NOT NULL,
        "done_at" timestamptz,
        "created_at" timestamptz DEFAULT now() NOT NULL
      )`));
      await db.execute(sql.raw('CREATE INDEX IF NOT EXISTS "website_update_items_update_idx" ON "website_update_items" ("update_id")'));
      await db.execute(sql.raw('ALTER TABLE "website_updates" ADD COLUMN IF NOT EXISTS "new_page" boolean DEFAULT false'));
    })().catch((err) => {
      ready = null;
      throw err;
    });
  }
  return ready;
}

export async function createItems(updateId: string, texts: string[]): Promise<WebsiteUpdateItem[]> {
  await ensureTable();
  const clean = texts.map((t) => t.trim()).filter(Boolean);
  if (!clean.length) return [];
  return db
    .insert(websiteUpdateItems)
    .values(clean.map((text, position) => ({ updateId, position, text })))
    .returning();
}

export async function getItems(updateId: string): Promise<WebsiteUpdateItem[]> {
  await ensureTable();
  return db.select().from(websiteUpdateItems).where(eq(websiteUpdateItems.updateId, updateId)).orderBy(asc(websiteUpdateItems.position));
}

export async function getItemsFor(updateIds: string[]): Promise<Map<string, WebsiteUpdateItem[]>> {
  await ensureTable();
  const out = new Map<string, WebsiteUpdateItem[]>();
  if (!updateIds.length) return out;
  const rows = await db.select().from(websiteUpdateItems).where(inArray(websiteUpdateItems.updateId, updateIds)).orderBy(asc(websiteUpdateItems.position));
  rows.forEach((r) => {
    const list = out.get(r.updateId) || [];
    list.push(r);
    out.set(r.updateId, list);
  });
  return out;
}

export async function setItemDone(id: string, done: boolean): Promise<WebsiteUpdateItem | undefined> {
  await ensureTable();
  const [row] = await db
    .update(websiteUpdateItems)
    .set({ done, doneAt: done ? new Date() : null })
    .where(eq(websiteUpdateItems.id, id))
    .returning();
  return row;
}

export async function setAllItemsDone(updateId: string, done: boolean): Promise<void> {
  await ensureTable();
  await db.update(websiteUpdateItems).set({ done, doneAt: done ? new Date() : null }).where(eq(websiteUpdateItems.updateId, updateId));
}
