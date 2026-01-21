import { db } from '../index';
import { notifications, type Notification, type NewNotification } from '../schema';
import { eq, and, desc, inArray } from 'drizzle-orm';

/**
 * Notifications Service
 */

// Get notifications for a user
export async function getNotificationsForUser(
  userEmail: string,
  limit = 100
): Promise<Notification[]> {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userEmail, userEmail))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

// Get unread notifications for a user
export async function getUnreadNotifications(userEmail: string): Promise<Notification[]> {
  return db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.userEmail, userEmail),
        eq(notifications.isRead, false)
      )
    )
    .orderBy(desc(notifications.createdAt));
}

// Get notification by ID
export async function getNotificationById(id: string): Promise<Notification | undefined> {
  const results = await db.select().from(notifications).where(eq(notifications.id, id));
  return results[0];
}

// Create a notification
export async function createNotification(data: {
  userEmail: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  relatedRecordId?: string;
  relatedRecordType?: string;
}): Promise<Notification> {
  const [notification] = await db.insert(notifications).values({
    ...data,
    isRead: false,
    createdAt: new Date(),
  }).returning();
  return notification;
}

// Mark notification as read
export async function markNotificationAsRead(id: string): Promise<Notification | undefined> {
  const [notification] = await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.id, id))
    .returning();
  return notification;
}

// Mark all notifications as read for a user
export async function markAllNotificationsAsRead(userEmail: string): Promise<number> {
  // Get unread notifications first
  const unread = await getUnreadNotifications(userEmail);

  if (unread.length === 0) return 0;

  // Update them
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(
        eq(notifications.userEmail, userEmail),
        eq(notifications.isRead, false)
      )
    );

  return unread.length;
}

// Delete notification
export async function deleteNotification(id: string): Promise<boolean> {
  await db.delete(notifications).where(eq(notifications.id, id));
  return true;
}

// Delete all notifications for a user
export async function deleteAllNotificationsForUser(userEmail: string): Promise<boolean> {
  await db.delete(notifications).where(eq(notifications.userEmail, userEmail));
  return true;
}
