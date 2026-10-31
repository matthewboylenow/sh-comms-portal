// app/api/admin/website-update-items/route.ts
// PATCH { id, done } ticks one change on a website update. When the last one
// is ticked the request itself is marked complete; unticking reopens it.
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAccess } from '../../../lib/adminAuth';
import { useNeonDatabase } from '../../../lib/db';
import { getItems, setItemDone } from '../../../lib/db/services/website-update-items';
import * as websiteUpdatesService from '../../../lib/db/services/website-updates';
import { setPortalTaskDone } from '../../../lib/db/services/portal-tasks';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest) {
  let session;
  try {
    session = await requireAdminAccess();
  } catch {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }
  if (!useNeonDatabase()) return NextResponse.json({ error: 'Needs the Neon database' }, { status: 501 });
  const { id, done } = await request.json().catch(() => ({}));
  if (typeof id !== 'string' || typeof done !== 'boolean') return NextResponse.json({ error: 'id and done are required' }, { status: 400 });
  try {
    const item = await setItemDone(id, done);
    if (!item) return NextResponse.json({ error: 'No such item' }, { status: 404 });
    await setPortalTaskDone(`portal:${item.updateId}#${item.position}`, done, session.user?.email || undefined).catch(() => {});
    const items = await getItems(item.updateId);
    const allDone = items.length > 0 && items.every((i) => i.done);
    const current = await websiteUpdatesService.getWebsiteUpdateById(item.updateId);
    if (current && !!current.completed !== allDone) await websiteUpdatesService.markCompleted(item.updateId, allDone);
    return NextResponse.json({ item, allDone });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Could not update the item' }, { status: 500 });
  }
}
