import { db } from '../index';
import { avRequests, type AvRequest, type NewAvRequest } from '../schema';
import { eq, desc, and } from 'drizzle-orm';

/**
 * A/V Requests Service
 */

// Get all requests (excludes completed by default)
export async function getAllAvRequests(options: { includeCompleted?: boolean } = {}): Promise<AvRequest[]> {
  if (options.includeCompleted) {
    return db.select().from(avRequests).orderBy(desc(avRequests.createdAt));
  }
  return db
    .select()
    .from(avRequests)
    .where(eq(avRequests.completed, false))
    .orderBy(desc(avRequests.createdAt));
}

// Get by ID
export async function getAvRequestById(id: string): Promise<AvRequest | undefined> {
  const results = await db.select().from(avRequests).where(eq(avRequests.id, id));
  return results[0];
}

// Get requests needing livestream (excludes completed)
export async function getLivestreamRequests(): Promise<AvRequest[]> {
  return db
    .select()
    .from(avRequests)
    .where(and(eq(avRequests.needsLivestream, true), eq(avRequests.completed, false)))
    .orderBy(desc(avRequests.createdAt));
}

// Create request
export async function createAvRequest(data: NewAvRequest): Promise<AvRequest> {
  const [request] = await db.insert(avRequests).values({
    ...data,
    createdAt: new Date(),
  }).returning();
  return request;
}

// Update request
export async function updateAvRequest(
  id: string,
  data: Partial<Omit<NewAvRequest, 'id'>>
): Promise<AvRequest | undefined> {
  const [request] = await db
    .update(avRequests)
    .set(data)
    .where(eq(avRequests.id, id))
    .returning();
  return request;
}

// Delete request
export async function deleteAvRequest(id: string): Promise<boolean> {
  await db.delete(avRequests).where(eq(avRequests.id, id));
  return true;
}

// Mark request as completed
export async function markCompleted(id: string, completed: boolean): Promise<AvRequest | undefined> {
  const [request] = await db
    .update(avRequests)
    .set({
      completed,
      completedDate: completed ? new Date() : null,
    })
    .where(eq(avRequests.id, id))
    .returning();
  return request;
}

// Alias for consistency
export const getAllAVRequests = getAllAvRequests;
export const createAVRequest = createAvRequest;
