import { db } from '../index';
import { photoSubmissions, type PhotoSubmission, type NewPhotoSubmission } from '../schema';
import { eq, desc, gte } from 'drizzle-orm';

/**
 * Photo Submissions Service - parish-life photos shared with Communications
 */

// Get all photo submissions, newest first
export async function getAllPhotoSubmissions(): Promise<PhotoSubmission[]> {
  return db.select().from(photoSubmissions).orderBy(desc(photoSubmissions.createdAt));
}

// Get photo submissions created since a given date (for the daily digest)
export async function getPhotoSubmissionsSince(since: Date): Promise<PhotoSubmission[]> {
  return db
    .select()
    .from(photoSubmissions)
    .where(gte(photoSubmissions.createdAt, since))
    .orderBy(desc(photoSubmissions.createdAt));
}

// Get photo submission by ID
export async function getPhotoSubmissionById(id: string): Promise<PhotoSubmission | undefined> {
  const results = await db.select().from(photoSubmissions).where(eq(photoSubmissions.id, id));
  return results[0];
}

// Create photo submission
export async function createPhotoSubmission(data: NewPhotoSubmission): Promise<PhotoSubmission> {
  const [submission] = await db.insert(photoSubmissions).values({
    ...data,
    createdAt: new Date(),
  }).returning();
  return submission;
}

// Delete photo submission
export async function deletePhotoSubmission(id: string): Promise<boolean> {
  await db.delete(photoSubmissions).where(eq(photoSubmissions.id, id));
  return true;
}
