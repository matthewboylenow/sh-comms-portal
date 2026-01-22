import { db } from '../index';
import { flyerReviews, type FlyerReview, type NewFlyerReview } from '../schema';
import { eq, desc, and, or, isNull } from 'drizzle-orm';

/**
 * Flyer Reviews Service
 */

// Get all reviews (excludes completed by default)
export async function getAllFlyerReviews(options: { includeCompleted?: boolean } = {}): Promise<FlyerReview[]> {
  if (options.includeCompleted) {
    return db.select().from(flyerReviews).orderBy(desc(flyerReviews.createdAt));
  }
  // Handle null values: include records where completed is false OR null
  return db
    .select()
    .from(flyerReviews)
    .where(or(eq(flyerReviews.completed, false), isNull(flyerReviews.completed)))
    .orderBy(desc(flyerReviews.createdAt));
}

// Get by ID
export async function getFlyerReviewById(id: string): Promise<FlyerReview | undefined> {
  const results = await db.select().from(flyerReviews).where(eq(flyerReviews.id, id));
  return results[0];
}

// Get by status (excludes completed)
export async function getFlyerReviewsByStatus(status: string): Promise<FlyerReview[]> {
  return db
    .select()
    .from(flyerReviews)
    .where(and(
      eq(flyerReviews.status, status),
      or(eq(flyerReviews.completed, false), isNull(flyerReviews.completed))
    ))
    .orderBy(desc(flyerReviews.createdAt));
}

// Get pending reviews
export async function getPendingFlyerReviews(): Promise<FlyerReview[]> {
  return getFlyerReviewsByStatus('Pending');
}

// Create review
export async function createFlyerReview(data: NewFlyerReview): Promise<FlyerReview> {
  const [review] = await db.insert(flyerReviews).values({
    ...data,
    createdAt: new Date(),
  }).returning();
  return review;
}

// Update review
export async function updateFlyerReview(
  id: string,
  data: Partial<Omit<NewFlyerReview, 'id'>>
): Promise<FlyerReview | undefined> {
  const [review] = await db
    .update(flyerReviews)
    .set(data)
    .where(eq(flyerReviews.id, id))
    .returning();
  return review;
}

// Update status
export async function updateFlyerReviewStatus(
  id: string,
  status: string
): Promise<FlyerReview | undefined> {
  return updateFlyerReview(id, { status });
}

// Delete review
export async function deleteFlyerReview(id: string): Promise<boolean> {
  await db.delete(flyerReviews).where(eq(flyerReviews.id, id));
  return true;
}

// Get urgent reviews (excludes completed)
export async function getUrgentFlyerReviews(): Promise<FlyerReview[]> {
  return db
    .select()
    .from(flyerReviews)
    .where(
      and(
        eq(flyerReviews.urgency, 'urgent'),
        eq(flyerReviews.status, 'Pending'),
        or(eq(flyerReviews.completed, false), isNull(flyerReviews.completed))
      )
    )
    .orderBy(desc(flyerReviews.createdAt));
}

// Mark review as completed
export async function markCompleted(id: string, completed: boolean): Promise<FlyerReview | undefined> {
  const [review] = await db
    .update(flyerReviews)
    .set({
      completed,
      completedDate: completed ? new Date() : null,
    })
    .where(eq(flyerReviews.id, id))
    .returning();
  return review;
}
