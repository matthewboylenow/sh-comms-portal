import { db } from '../index';
import { notes, type Note, type NewNote } from '../schema';
import { eq, and, desc, asc } from 'drizzle-orm';

/**
 * Notes Service - CRUD operations for Command Center quick notes
 */

// Get all notes for a user (pinned first)
export async function getNotesForUser(userEmail: string): Promise<Note[]> {
  return db
    .select()
    .from(notes)
    .where(eq(notes.userEmail, userEmail))
    .orderBy(desc(notes.isPinned), desc(notes.updatedAt));
}

// Get pinned notes for a user
export async function getPinnedNotes(userEmail: string): Promise<Note[]> {
  return db
    .select()
    .from(notes)
    .where(
      and(
        eq(notes.userEmail, userEmail),
        eq(notes.isPinned, true)
      )
    )
    .orderBy(desc(notes.updatedAt));
}

// Get note by ID
export async function getNoteById(id: string): Promise<Note | undefined> {
  const results = await db.select().from(notes).where(eq(notes.id, id));
  return results[0];
}

// Create a note
export async function createNote(data: {
  userEmail: string;
  content: string;
  color?: string;
  isPinned?: boolean;
}): Promise<Note> {
  const [note] = await db.insert(notes).values({
    userEmail: data.userEmail,
    content: data.content,
    color: data.color || 'yellow',
    isPinned: data.isPinned || false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();
  return note;
}

// Update a note
export async function updateNote(
  id: string,
  data: Partial<{
    content: string;
    color: string;
    isPinned: boolean;
  }>
): Promise<Note | undefined> {
  const [note] = await db
    .update(notes)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(notes.id, id))
    .returning();
  return note;
}

// Toggle pin status
export async function toggleNotePin(id: string): Promise<Note | undefined> {
  // First get current pin status
  const existing = await getNoteById(id);
  if (!existing) return undefined;

  const [note] = await db
    .update(notes)
    .set({
      isPinned: !existing.isPinned,
      updatedAt: new Date(),
    })
    .where(eq(notes.id, id))
    .returning();
  return note;
}

// Delete a note
export async function deleteNote(id: string): Promise<boolean> {
  await db.delete(notes).where(eq(notes.id, id));
  return true;
}

// Get note count for user
export async function getNoteCount(userEmail: string): Promise<number> {
  const results = await db
    .select()
    .from(notes)
    .where(eq(notes.userEmail, userEmail));
  return results.length;
}
