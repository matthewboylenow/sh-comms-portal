import { db } from '../index';
import { recurringReminders, type RecurringReminder, type NewRecurringReminder } from '../schema';
import { eq, and, desc, asc } from 'drizzle-orm';

/**
 * Recurring Reminders Service - Manage recurring task templates
 */

// Get all recurring reminders for a user
export async function getRemindersForUser(
  userEmail: string,
  activeOnly = true
): Promise<RecurringReminder[]> {
  const conditions = [eq(recurringReminders.userEmail, userEmail)];

  if (activeOnly) {
    conditions.push(eq(recurringReminders.isActive, true));
  }

  return db
    .select()
    .from(recurringReminders)
    .where(and(...conditions))
    .orderBy(asc(recurringReminders.dayOfWeek), asc(recurringReminders.timeOfDay));
}

// Get reminders by frequency
export async function getRemindersByFrequency(
  userEmail: string,
  frequency: string
): Promise<RecurringReminder[]> {
  return db
    .select()
    .from(recurringReminders)
    .where(
      and(
        eq(recurringReminders.userEmail, userEmail),
        eq(recurringReminders.frequency, frequency),
        eq(recurringReminders.isActive, true)
      )
    )
    .orderBy(asc(recurringReminders.timeOfDay));
}

// Get reminders for a specific day of week
export async function getRemindersForDayOfWeek(
  userEmail: string,
  dayOfWeek: number
): Promise<RecurringReminder[]> {
  return db
    .select()
    .from(recurringReminders)
    .where(
      and(
        eq(recurringReminders.userEmail, userEmail),
        eq(recurringReminders.dayOfWeek, dayOfWeek),
        eq(recurringReminders.isActive, true)
      )
    )
    .orderBy(asc(recurringReminders.timeOfDay));
}

// Get reminder by ID
export async function getReminderById(id: string): Promise<RecurringReminder | undefined> {
  const results = await db.select().from(recurringReminders).where(eq(recurringReminders.id, id));
  return results[0];
}

// Create a recurring reminder
export async function createReminder(data: {
  userEmail: string;
  title: string;
  description?: string;
  category: string;
  frequency: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  timeOfDay?: string;
  priority?: string;
}): Promise<RecurringReminder> {
  const [reminder] = await db.insert(recurringReminders).values({
    userEmail: data.userEmail,
    title: data.title,
    description: data.description,
    category: data.category,
    frequency: data.frequency,
    dayOfWeek: data.dayOfWeek,
    dayOfMonth: data.dayOfMonth,
    timeOfDay: data.timeOfDay,
    priority: data.priority || 'normal',
    isActive: true,
    createdAt: new Date(),
  }).returning();
  return reminder;
}

// Update a recurring reminder
export async function updateReminder(
  id: string,
  data: Partial<{
    title: string;
    description: string;
    category: string;
    frequency: string;
    dayOfWeek: number;
    dayOfMonth: number;
    timeOfDay: string;
    priority: string;
    isActive: boolean;
  }>
): Promise<RecurringReminder | undefined> {
  const [reminder] = await db
    .update(recurringReminders)
    .set(data)
    .where(eq(recurringReminders.id, id))
    .returning();
  return reminder;
}

// Toggle active status
export async function toggleReminderActive(id: string): Promise<RecurringReminder | undefined> {
  const existing = await getReminderById(id);
  if (!existing) return undefined;

  const [reminder] = await db
    .update(recurringReminders)
    .set({ isActive: !existing.isActive })
    .where(eq(recurringReminders.id, id))
    .returning();
  return reminder;
}

// Update last generated timestamp
export async function updateLastGenerated(id: string): Promise<RecurringReminder | undefined> {
  const [reminder] = await db
    .update(recurringReminders)
    .set({ lastGeneratedAt: new Date() })
    .where(eq(recurringReminders.id, id))
    .returning();
  return reminder;
}

// Delete a recurring reminder
export async function deleteReminder(id: string): Promise<boolean> {
  await db.delete(recurringReminders).where(eq(recurringReminders.id, id));
  return true;
}

// Seed default reminders for a user
export async function seedDefaultReminders(userEmail: string): Promise<RecurringReminder[]> {
  const defaultReminders = [
    // Daily reminders
    {
      userEmail,
      title: 'Social Media - Morning Post',
      description: 'Post 1-2 social media posts for the day',
      category: 'misc',
      frequency: 'daily',
      timeOfDay: '09:00:00',
      priority: 'normal',
    },
    {
      userEmail,
      title: 'Social Media - Afternoon Post + Stories',
      description: 'Afternoon social media post and Instagram/Facebook stories',
      category: 'misc',
      frequency: 'daily',
      timeOfDay: '14:00:00',
      priority: 'normal',
    },
    // Wednesday
    {
      userEmail,
      title: 'EMAIL BLAST DEADLINE',
      description: 'Final deadline for Wednesday email blast content',
      category: 'announcement',
      frequency: 'weekly',
      dayOfWeek: 3, // Wednesday
      timeOfDay: '11:30:00',
      priority: 'urgent',
    },
    // Saturday
    {
      userEmail,
      title: 'Pre-Mass Announcement Screens',
      description: 'Update and verify pre-mass announcement slides',
      category: 'av',
      frequency: 'weekly',
      dayOfWeek: 6, // Saturday
      timeOfDay: '08:00:00',
      priority: 'high',
    },
    {
      userEmail,
      title: 'Print 450 Bulletins',
      description: 'Print weekend bulletins (450 copies)',
      category: 'misc',
      frequency: 'weekly',
      dayOfWeek: 6,
      timeOfDay: '09:00:00',
      priority: 'high',
    },
    {
      userEmail,
      title: 'Create "Pregame" Video',
      description: 'Create 45-60 second pregame video for Mass',
      category: 'av',
      frequency: 'weekly',
      dayOfWeek: 6,
      timeOfDay: '10:00:00',
      priority: 'high',
    },
    // Sunday
    {
      userEmail,
      title: 'Record/Edit/Release "5 AND THRIVE"',
      description: 'Record, edit, and release the weekly 5 AND THRIVE video',
      category: 'av',
      frequency: 'weekly',
      dayOfWeek: 0, // Sunday
      timeOfDay: '14:00:00',
      priority: 'high',
    },
  ];

  const createdReminders: RecurringReminder[] = [];

  for (const reminder of defaultReminders) {
    const [created] = await db.insert(recurringReminders).values({
      ...reminder,
      isActive: true,
      createdAt: new Date(),
    }).returning();
    createdReminders.push(created);
  }

  return createdReminders;
}

// Get all daily reminders that should generate tasks
export async function getDailyRemindersToGenerate(): Promise<RecurringReminder[]> {
  return db
    .select()
    .from(recurringReminders)
    .where(
      and(
        eq(recurringReminders.frequency, 'daily'),
        eq(recurringReminders.isActive, true)
      )
    );
}

// Get weekly reminders for today
export async function getWeeklyRemindersForToday(dayOfWeek: number): Promise<RecurringReminder[]> {
  return db
    .select()
    .from(recurringReminders)
    .where(
      and(
        eq(recurringReminders.frequency, 'weekly'),
        eq(recurringReminders.dayOfWeek, dayOfWeek),
        eq(recurringReminders.isActive, true)
      )
    );
}
