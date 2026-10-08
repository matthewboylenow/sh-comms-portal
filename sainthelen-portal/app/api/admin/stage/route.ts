// app/api/admin/stage/route.ts
// POST { table, recordId, stage: 'review' | 'approved' | null }
// Records where the office placed a card on the board.
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAccess } from '../../../lib/adminAuth';
import { useNeonDatabase } from '../../../lib/db';
import { setStage } from '../../../lib/db/services/request-stages';

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
  const { table, recordId, stage } = await request.json().catch(() => ({}));
  if (!TABLES.has(table) || typeof recordId !== 'string' || !recordId) {
    return NextResponse.json({ error: 'table and recordId are required' }, { status: 400 });
  }
  if (stage !== null && stage !== 'review' && stage !== 'approved') {
    return NextResponse.json({ error: 'stage must be review, approved, or null' }, { status: 400 });
  }
  try {
    await setStage(table, recordId, stage, session.user?.email || undefined);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('setStage failed:', err);
    return NextResponse.json({ error: err.message || 'Could not save the stage' }, { status: 500 });
  }
}
