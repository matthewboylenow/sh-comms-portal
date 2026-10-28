// app/api/tasks/digest/route.ts
// Open tasks that are high importance or due within 48 hours. The daily
// digest email reads the same query directly; this route is for anything
// outside the portal that wants the same list.
import { NextRequest, NextResponse } from 'next/server';
import { authoriseTasks } from '../../../lib/tasks-auth';
import { useNeonDatabase } from '../../../lib/db';
import { digestTasks } from '../../../lib/db/services/portal-tasks';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await authoriseTasks(request);
  if (!auth.ok) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  if (!useNeonDatabase()) return NextResponse.json({ tasks: [] });
  try {
    return NextResponse.json({ tasks: await digestTasks() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Could not load tasks' }, { status: 500 });
  }
}
