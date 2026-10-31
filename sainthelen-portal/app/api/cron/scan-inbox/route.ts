// app/api/cron/scan-inbox/route.ts
// Hourly on weekdays (vercel.json). Reads the Director's inbox, sent mail and
// Teams since the last run and keeps the Tasks tab current.
//   ?dry=1          decide but write nothing, return the decisions
//   ?since=<ISO>    override the cursor (dry runs only)
//   ?hours=N        lookback when there is no cursor yet (default 3)
import { NextRequest, NextResponse } from 'next/server';
import { runInboxScan } from '../../../lib/inbox-scan';
import { useNeonDatabase } from '../../../lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization') || '';
  const ok =
    (process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`) ||
    (process.env.TASKS_API_KEY && auth === `Bearer ${process.env.TASKS_API_KEY}`);
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!useNeonDatabase()) return NextResponse.json({ error: 'Needs the Neon database' }, { status: 501 });

  const dry = request.nextUrl.searchParams.get('dry') === '1';
  const since = dry ? request.nextUrl.searchParams.get('since') || undefined : undefined;
  const hours = Number(request.nextUrl.searchParams.get('hours') || 3) || 3;
  try {
    const summary = await runInboxScan({ dry, since, lookbackHours: hours });
    console.log('[scan-inbox]', JSON.stringify({ ...summary, decisions: undefined }));
    return NextResponse.json({ ok: true, ...summary });
  } catch (err: any) {
    console.error('[scan-inbox] failed:', err);
    return NextResponse.json({ ok: false, error: err.message || 'Scan failed' }, { status: 500 });
  }
}
