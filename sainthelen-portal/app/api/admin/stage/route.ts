// app/api/admin/stage/route.ts
// POST { table, recordId, stage: 'review' | 'approved' | null }
// POST { table, recordId, flag: 'msgr' | null }
// Records where the office placed a card on the board, or a flag on it.
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAccess } from '../../../lib/adminAuth';
import { useNeonDatabase } from '../../../lib/db';
import { setStage, setFlag } from '../../../lib/db/services/request-stages';

export const dynamic = 'force-dynamic';

const TABLES = new Set(['announcements', 'websiteUpdates', 'smsRequests', 'avRequests', 'flyerReviews', 'graphicDesign']);

export async function POST(request: NextRequest) {
  let session;
  try {
    session = await requireAdminAccess();
  } catch {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }
  if (!useNeonDatabase()) {
    return NextResponse.json({ error: 'Board stages need the Neon database' }, { status: 501 });
  }
  const body = await request.json().catch(() => ({}));
  const { table, recordId } = body;
  if (!TABLES.has(table) || typeof recordId !== 'string' || !recordId) {
    return NextResponse.json({ error: 'table and recordId are required' }, { status: 400 });
  }
  const by = session.user?.email || undefined;
  try {
    if ('flag' in body) {
      if (body.flag !== null && body.flag !== 'msgr') {
        return NextResponse.json({ error: 'flag must be msgr or null' }, { status: 400 });
      }
      await setFlag(table, recordId, body.flag, by);
      return NextResponse.json({ ok: true });
    }
    if (body.stage !== null && body.stage !== 'review' && body.stage !== 'approved') {
      return NextResponse.json({ error: 'stage must be review, approved, or null' }, { status: 400 });
    }
    await setStage(table, recordId, body.stage, by);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('setStage failed:', err);
    return NextResponse.json({ error: err.message || 'Could not save the stage' }, { status: 500 });
  }
}
