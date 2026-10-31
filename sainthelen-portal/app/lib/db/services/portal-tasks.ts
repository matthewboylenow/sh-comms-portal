// app/lib/db/services/portal-tasks.ts
// The Tasks tab: one to-do list fed by the inbox scan, Teams, portal
// requests and quick adds. Every change that matters is written to
// task_events so there is always a trail for why a task is where it is.
import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '../index';
import { portalTasks, taskEvents, type PortalTask, type TaskEvent } from '../schema';

export type TaskSource = 'email' | 'teams' | 'portal' | 'manual';
export type TaskCategory = 'reply' | 'bulletin' | 'website' | 'calendar' | 'av' | 'admin' | 'other';
export type TaskImportance = 'normal' | 'high';
/** open → in_progress → claimed_done → done. Snoozing is a date, not a status. */
export type TaskStatus = 'open' | 'in_progress' | 'claimed_done' | 'done';
export type EventKind =
  | 'created'
  | 'follow_up'
  | 'commitment'
  | 'in_progress'
  | 'claimed_done'
  | 'verified_done'
  | 'done'
  | 'reopened'
  | 'edited'
  | 'snoozed'
  | 'note';

export const CATEGORIES: TaskCategory[] = ['reply', 'website', 'bulletin', 'calendar', 'av', 'admin', 'other'];

/** The owner of the list for now; the table keeps a column for later. */
export const TASKS_OWNER = (process.env.TASKS_OWNER_EMAIL || process.env.MAILBOX_TO_SEND_FROM || 'mboyle@sainthelen.org').toLowerCase();

export type TaskRow = {
  id: string;
  title: string;
  notes: string | null;
  source: TaskSource;
  source_ref: string | null;
  source_link: string | null;
  conversation_id: string | null;
  requester_name: string | null;
  requester_email: string | null;
  category: TaskCategory;
  due_at: string | null;
  importance: TaskImportance;
  status: TaskStatus;
  snoozed_until: string | null;
  first_requested_at: string | null;
  last_follow_up_at: string | null;
  follow_up_count: number;
  committed_for: string | null;
  page_url: string | null;
  completion_confidence: number | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

export type TaskInput = {
  title: string;
  notes?: string | null;
  source?: TaskSource;
  source_ref?: string | null;
  source_link?: string | null;
  conversation_id?: string | null;
  requester_name?: string | null;
  requester_email?: string | null;
  category?: TaskCategory;
  due_at?: string | null;
  importance?: TaskImportance;
  page_url?: string | null;
  requested_at?: string | null;
  actor?: string;
};

export type TaskPatch = Partial<{
  title: string;
  notes: string | null;
  category: TaskCategory;
  due_at: string | null;
  importance: TaskImportance;
  status: TaskStatus;
  snoozed_until: string | null;
  requester_name: string | null;
  requester_email: string | null;
  page_url: string | null;
}>;

/* ------------------------------------------------------------------ setup */

let ready: Promise<void> | null = null;
function ensureTables(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      for (const ddl of [
        `CREATE TABLE IF NOT EXISTS "portal_tasks" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "owner_email" varchar(255) NOT NULL,
          "title" text NOT NULL,
          "notes" text,
          "source" varchar(20) DEFAULT 'manual' NOT NULL,
          "source_ref" varchar(500),
          "source_link" text,
          "conversation_id" varchar(500),
          "requester_name" varchar(255),
          "requester_email" varchar(255),
          "category" varchar(20) DEFAULT 'other' NOT NULL,
          "due_at" timestamptz,
          "importance" varchar(20) DEFAULT 'normal' NOT NULL,
          "status" varchar(20) DEFAULT 'open' NOT NULL,
          "snoozed_until" timestamptz,
          "first_requested_at" timestamptz,
          "last_follow_up_at" timestamptz,
          "follow_up_count" integer DEFAULT 0 NOT NULL,
          "committed_for" timestamptz,
          "page_url" varchar(1000),
          "page_hash" varchar(64),
          "completion_confidence" integer,
          "created_at" timestamptz DEFAULT now() NOT NULL,
          "updated_at" timestamptz DEFAULT now() NOT NULL,
          "completed_at" timestamptz
        )`,
        `CREATE UNIQUE INDEX IF NOT EXISTS "portal_tasks_source_ref_idx" ON "portal_tasks" ("source_ref") WHERE "source_ref" IS NOT NULL`,
        `CREATE INDEX IF NOT EXISTS "portal_tasks_owner_status_idx" ON "portal_tasks" ("owner_email", "status")`,
        `CREATE TABLE IF NOT EXISTS "task_events" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "task_id" uuid NOT NULL,
          "kind" varchar(30) NOT NULL,
          "detail" text,
          "confidence" integer,
          "source_ref" varchar(500),
          "source_link" text,
          "actor" varchar(255),
          "created_at" timestamptz DEFAULT now() NOT NULL
        )`,
        `CREATE INDEX IF NOT EXISTS "task_events_task_idx" ON "task_events" ("task_id")`,
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

/* ---------------------------------------------------------------- helpers */

const CATS = new Set<string>(CATEGORIES);
const asCategory = (c: unknown): TaskCategory => (typeof c === 'string' && CATS.has(c) ? (c as TaskCategory) : 'other');
const asStatus = (s: unknown): TaskStatus =>
  s === 'done' || s === 'in_progress' || s === 'claimed_done' ? s : 'open';
const iso = (d: Date | string | null | undefined) => (d ? (d instanceof Date ? d : new Date(d)).toISOString() : null);
const dateOrNull = (s: string | null | undefined) => (s ? new Date(s) : null);

export function shape(t: PortalTask): TaskRow {
  return {
    id: t.id,
    title: t.title,
    notes: t.notes,
    source: t.source as TaskSource,
    source_ref: t.sourceRef,
    source_link: t.sourceLink,
    conversation_id: t.conversationId,
    requester_name: t.requesterName,
    requester_email: t.requesterEmail,
    category: asCategory(t.category),
    due_at: iso(t.dueAt),
    importance: t.importance === 'high' ? 'high' : 'normal',
    status: asStatus(t.status),
    snoozed_until: iso(t.snoozedUntil),
    first_requested_at: iso(t.firstRequestedAt),
    last_follow_up_at: iso(t.lastFollowUpAt),
    follow_up_count: t.followUpCount || 0,
    committed_for: iso(t.committedFor),
    page_url: t.pageUrl,
    completion_confidence: t.completionConfidence,
    created_at: iso(t.createdAt)!,
    updated_at: iso(t.updatedAt)!,
    completed_at: iso(t.completedAt),
  };
}

export async function logEvent(
  taskId: string,
  kind: EventKind,
  detail?: string | null,
  extra: { confidence?: number | null; sourceRef?: string | null; sourceLink?: string | null; actor?: string | null } = {}
): Promise<void> {
  await ensureTables();
  await db.insert(taskEvents).values({
    taskId,
    kind,
    detail: detail || null,
    confidence: extra.confidence ?? null,
    sourceRef: extra.sourceRef || null,
    sourceLink: extra.sourceLink || null,
    actor: extra.actor || null,
  });
}

/* ------------------------------------------------------------------ reads */

export async function listTasks(view: 'open' | 'done' = 'open', owner = TASKS_OWNER): Promise<TaskRow[]> {
  await ensureTables();
  const rows = await db
    .select()
    .from(portalTasks)
    .where(view === 'done' ? and(eq(portalTasks.ownerEmail, owner), eq(portalTasks.status, 'done')) : eq(portalTasks.ownerEmail, owner))
    .orderBy(desc(portalTasks.createdAt));
  const now = Date.now();
  const shaped = rows.map(shape);
  if (view === 'done') return shaped.sort((a, b) => (b.completed_at || '').localeCompare(a.completed_at || ''));
  return shaped
    .filter((t) => t.status !== 'done' && (!t.snoozed_until || new Date(t.snoozed_until).getTime() <= now))
    .sort((a, b) => {
      // the most-chased and the most urgent float up within the newest-first order
      const score = (t: TaskRow) => (t.importance === 'high' ? 2 : 0) + Math.min(t.follow_up_count, 3);
      return score(b) - score(a) || b.created_at.localeCompare(a.created_at);
    });
}

/** Every open task including snoozed ones; what the scan compares against. */
export async function openTasksForMatching(owner = TASKS_OWNER): Promise<TaskRow[]> {
  await ensureTables();
  const rows = await db
    .select()
    .from(portalTasks)
    .where(eq(portalTasks.ownerEmail, owner))
    .orderBy(desc(portalTasks.createdAt));
  return rows.map(shape).filter((t) => t.status !== 'done');
}

export async function getTask(id: string): Promise<TaskRow | undefined> {
  await ensureTables();
  const [row] = await db.select().from(portalTasks).where(eq(portalTasks.id, id));
  return row ? shape(row) : undefined;
}

export async function getTaskBySourceRef(ref: string): Promise<TaskRow | undefined> {
  await ensureTables();
  const [row] = await db.select().from(portalTasks).where(eq(portalTasks.sourceRef, ref));
  return row ? shape(row) : undefined;
}

export async function getTaskBySourceRefPrefix(prefix: string): Promise<TaskRow[]> {
  await ensureTables();
  const rows = await db.select().from(portalTasks).where(sql`${portalTasks.sourceRef} LIKE ${prefix + '%'}`);
  return rows.map(shape);
}

export async function getEvents(taskId: string): Promise<TaskEvent[]> {
  await ensureTables();
  return db.select().from(taskEvents).where(eq(taskEvents.taskId, taskId)).orderBy(desc(taskEvents.createdAt));
}

/* ----------------------------------------------------------------- writes */

/** Create, or refresh the open task that already carries this source_ref. */
export async function upsertTask(input: TaskInput, owner = TASKS_OWNER): Promise<{ task: TaskRow; created: boolean }> {
  await ensureTables();
  const title = (input.title || '').trim();
  if (!title) throw new Error('title is required');
  const ref = input.source_ref?.trim() || null;

  if (ref) {
    const existing = await getTaskBySourceRef(ref);
    if (existing) {
      if (existing.status === 'done') return { task: existing, created: false };
      const task = await patchTask(existing.id, {
        title,
        notes: input.notes ?? existing.notes,
        due_at: input.due_at ?? existing.due_at,
        importance: input.importance === 'high' ? 'high' : existing.importance,
      });
      await logEvent(existing.id, 'edited', 'Refreshed from the source', { sourceRef: ref, sourceLink: input.source_link, actor: input.actor || 'scan' });
      return { task: task!, created: false };
    }
  }

  const requestedAt = dateOrNull(input.requested_at) || new Date();
  const [row] = await db
    .insert(portalTasks)
    .values({
      ownerEmail: owner,
      title: title.slice(0, 500),
      notes: input.notes?.trim() || null,
      source: input.source || 'manual',
      sourceRef: ref,
      sourceLink: input.source_link?.trim() || null,
      conversationId: input.conversation_id?.trim() || null,
      requesterName: input.requester_name?.trim() || null,
      requesterEmail: input.requester_email?.trim().toLowerCase() || null,
      category: asCategory(input.category),
      dueAt: dateOrNull(input.due_at),
      importance: input.importance === 'high' ? 'high' : 'normal',
      status: 'open',
      firstRequestedAt: requestedAt,
      lastFollowUpAt: requestedAt,
      pageUrl: input.page_url?.trim() || null,
    })
    .returning();
  await logEvent(row.id, 'created', input.notes?.trim() || title, { sourceRef: ref, sourceLink: input.source_link, actor: input.actor || (input.source === 'manual' ? owner : 'scan') });
  return { task: shape(row), created: true };
}

export async function patchTask(id: string, p: TaskPatch, actor?: string): Promise<TaskRow | undefined> {
  await ensureTables();
  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (p.title !== undefined) set.title = p.title.trim().slice(0, 500);
  if (p.notes !== undefined) set.notes = p.notes?.trim() || null;
  if (p.category !== undefined) set.category = asCategory(p.category);
  if (p.due_at !== undefined) set.dueAt = dateOrNull(p.due_at);
  if (p.importance !== undefined) set.importance = p.importance === 'high' ? 'high' : 'normal';
  if (p.requester_name !== undefined) set.requesterName = p.requester_name;
  if (p.requester_email !== undefined) set.requesterEmail = p.requester_email?.toLowerCase() || null;
  if (p.page_url !== undefined) set.pageUrl = p.page_url;
  if (p.snoozed_until !== undefined) set.snoozedUntil = dateOrNull(p.snoozed_until);
  if (p.status !== undefined) {
    set.status = asStatus(p.status);
    if (p.status === 'done') {
      set.completedAt = new Date();
      set.snoozedUntil = null;
    } else {
      set.completedAt = null;
    }
  }
  const [row] = await db.update(portalTasks).set(set).where(eq(portalTasks.id, id)).returning();
  if (!row) return undefined;
  if (p.status === 'done') await logEvent(id, 'done', null, { actor });
  else if (p.status === 'open') await logEvent(id, 'reopened', null, { actor });
  else if (p.snoozed_until) await logEvent(id, 'snoozed', `Until ${new Date(p.snoozed_until).toLocaleDateString('en-US', { timeZone: 'America/New_York' })}`, { actor });
  return shape(row);
}

export async function deleteTask(id: string): Promise<boolean> {
  await ensureTables();
  const rows = await db.delete(portalTasks).where(eq(portalTasks.id, id)).returning({ id: portalTasks.id });
  await db.delete(taskEvents).where(eq(taskEvents.taskId, id));
  return rows.length > 0;
}

/* ------------------------------------------------- signals from the scan */

/** Someone chased an existing task. More chasing raises its visibility. */
export async function recordFollowUp(
  id: string,
  d: { at: string; sourceRef?: string | null; sourceLink?: string | null; detail?: string | null; dueAt?: string | null }
): Promise<void> {
  await ensureTables();
  const t = await getTask(id);
  if (!t) return;
  const count = t.follow_up_count + 1;
  await db
    .update(portalTasks)
    .set({
      followUpCount: count,
      lastFollowUpAt: new Date(d.at),
      importance: count >= 2 || t.importance === 'high' ? 'high' : 'normal',
      dueAt: d.dueAt ? new Date(d.dueAt) : t.due_at ? new Date(t.due_at) : null,
      snoozedUntil: null,
      updatedAt: new Date(),
    })
    .where(eq(portalTasks.id, id));
  await logEvent(id, 'follow_up', d.detail || `Follow-up ${count}`, { sourceRef: d.sourceRef, sourceLink: d.sourceLink, actor: 'scan' });
}

/** The director said they would do it ("I'll get to that today"). Not completion. */
export async function recordCommitment(
  id: string,
  d: { committedFor: string | null; sourceRef?: string | null; sourceLink?: string | null; detail?: string | null }
): Promise<void> {
  await ensureTables();
  await db
    .update(portalTasks)
    .set({ committedFor: dateOrNull(d.committedFor), status: 'in_progress', updatedAt: new Date() })
    .where(and(eq(portalTasks.id, id), eq(portalTasks.status, 'open')));
  await db.update(portalTasks).set({ committedFor: dateOrNull(d.committedFor), updatedAt: new Date() }).where(eq(portalTasks.id, id));
  await logEvent(id, 'commitment', d.detail || null, { sourceRef: d.sourceRef, sourceLink: d.sourceLink, actor: 'scan' });
}

export async function recordInProgress(id: string, d: { sourceRef?: string | null; sourceLink?: string | null; detail?: string | null }): Promise<void> {
  await ensureTables();
  await db
    .update(portalTasks)
    .set({ status: 'in_progress', updatedAt: new Date() })
    .where(and(eq(portalTasks.id, id), eq(portalTasks.status, 'open')));
  await logEvent(id, 'in_progress', d.detail || null, { sourceRef: d.sourceRef, sourceLink: d.sourceLink, actor: 'scan' });
}

/** The director said it is done. Verified elsewhere where possible; never auto-completes on its own. */
export async function recordClaimedDone(
  id: string,
  d: { confidence: number; sourceRef?: string | null; sourceLink?: string | null; detail?: string | null }
): Promise<void> {
  await ensureTables();
  await db
    .update(portalTasks)
    .set({ status: 'claimed_done', completionConfidence: d.confidence, updatedAt: new Date() })
    .where(and(eq(portalTasks.id, id), sql`${portalTasks.status} <> 'done'`));
  await logEvent(id, 'claimed_done', d.detail || null, { confidence: d.confidence, sourceRef: d.sourceRef, sourceLink: d.sourceLink, actor: 'scan' });
}

/** A check outside the conversation (the live page changed) confirms it. */
export async function recordVerifiedDone(id: string, d: { confidence: number; detail: string }): Promise<void> {
  await ensureTables();
  await db
    .update(portalTasks)
    .set({ status: 'done', completedAt: new Date(), completionConfidence: d.confidence, updatedAt: new Date() })
    .where(eq(portalTasks.id, id));
  await logEvent(id, 'verified_done', d.detail, { confidence: d.confidence, actor: 'scan' });
}

export async function setPageHash(id: string, hash: string | null): Promise<void> {
  await ensureTables();
  await db.update(portalTasks).set({ pageHash: hash }).where(eq(portalTasks.id, id));
}

export async function getPageHash(id: string): Promise<string | null> {
  await ensureTables();
  const [row] = await db.select({ h: portalTasks.pageHash }).from(portalTasks).where(eq(portalTasks.id, id));
  return row?.h ?? null;
}

/** Open tasks that are high importance or due within 48 hours. */
export async function digestTasks(owner = TASKS_OWNER): Promise<TaskRow[]> {
  const soon = Date.now() + 48 * 3600 * 1000;
  const open = await listTasks('open', owner);
  return open
    .filter(
      (t) =>
        t.importance === 'high' ||
        (t.due_at && new Date(t.due_at).getTime() <= soon) ||
        (t.committed_for && new Date(t.committed_for).getTime() < Date.now() && t.status !== 'done')
    )
    .sort((a, b) => (a.due_at || a.committed_for || '9').localeCompare(b.due_at || b.committed_for || '9'));
}

/** Set done/open on the task linked to a portal request, if one exists. */
export async function setPortalTaskDone(sourceRef: string, done: boolean, actor?: string): Promise<void> {
  const existing = await getTaskBySourceRef(sourceRef);
  if (!existing) return;
  if (done && existing.status === 'done') return;
  if (!done && existing.status !== 'done') return;
  await patchTask(existing.id, { status: done ? 'done' : 'open' }, actor || 'portal');
}
