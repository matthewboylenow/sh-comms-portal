import { db } from '../index';
import { websiteUpdates, type WebsiteUpdate, type NewWebsiteUpdate } from '../schema';
import { eq, desc, and, or, isNull } from 'drizzle-orm';

/**
 * Website Updates Service
 */

// Get all website updates (excludes completed by default)
export async function getAllWebsiteUpdates(options: { includeCompleted?: boolean } = {}): Promise<WebsiteUpdate[]> {
  if (options.includeCompleted) {
    return db.select().from(websiteUpdates).orderBy(desc(websiteUpdates.createdAt));
  }
  // Handle null values: include records where completed is false OR null
  return db
    .select()
    .from(websiteUpdates)
    .where(or(eq(websiteUpdates.completed, false), isNull(websiteUpdates.completed)))
    .orderBy(desc(websiteUpdates.createdAt));
}

// Get website update by ID
export async function getWebsiteUpdateById(id: string): Promise<WebsiteUpdate | undefined> {
  const results = await db.select().from(websiteUpdates).where(eq(websiteUpdates.id, id));
  return results[0];
}

// Create website update
export async function createWebsiteUpdate(data: NewWebsiteUpdate): Promise<WebsiteUpdate> {
  const [update] = await db.insert(websiteUpdates).values({
    ...data,
    createdAt: new Date(),
  }).returning();
  return update;
}

// Update website update
export async function updateWebsiteUpdate(
  id: string,
  data: Partial<Omit<NewWebsiteUpdate, 'id'>>
): Promise<WebsiteUpdate | undefined> {
  const [update] = await db
    .update(websiteUpdates)
    .set(data)
    .where(eq(websiteUpdates.id, id))
    .returning();
  return update;
}

// Delete website update
export async function deleteWebsiteUpdate(id: string): Promise<boolean> {
  await db.delete(websiteUpdates).where(eq(websiteUpdates.id, id));
  return true;
}

// Get urgent updates (excludes completed)
export async function getUrgentUpdates(): Promise<WebsiteUpdate[]> {
  return db
    .select()
    .from(websiteUpdates)
    .where(and(
      eq(websiteUpdates.urgent, true),
      or(eq(websiteUpdates.completed, false), isNull(websiteUpdates.completed))
    ))
    .orderBy(desc(websiteUpdates.createdAt));
}

// Mark website update as completed
export async function markCompleted(id: string, completed: boolean): Promise<WebsiteUpdate | undefined> {
  const [update] = await db
    .update(websiteUpdates)
    .set({
      completed,
      completedDate: completed ? new Date() : null,
    })
    .where(eq(websiteUpdates.id, id))
    .returning();
  return update;
}
