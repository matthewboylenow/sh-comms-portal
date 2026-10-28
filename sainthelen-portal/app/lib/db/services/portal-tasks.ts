// app/lib/db/services/portal-tasks.ts
// The Tasks tab: one to-do list fed by the inbox scan, portal requests and
// quick adds. Built on the Command Center's tasks table with a few extra
// columns (see drizzle/0009_tasks_tab.sql).
import { and, desc, eq, isNull, lte, or, sql } from 'drizzle-orm';
import { db } from '../index';
import { tasks, type Task } from '../schema';

export type TaskSource = 'email' | 'portal' | 'manual';
export type TaskCategory = 'reply' | 'bulletin' | 'website' | 'calendar' | 'av' | 'admin' | 'other';
export type TaskImportance = 'normal' | 'high';
export type TaskStatus = 'open' | 'done' | 'snoozed';

export const CATEGORIES: TaskCategory[] = ['reply', 'website', 'bulletin', 'calendar', 'av', 'admin', 'other'];
export const CATEGORY_LABEL: Record<TaskCategory, string> = {
  reply: 'Replies',
  website: 'Website',
  bulletin: 'Bulletin',
  calendar: 'Calendar',
  av: 'A/V',
  admin: 'Admin',
  other: 'Other',
};

/** The owner of the list for now; the table keeps a user column for later. */
export const TASKS_OWNER = process.env.TASKS_OWNER_EMAIL || process.env.ADMIN_NOTIFICATION_EMAIL || 'mboyle@sainthelen.org';

export type TaskInput = {
  title: string;
  notes?: string | null;
  source?: TaskSource;
  source_ref?: string | null;
  source_link?: string | null;
  requester_name?: string | null;
  requester_email?: string | null;
  category?: TaskCategory;
  due_at?: string | null;
  importance?: TaskImportance;
};

export type TaskRow = {
  id: string;
  title: string;
  notes: string | null;
  source: TaskSource;
  source_ref: string | null;
  source_link: string | null;
  requester_name: string | null;
  requester_email: string | null;
  category: TaskCategory;
  due_at: string | null;
  importance: TaskImportance;
  status: TaskStatus;
  snoozed_until: string | null;
  created_at: string;
  completed_at: string | null;
};

let ready: Promise<void> | null = null;
function ensureColumns(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      for (const ddl of [
        `ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "source" varchar(20) DEFAULT 'manual'`,
        `ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "source_ref" varchar(500)`,
        `ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "source_link" text`,
        `ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "requester_name" varchar(255)`,
        `ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "requester_email" varchar(255)`,
        `ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "importance" varchar(20) DEFAULT 'normal'`,
        `ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "due_at" timestamptz`,
        `ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "snoozed_until" timestamptz`,
        `CREATE UNIQUE INDEX IF NOT EXISTS "tasks_source_ref_idx" ON "tasks" ("source_ref") WHERE "source_ref" IS NOT NULL`,
      ]) {
        await db.execute(sql.raw(ddl));
      }
    })().catch((err) => {
      ready = null;
      throw err;
    });
  }
  return ready;
}

const CATS = new Set<string>(CATEGORIES);
const asCategory = (c: unknown): TaskCategory => (typeof c === 'string' && CATS.has(c) ? (c as TaskCategory) : 'other');
const iso = (d: Date | string | null | undefined) => (d ? (d instanceof Date ? d : new Date(d)).toISOString() : null);

/** Old Command Center rows use pending/in_progress/completed; the tab reads open/done/snoozed. */
function statusOf(t: Task): TaskStatus {
  if (t.status === 'completed' || t.status === 'done') return 'done';
  if (t.snoozedUntil && new Date(t.snoozedUntil).getTime() > Date.now()) return 'snoozed';
  return 'open';
}

export function shape(t: Task): TaskRow {
  return {
    id: t.id,
    title: t.title,
    notes: t.description,
    source: ((t as any).source as TaskSource) || 'manual',
    source_ref: (t as any).sourceRef ?? null,
    source_link: (t as any).sourceLink ?? null,
    requester_name: (t as any).requesterName ?? null,
    requester_email: (t as any).requesterEmail ?? null,
    category: asCategory(t.category),
    due_at: iso((t as any).dueAt) || (t.dueDate ? `${t.dueDate}T${t.dueTime || '17:00:00'}` : null),
    importance: (t as any).importance === 'high' || t.priority === 'high' || t.priority === 'urgent' ? 'high' : 'normal',
    status: statusOf(t),
    snoozed_until: iso((t as any).snoozedUntil),
    created_at: iso(t.createdAt)!,
    completed_at: iso(t.completedAt),
  };
}

export async function listTasks(status: 'open' | 'done' = 'open', owner = TASKS_OWNER): Promise<TaskRow[]> {
  await ensureColumns();
  const rows = await db
    .select()
    .from(tasks)
    .where(eq(tasks.userEmail, owner))
    .orderBy(desc(tasks.createdAt));
  const now = Date.now();
  return rows
    .map(shape)
    .filter((t) =>
      status === 'done'
        ? t.status === 'done'
        : t.status !== 'done' && (!t.snoozed_until || new Date(t.snoozed_until).getTime() <= now)
    )
    .sort((a, b) => {
      if (status === 'done') return (b.completed_at || '').localeCompare(a.completed_at || '');
      return b.created_at.localeCompare(a.created_at);
    });
}

export async function getTask(id: string): Promise<TaskRow | undefined> {
  await ensureColumns();
  const [row] = await db.select().from(tasks).where(eq(tasks.id, id));
  return row ? shape(row) : undefined;
}

/** Create, or update the open task that already carries this source_ref. */
export async function upsertTask(input: TaskInput, owner = TASKS_OWNER): Promise<{ task: TaskRow; created: boolean }> {
  await ensureColumns();
  const title = (input.title || '').trim();
  if (!title) throw new Error('title is required');
  const values = {
    title: title.slice(0, 500),
    description: input.notes?.trim() || null,
    category: asCategory(input.category),
    priority: input.importance === 'high' ? 'high' : 'normal',
    source: input.source || 'manual',
    sourceRef: input.source_ref?.trim() || null,
    sourceLink: input.source_link?.trim() || null,
    requesterName: input.requester_name?.trim() || null,
    requesterEmail: input.requester_email?.trim() || null,
    importance: input.importance === 'high' ? 'high' : 'normal',
    dueAt: input.due_at ? new Date(input.due_at) : null,
    updatedAt: new Date(),
  };

  if (values.sourceRef) {
    const [existing] = await db.select().from(tasks).where(eq(tasks.sourceRef, values.sourceRef));
    if (existing) {
      if (statusOf(existing) === 'done') return { task: shape(existing), created: false };
      const [updated] = await db
        .update(tasks)
        .set({
          title: values.title,
          description: values.description ?? existing.description,
          dueAt: values.dueAt ?? (existing as any).dueAt,
          importance: values.importance === 'high' ? 'high' : (existing as any).importance,
          priority: values.importance === 'high' ? 'high' : existing.priority,
          sourceLink: values.sourceLink ?? (existing as any).sourceLink,
          updatedAt: new Date(),
        })
        .where(eq(tasks.id, existing.id))
        .returning();
      return { task: shape(updated), created: false };
    }
  }

  const [row] = await db
    .insert(tasks)
    .values({ userEmail: owner, status: 'pending', ...values })
    .returning();
  return { task: shape(row), created: true };
}

export type TaskPatch = Partial<{
  title: string;
  notes: string | null;
  category: TaskCategory;
  due_at: string | null;
  importance: TaskImportance;
  status: 'open' | 'done';
  snoozed_until: string | null;
  requester_name: string | null;
  requester_email: string | null;
}>;

export async function patchTask(id: string, p: TaskPatch): Promise<TaskRow | undefined> {
  await ensureColumns();
  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (p.title !== undefined) set.title = p.title.trim().slice(0, 500);
  if (p.notes !== undefined) set.description = p.notes?.trim() || null;
  if (p.category !== undefined) set.category = asCategory(p.category);
  if (p.due_at !== undefined) set.dueAt = p.due_at ? new Date(p.due_at) : null;
  if (p.importance !== undefined) {
    set.importance = p.importance === 'high' ? 'high' : 'normal';
    set.priority = p.importance === 'high' ? 'high' : 'normal';
  }
  if (p.requester_name !== undefined) set.requesterName = p.requester_name;
  if (p.requester_email !== undefined) set.requesterEmail = p.requester_email;
  if (p.snoozed_until !== undefined) set.snoozedUntil = p.snoozed_until ? new Date(p.snoozed_until) : null;
  if (p.status === 'done') {
    set.status = 'completed';
    set.completedAt = new Date();
    set.snoozedUntil = null;
  } else if (p.status === 'open') {
    set.status = 'pending';
    set.completedAt = null;
    if (p.snoozed_until === undefined) set.snoozedUntil = null;
  }
  const [row] = await db.update(tasks).set(set).where(eq(tasks.id, id)).returning();
  return row ? shape(row) : undefined;
}

export async function deleteTask(id: string): Promise<boolean> {
  await ensureColumns();
  const rows = await db.delete(tasks).where(eq(tasks.id, id)).returning({ id: tasks.id });
  return rows.length > 0;
}

/** Open tasks that are high importance or due within 48 hours. */
export async function digestTasks(owner = TASKS_OWNER): Promise<TaskRow[]> {
  const soon = Date.now() + 48 * 3600 * 1000;
  const open = await listTasks('open', owner);
  return open
    .filter((t) => t.importance === 'high' || (t.due_at && new Date(t.due_at).getTime() <= soon))
    .sort((a, b) => (a.due_at || '9').localeCompare(b.due_at || '9'));
}

/** Set done/open on the task linked to a portal request, if one exists. */
export async function setPortalTaskDone(sourceRef: string, done: boolean): Promise<void> {
  await ensureColumns();
  const [existing] = await db.select().from(tasks).where(eq(tasks.sourceRef, sourceRef));
  if (!existing) return;
  await patchTask(existing.id, { status: done ? 'done' : 'open' });
}
