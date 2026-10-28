// app/lib/tasks-auth.ts
// The Tasks API accepts either a signed-in portal session (the tab) or a
// bearer token (the scheduled inbox scan posting from outside a browser).
import type { NextRequest } from 'next/server';
import { getAdminSession } from './adminAuth';

export async function authoriseTasks(request: NextRequest): Promise<{ ok: true; via: 'session' | 'token' } | { ok: false }> {
  const auth = request.headers.get('authorization') || '';
  const key = process.env.TASKS_API_KEY;
  if (key && auth === `Bearer ${key}`) return { ok: true, via: 'token' };
  const session = await getAdminSession().catch(() => null);
  if (session) return { ok: true, via: 'session' };
  return { ok: false };
}
