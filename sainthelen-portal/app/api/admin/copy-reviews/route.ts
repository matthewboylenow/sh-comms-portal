// app/api/admin/copy-reviews/route.ts
//
// Suggested edits for the admin cards.
//   GET  ?type=announcement&ids=a,b,c  -> the stored reviews for those cards
//   POST { type, sourceId }            -> run (or re-run) the check now

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAccess } from '../../../lib/adminAuth';
import { getCopyReviews, type CopySourceType } from '../../../lib/db/services/copy-reviews';
import { runCopyReview } from '../../../lib/copy-review';
import type { CopyReview } from '../../../lib/db/schema';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const TYPES: CopySourceType[] = ['announcement', 'website_update'];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function shape(r: CopyReview) {
  return {
    sourceId: r.sourceId,
    status: r.status,
    cleaned: r.cleaned,
    unchanged: r.unchanged,
    changes: r.changes || [],
    concerns: r.concerns || [],
    aiError: r.aiError,
    updatedAt: r.updatedAt,
  };
}

async function authorised() {
  try {
    await requireAdminAccess();
    return true;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  if (!(await authorised())) {
    return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  }
  const type = request.nextUrl.searchParams.get('type') as CopySourceType;
  const ids = (request.nextUrl.searchParams.get('ids') || '')
    .split(',')
    .filter((id) => UUID_RE.test(id))
    .slice(0, 200);
  if (!TYPES.includes(type)) {
    return NextResponse.json({ error: 'Unknown type.' }, { status: 400 });
  }

  const rows = await getCopyReviews(type, ids);
  return NextResponse.json({ reviews: rows.map(shape) });
}

export async function POST(request: NextRequest) {
  if (!(await authorised())) {
    return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  }
  const { type, sourceId } = await request.json().catch(() => ({}));
  if (!TYPES.includes(type) || typeof sourceId !== 'string' || !UUID_RE.test(sourceId)) {
    return NextResponse.json({ error: 'Missing or invalid submission.' }, { status: 400 });
  }

  try {
    const review = await runCopyReview(type, sourceId);
    return NextResponse.json({ review: shape(review) });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Style check failed.' }, { status: 500 });
  }
}
