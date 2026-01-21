import { db } from '../index';
import { announcements, type Announcement, type NewAnnouncement } from '../schema';
import { eq, and, or, desc, inArray } from 'drizzle-orm';

/**
 * Announcement Service - Database operations for announcements
 */

// Get all announcements with optional filters
export async function getAnnouncements(options: {
  status?: 'pending' | 'approved' | 'rejected';
  requiresApproval?: boolean;
  ministries?: string[];
  limit?: number;
  includeCompleted?: boolean; // Default false - hides completed items
} = {}): Promise<Announcement[]> {
  let query = db.select().from(announcements);

  const conditions = [];

  // By default, exclude completed items unless explicitly requested
  if (!options.includeCompleted) {
    conditions.push(eq(announcements.completed, false));
  }

  if (options.status) {
    conditions.push(eq(announcements.approvalStatus, options.status));
  }

  if (options.requiresApproval !== undefined) {
    conditions.push(eq(announcements.requiresApproval, options.requiresApproval));
  }

  if (options.ministries && options.ministries.length > 0) {
    const ministryConditions = options.ministries.map(m => eq(announcements.ministry, m));
    conditions.push(or(...ministryConditions)!);
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  query = query.orderBy(desc(announcements.submittedAt)) as any;

  if (options.limit) {
    query = query.limit(options.limit) as any;
  }

  return query;
}

// Get announcement by ID
export async function getAnnouncementById(id: string): Promise<Announcement | undefined> {
  const results = await db.select().from(announcements).where(eq(announcements.id, id));
  return results[0];
}

// Get pending announcements requiring approval
export async function getPendingApprovals(ministryFilter?: string[]): Promise<Announcement[]> {
  return getAnnouncements({
    status: 'pending',
    requiresApproval: true,
    ministries: ministryFilter,
  });
}

// Create a new announcement
export async function createAnnouncement(data: NewAnnouncement): Promise<Announcement> {
  const [announcement] = await db.insert(announcements).values({
    ...data,
    submittedAt: new Date(),
    createdAt: new Date(),
  }).returning();
  return announcement;
}

// Update announcement
export async function updateAnnouncement(
  id: string,
  data: Partial<Omit<NewAnnouncement, 'id'>>
): Promise<Announcement | undefined> {
  const [announcement] = await db
    .update(announcements)
    .set(data)
    .where(eq(announcements.id, id))
    .returning();
  return announcement;
}

// Approve announcement
export async function approveAnnouncement(
  id: string,
  approvedBy: string
): Promise<Announcement | undefined> {
  return updateAnnouncement(id, {
    approvalStatus: 'approved',
    approvedBy,
    approvedAt: new Date(),
    rejectionReason: null,
  });
}

// Reject announcement
export async function rejectAnnouncement(
  id: string,
  approvedBy: string,
  rejectionReason: string
): Promise<Announcement | undefined> {
  return updateAnnouncement(id, {
    approvalStatus: 'rejected',
    approvedBy,
    approvedAt: new Date(),
    rejectionReason,
  });
}

// Bulk approve announcements
export async function bulkApproveAnnouncements(
  ids: string[],
  approvedBy: string
): Promise<void> {
  await db
    .update(announcements)
    .set({
      approvalStatus: 'approved',
      approvedBy,
      approvedAt: new Date(),
    })
    .where(inArray(announcements.id, ids));
}

// Bulk reject announcements
export async function bulkRejectAnnouncements(
  ids: string[],
  approvedBy: string,
  rejectionReason: string
): Promise<void> {
  await db
    .update(announcements)
    .set({
      approvalStatus: 'rejected',
      approvedBy,
      approvedAt: new Date(),
      rejectionReason,
    })
    .where(inArray(announcements.id, ids));
}

// Update WordPress event info
export async function updateWordPressEventInfo(
  id: string,
  wpEventId: number,
  wpEventUrl: string
): Promise<Announcement | undefined> {
  return updateAnnouncement(id, {
    wordpressEventId: wpEventId,
    wordpressEventUrl: wpEventUrl,
  });
}

// Delete announcement
export async function deleteAnnouncement(id: string): Promise<boolean> {
  await db.delete(announcements).where(eq(announcements.id, id));
  return true;
}

// Get announcements by email
export async function getAnnouncementsByEmail(email: string): Promise<Announcement[]> {
  return db
    .select()
    .from(announcements)
    .where(eq(announcements.email, email))
    .orderBy(desc(announcements.submittedAt));
}

// Mark announcement as completed
export async function markCompleted(id: string, completed: boolean): Promise<Announcement | undefined> {
  const [announcement] = await db
    .update(announcements)
    .set({
      completed,
      completedDate: completed ? new Date() : null,
    })
    .where(eq(announcements.id, id))
    .returning();
  return announcement;
}
