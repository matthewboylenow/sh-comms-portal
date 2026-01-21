import { db } from '../index';
import { comments, type Comment, type NewComment } from '../schema';
import { eq, and, asc } from 'drizzle-orm';

/**
 * Comments Service - Cross-table commenting system
 */

// Get comments for a record
export async function getCommentsForRecord(
  recordId: string,
  tableName: string
): Promise<Comment[]> {
  return db
    .select()
    .from(comments)
    .where(
      and(
        eq(comments.recordId, recordId),
        eq(comments.tableName, tableName)
      )
    )
    .orderBy(asc(comments.createdAt));
}

// Get comment by ID
export async function getCommentById(id: string): Promise<Comment | undefined> {
  const results = await db.select().from(comments).where(eq(comments.id, id));
  return results[0];
}

// Create a comment (admin)
export async function createAdminComment(
  recordId: string,
  tableName: string,
  message: string,
  adminUser: string
): Promise<Comment> {
  const [comment] = await db.insert(comments).values({
    recordId,
    tableName,
    message,
    isPublic: false,
    adminUser,
    publicName: null,
    publicEmail: null,
    createdAt: new Date(),
  }).returning();
  return comment;
}

// Create a public comment
export async function createPublicComment(
  recordId: string,
  tableName: string,
  message: string,
  publicName: string,
  publicEmail: string
): Promise<Comment> {
  const [comment] = await db.insert(comments).values({
    recordId,
    tableName,
    message,
    isPublic: true,
    publicName,
    publicEmail,
    adminUser: null,
    createdAt: new Date(),
  }).returning();
  return comment;
}

// Delete comment
export async function deleteComment(id: string): Promise<boolean> {
  await db.delete(comments).where(eq(comments.id, id));
  return true;
}

// Get all comments by a user (for notifications, etc.)
export async function getCommentsByAdmin(adminUser: string): Promise<Comment[]> {
  return db
    .select()
    .from(comments)
    .where(eq(comments.adminUser, adminUser))
    .orderBy(asc(comments.createdAt));
}
