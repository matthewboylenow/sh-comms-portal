// app/api/copy-assist/route.ts
//
// The "Tighten this up" button on the public forms. Returns a lightly edited
// version of what the submitter wrote, in the parish house style. Optional,
// never blocks a submission, and says nothing about how the text was written.

import { NextRequest, NextResponse } from 'next/server';
import { cleanUpCopy, type CopyKind } from '../../lib/copy-cleanup';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const KINDS: CopyKind[] = ['announcement', 'website_update'];
const MIN_LENGTH = 30;
const MAX_LENGTH = 5000;

// Best-effort limit per visitor. Serverless instances don't share memory, so
// this caps bursts rather than guaranteeing a quota.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 8;
const recent = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (recent.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= MAX_PER_WINDOW) {
    recent.set(ip, hits);
    return true;
  }
  hits.push(now);
  recent.set(ip, hits);
  return false;
}

function originHost(origin: string): string | null {
  try {
    return new URL(origin).host;
  } catch {
    return null; // "null" or garbage
  }
}

export async function POST(request: NextRequest) {
  // Only from the portal's own pages
  const origin = request.headers.get('origin');
  if (origin && originHost(origin) !== request.headers.get('host')) {
    return NextResponse.json({ error: 'Not allowed.' }, { status: 403 });
  }

  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: 'That’s a lot of suggestions in a short time. Try again in a few minutes.' },
      { status: 429 }
    );
  }

  const { kind, text } = await request.json().catch(() => ({}));
  if (!KINDS.includes(kind) || typeof text !== 'string') {
    return NextResponse.json({ error: 'Nothing to tighten up.' }, { status: 400 });
  }
  const trimmed = text.trim();
  if (trimmed.length < MIN_LENGTH) {
    return NextResponse.json({ error: 'Write a little more first.' }, { status: 400 });
  }
  if (trimmed.length > MAX_LENGTH) {
    return NextResponse.json({ error: 'That’s longer than this can handle. Try a shorter version.' }, { status: 400 });
  }

  try {
    const result = await cleanUpCopy(kind, trimmed, { effort: 'low' });
    return NextResponse.json({ suggestion: result.text, unchanged: result.unchanged });
  } catch (err) {
    console.error('Copy assist failed:', err);
    return NextResponse.json(
      { error: 'Couldn’t come up with a suggestion right now. You can submit as is.' },
      { status: 502 }
    );
  }
}
