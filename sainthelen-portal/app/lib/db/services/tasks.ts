import { db } from '../index';
import { tasks, type Task, type NewTask } from '../schema';
import { eq, and, desc, asc, gte, lte, or, isNull } from 'drizzle-orm';

/**
 * Tasks Service - CRUD operations for Command Center tasks
 */

// Get all tasks for a user
export async function getTasksForUser(
  userEmail: string,
  options?: {
    status?: string;
    includeCompleted?: boolean;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<Task[]> {
  const conditions = [eq(tasks.userEmail, userEmail)];

  if (options?.status) {
    conditions.push(eq(tasks.status, options.status));
  }

  if (!options?.includeCompleted) {
    conditions.push(
      or(
        eq(tasks.status, 'pending'),
        eq(tasks.status, 'in_progress')
      )!
    );
  }

  if (options?.startDate) {
    conditions.push(gte(tasks.dueDate, options.startDate.toISOString().split('T')[0]));
  }

  if (options?.endDate) {
    conditions.push(lte(tasks.dueDate, options.endDate.toISOString().split('T')[0]));
  }

  return db
    .select()
    .from(tasks)
    .where(and(...conditions))
    .orderBy(asc(tasks.dueDate), asc(tasks.dueTime), desc(tasks.priority));
}

// Get tasks for a specific date
export async function getTasksForDate(
  userEmail: string,
  date: string,
  options?: { includeCompleted?: boolean }
): Promise<Task[]> {
  const conditions = [
    eq(tasks.userEmail, userEmail),
    eq(tasks.dueDate, date),
  ];

  if (!options?.includeCompleted) {
    conditions.push(
      or(
        eq(tasks.status, 'pending'),
        eq(tasks.status, 'in_progress')
      )!
    );
  }

  return db
    .select()
    .from(tasks)
    .where(and(...conditions))
    .orderBy(asc(tasks.dueTime), desc(tasks.priority));
}

// Get tasks for a date range (week view)
export async function getTasksForDateRange(
  userEmail: string,
  startDate: string,
  endDate: string,
  options?: { includeCompleted?: boolean }
): Promise<Task[]> {
  const conditions = [
    eq(tasks.userEmail, userEmail),
    gte(tasks.dueDate, startDate),
    lte(tasks.dueDate, endDate),
  ];

  if (!options?.includeCompleted) {
    conditions.push(
      or(
        eq(tasks.status, 'pending'),
        eq(tasks.status, 'in_progress')
      )!
    );
  }

  return db
    .select()
    .from(tasks)
    .where(and(...conditions))
    .orderBy(asc(tasks.dueDate), asc(tasks.dueTime), desc(tasks.priority));
}

// Get overdue tasks
export async function getOverdueTasks(userEmail: string): Promise<Task[]> {
  const today = new Date().toISOString().split('T')[0];
  return db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.userEmail, userEmail),
        lte(tasks.dueDate, today),
        or(
          eq(tasks.status, 'pending'),
          eq(tasks.status, 'in_progress')
        )
      )
    )
    .orderBy(asc(tasks.dueDate), desc(tasks.priority));
}

// Get task by ID
export async function getTaskById(id: string): Promise<Task | undefined> {
  const results = await db.select().from(tasks).where(eq(tasks.id, id));
  return results[0];
}

// Create a task
export async function createTask(data: {
  userEmail: string;
  title: string;
  description?: string;
  category: string;
  priority?: string;
  dueDate?: string;
  dueTime?: string;
  linkedRecordId?: string;
  linkedRecordType?: string;
  recurringReminderId?: string;
}): Promise<Task> {
  const [task] = await db.insert(tasks).values({
    userEmail: data.userEmail,
    title: data.title,
    description: data.description,
    category: data.category,
    priority: data.priority || 'normal',
    status: 'pending',
    dueDate: data.dueDate,
    dueTime: data.dueTime,
    linkedRecordId: data.linkedRecordId,
    linkedRecordType: data.linkedRecordType,
    recurringReminderId: data.recurringReminderId,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();
  return task;
}

// Update a task
export async function updateTask(
  id: string,
  data: Partial<{
    title: string;
    description: string;
    category: string;
    priority: string;
    status: string;
    dueDate: string;
    dueTime: string;
  }>
): Promise<Task | undefined> {
  const [task] = await db
    .update(tasks)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, id))
    .returning();
  return task;
}

// Complete a task
export async function completeTask(id: string): Promise<Task | undefined> {
  const [task] = await db
    .update(tasks)
    .set({
      status: 'completed',
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, id))
    .returning();
  return task;
}

// Uncomplete a task (reopen)
export async function uncompleteTask(id: string): Promise<Task | undefined> {
  const [task] = await db
    .update(tasks)
    .set({
      status: 'pending',
      completedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, id))
    .returning();
  return task;
}

// Delete a task
export async function deleteTask(id: string): Promise<boolean> {
  await db.delete(tasks).where(eq(tasks.id, id));
  return true;
}

// Get tasks linked to a specific record
export async function getTasksLinkedToRecord(
  recordId: string,
  recordType: string
): Promise<Task[]> {
  return db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.linkedRecordId, recordId),
        eq(tasks.linkedRecordType, recordType)
      )
    );
}

// Get pending task count for user
export async function getPendingTaskCount(userEmail: string): Promise<number> {
  const results = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.userEmail, userEmail),
        or(
          eq(tasks.status, 'pending'),
          eq(tasks.status, 'in_progress')
        )
      )
    );
  return results.length;
}
