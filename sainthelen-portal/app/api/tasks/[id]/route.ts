// app/api/tasks/[id]/route.ts
// PATCH edits any field, marks done or open, snoozes. DELETE removes.
// Marking a portal-sourced task done (or open) also marks the request.
import { NextRequest, NextResponse } from 'next/server';
import { authoriseTasks } from '../../../lib/tasks-auth';
import { useNeonDatabase } from '../../../lib/db';
import { deleteTask, getTask, getEvents, patchTask, type TaskPatch } from '../../../lib/db/services/portal-tasks';
import { setRequestCompleted } from '../../../lib/portal-task';

export const dynamic = 'force-dynamic';

const CATEGORIES = new Set(['reply', 'bulletin', 'website', 'calendar', 'av', 'admin', 'other']);

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authoriseTasks(request);
  if (!auth.ok) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  if (!useNeonDatabase()) return NextResponse.json({ error: 'Tasks need the Neon database' }, { status: 501 });
  const body = await request.json().catch(() => ({}));
  const p: TaskPatch = {};
  if (typeof body.title === 'string') {
    if (!body.title.trim()) return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 });
    p.title = body.title;
  }
  if ('notes' in body) p.notes = body.notes == null ? null : String(body.notes);
  if ('category' in body) {
    if (!CATEGORIES.has(body.category)) return NextResponse.json({ error: 'Unknown category' }, { status: 400 });
    p.category = body.category;
  }
  if ('due_at' in body) {
    if (body.due_at == null || body.due_at === '') p.due_at = null;
    else {
      const d = new Date(body.due_at);
      if (Number.isNaN(d.getTime())) return NextResponse.json({ error: 'due_at is not a date' }, { status: 400 });
      p.due_at = d.toISOString();
    }
  }
  if ('importance' in body) p.importance = body.importance === 'high' ? 'high' : 'normal';
  if ('status' in body) {
    if (!['open', 'in_progress', 'claimed_done', 'done'].includes(body.status)) {
      return NextResponse.json({ error: 'status must be open, in_progress, claimed_done or done' }, { status: 400 });
    }
    p.status = body.status;
  }
  if ('snoozed_until' in body) {
    if (body.snoozed_until == null || body.snoozed_until === '') p.snoozed_until = null;
    else {
      const d = new Date(body.snoozed_until);
      if (Number.isNaN(d.getTime())) return NextResponse.json({ error: 'snoozed_until is not a date' }, { status: 400 });
      p.snoozed_until = d.toISOString();
    }
  }
  if ('requester_name' in body) p.requester_name = body.requester_name == null ? null : String(body.requester_name);
  if ('requester_email' in body) p.requester_email = body.requester_email == null ? null : String(body.requester_email);

  try {
    const before = await getTask(params.id);
    if (!before) return NextResponse.json({ error: 'No such task' }, { status: 404 });
    const task = await patchTask(params.id, p, auth.via === 'session' ? 'owner' : 'api');
    if (task && p.status && task.source === 'portal' && task.source_ref) {
      // Keep the request's Completed flag in step with the task
      if (p.status === 'done' || p.status === 'open') await setRequestCompleted(task.source_ref, p.status === 'done').catch((err) =>
        console.error('[tasks] could not sync request completion:', err)
      );
    }
    return NextResponse.json({ task });
  } catch (err: any) {
    console.error('[tasks] patch failed:', err);
    return NextResponse.json({ error: err.message || 'Could not update the task' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authoriseTasks(request);
  if (!auth.ok) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  if (!useNeonDatabase()) return NextResponse.json({ error: 'Tasks need the Neon database' }, { status: 501 });
  try {
    const ok = await deleteTask(params.id);
    return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'No such task' }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Could not delete the task' }, { status: 500 });
  }
}

/** GET /api/tasks/:id → the task and its audit trail. */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authoriseTasks(request);
  if (!auth.ok) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  if (!useNeonDatabase()) return NextResponse.json({ error: 'Tasks need the Neon database' }, { status: 501 });
  const task = await getTask(params.id);
  if (!task) return NextResponse.json({ error: 'No such task' }, { status: 404 });
  const events = await getEvents(params.id);
  return NextResponse.json({ task, events });
}
