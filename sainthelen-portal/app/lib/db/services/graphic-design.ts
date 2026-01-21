import { db } from '../index';
import { graphicDesignRequests, type GraphicDesignRequest, type NewGraphicDesignRequest } from '../schema';
import { eq, desc, and } from 'drizzle-orm';

/**
 * Graphic Design Requests Service
 */

// Get all requests (excludes completed by default)
export async function getAllGraphicDesignRequests(options: { includeCompleted?: boolean } = {}): Promise<GraphicDesignRequest[]> {
  if (options.includeCompleted) {
    return db.select().from(graphicDesignRequests).orderBy(desc(graphicDesignRequests.createdAt));
  }
  return db
    .select()
    .from(graphicDesignRequests)
    .where(eq(graphicDesignRequests.completed, false))
    .orderBy(desc(graphicDesignRequests.createdAt));
}

// Get by ID
export async function getGraphicDesignRequestById(id: string): Promise<GraphicDesignRequest | undefined> {
  const results = await db.select().from(graphicDesignRequests).where(eq(graphicDesignRequests.id, id));
  return results[0];
}

// Get by status (excludes completed)
export async function getGraphicDesignRequestsByStatus(status: string): Promise<GraphicDesignRequest[]> {
  return db
    .select()
    .from(graphicDesignRequests)
    .where(and(eq(graphicDesignRequests.status, status), eq(graphicDesignRequests.completed, false)))
    .orderBy(desc(graphicDesignRequests.createdAt));
}

// Create request
export async function createGraphicDesignRequest(data: NewGraphicDesignRequest): Promise<GraphicDesignRequest> {
  const [request] = await db.insert(graphicDesignRequests).values({
    ...data,
    createdAt: new Date(),
  }).returning();
  return request;
}

// Update request
export async function updateGraphicDesignRequest(
  id: string,
  data: Partial<Omit<NewGraphicDesignRequest, 'id'>>
): Promise<GraphicDesignRequest | undefined> {
  const [request] = await db
    .update(graphicDesignRequests)
    .set(data)
    .where(eq(graphicDesignRequests.id, id))
    .returning();
  return request;
}

// Update status
export async function updateGraphicDesignStatus(
  id: string,
  status: string
): Promise<GraphicDesignRequest | undefined> {
  return updateGraphicDesignRequest(id, { status });
}

// Delete request
export async function deleteGraphicDesignRequest(id: string): Promise<boolean> {
  await db.delete(graphicDesignRequests).where(eq(graphicDesignRequests.id, id));
  return true;
}

// Get urgent requests (excludes completed)
export async function getUrgentGraphicDesignRequests(): Promise<GraphicDesignRequest[]> {
  return db
    .select()
    .from(graphicDesignRequests)
    .where(
      and(
        eq(graphicDesignRequests.priority, 'Urgent'),
        eq(graphicDesignRequests.status, 'New'),
        eq(graphicDesignRequests.completed, false)
      )
    )
    .orderBy(desc(graphicDesignRequests.createdAt));
}

// Mark request as completed
export async function markCompleted(id: string, completed: boolean): Promise<GraphicDesignRequest | undefined> {
  const [request] = await db
    .update(graphicDesignRequests)
    .set({
      completed,
      completedDate: completed ? new Date() : null,
    })
    .where(eq(graphicDesignRequests.id, id))
    .returning();
  return request;
}
