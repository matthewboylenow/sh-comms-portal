// app/api/tasks/route.ts
//
// GET  /api/tasks?status=open|done   the list for the Tasks tab
// POST /api/tasks                    one task or an array; upserts on source_ref
//
// Auth: portal session, or `Authorization: Bearer <TASKS_API_KEY>` for the
// scheduled inbox scan.
import { NextRequest, NextResponse } from 'next/server';
import { authoriseTasks } from '../../lib/tasks-auth';
import { useNeonDatabase } from '../../lib/db';
import { listTasks, upsertTask, type TaskInput } from '../../lib/db/services/portal-tasks';

export const dynamic = 'force-dynamic';

const SOURCES = new Set(['email', 'portal', 'manual']);
const IMPORTANCE = new Set(['normal', 'high']);

function clean(input: any): TaskInput {
  const t: TaskInput = { title: String(input?.title || '').trim() };
  if (input?.notes != null) t.notes = String(input.notes);
  if (SOURCES.has(input?.source)) t.source = input.source;
  if (input?.source_ref != null) t.source_ref = String(input.source_ref);
  if (input?.source_link != null) t.source_link = String(input.source_link);
  if (input?.requester_name != null) t.requester_name = String(input.requester_name);
  if (input?.requester_email != null) t.requester_email = String(input.requester_email);
  if (input?.category != null) t.category = input.category;
  if (input?.due_at != null && input.due_at !== '') {
    const d = new Date(input.due_at);
    if (Number.isNaN(d.getTime())) throw new Error(`due_at is not a date: ${input.due_at}`);
    t.due_at = d.toISOString();
  }
  if (IMPORTANCE.has(input?.importance)) t.importance = input.importance;
  return t;
}

export async function GET(request: NextRequest) {
  const auth = await authoriseTasks(request);
  if (!auth.ok) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  if (!useNeonDatabase()) return NextResponse.json({ error: 'Tasks need the Neon database' }, { status: 501 });
  const status = request.nextUrl.searchParams.get('status') === 'done' ? 'done' : 'open';
  try {
    return NextResponse.json({ tasks: await listTasks(status) });
  } catch (err: any) {
    console.error('[tasks] list failed:', err);
    return NextResponse.json({ error: err.message || 'Could not load tasks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await authoriseTasks(request);
  if (!auth.ok) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  if (!useNeonDatabase()) return NextResponse.json({ error: 'Tasks need the Neon database' }, { status: 501 });
  const body = await request.json().catch(() => null);
  const items = Array.isArray(body) ? body : body ? [body] : [];
  if (!items.length) return NextResponse.json({ error: 'Send a task or an array of tasks' }, { status: 400 });
  if (items.length > 100) return NextResponse.json({ error: 'At most 100 tasks per call' }, { status: 400 });
  try {
    const results = [];
    for (const raw of items) {
      const input = clean(raw);
      if (!input.title) return NextResponse.json({ error: 'Every task needs a title' }, { status: 400 });
      results.push(await upsertTask(input));
    }
    const tasks = results.map((r) => r.task);
    const created = results.filter((r) => r.created).length;
    return NextResponse.json(Array.isArray(body) ? { tasks, created, updated: tasks.length - created } : { task: tasks[0], created: created === 1 }, {
      status: created ? 201 : 200,
    });
  } catch (err: any) {
    console.error('[tasks] create failed:', err);
    return NextResponse.json({ error: err.message || 'Could not save the task' }, { status: 500 });
  }
}
