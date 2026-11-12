// app/api/admin/website-updates/route.ts
// PATCH { id, newPage } clears or sets the "new page" flag on a website
// update, for requests where the submitter ticked it by mistake.
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAccess } from '../../../lib/adminAuth';
import { useNeonDatabase } from '../../../lib/db';
import * as websiteUpdatesService from '../../../lib/db/services/website-updates';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest) {
  try {
    await requireAdminAccess();
  } catch {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }
  if (!useNeonDatabase()) return NextResponse.json({ error: 'Needs the Neon database' }, { status: 501 });
  const { id, newPage } = await request.json().catch(() => ({}));
  if (typeof id !== 'string' || typeof newPage !== 'boolean') return NextResponse.json({ error: 'id and newPage are required' }, { status: 400 });
  try {
    const row = await websiteUpdatesService.updateWebsiteUpdate(id, { newPage });
    if (!row) return NextResponse.json({ error: 'No such request' }, { status: 404 });
    return NextResponse.json({ ok: true, newPage: !!row.newPage });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Could not update the request' }, { status: 500 });
  }
}
