// app/api/admin/ministries/suggestions/route.ts
// Ministry names people typed into a form that are not on the ministry list,
// with how many times each was used. The office adds the real ones.
import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { requireAdminAccess } from '../../../../lib/adminAuth';
import { db, useNeonDatabase } from '../../../../lib/db';
import { getAllMinistries } from '../../../../lib/db/services/ministries';

export const dynamic = 'force-dynamic';

const TABLES: Array<[string, string]> = [
  ['announcements', 'Announcements'],
  ['sms_requests', 'Texts'],
  ['av_requests', 'A/V'],
  ['flyer_reviews', 'Flier reviews'],
  ['graphic_design_requests', 'Design'],
  ['photo_submissions', 'Photos'],
];

const norm = (s: string) => s.trim().replace(/^other:\s*/i, '').replace(/\s+/g, ' ').toLowerCase();

export async function GET() {
  try {
    await requireAdminAccess();
  } catch {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }
  if (!useNeonDatabase()) return NextResponse.json({ suggestions: [] });

  try {
    const known = new Set<string>();
    (await getAllMinistries()).forEach((m) => {
      known.add(norm(m.name));
      (m.aliases || '').split(',').map((a) => a.trim()).filter(Boolean).forEach((a) => known.add(norm(a)));
    });

    const tally = new Map<string, { name: string; count: number; tables: Set<string> }>();
    for (const [table, label] of TABLES) {
      const rows = (await db.execute(
        sql.raw(`SELECT ministry, COUNT(*)::int AS n FROM "${table}" WHERE ministry IS NOT NULL AND btrim(ministry) <> '' GROUP BY ministry`)
      )) as unknown as { rows: Array<{ ministry: string; n: number }> };
      for (const r of rows.rows || []) {
        const key = norm(r.ministry);
        if (!key || known.has(key)) continue;
        const cur = tally.get(key) || { name: r.ministry.trim().replace(/^other:\s*/i, ''), count: 0, tables: new Set<string>() };
        cur.count += Number(r.n);
        cur.tables.add(label);
        tally.set(key, cur);
      }
    }
    const suggestions = Array.from(tally.values())
      .map((s) => ({ name: s.name, count: s.count, tables: Array.from(s.tables) }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    return NextResponse.json({ suggestions });
  } catch (err: any) {
    console.error('ministry suggestions failed:', err);
    return NextResponse.json({ error: err.message || 'Could not read submissions' }, { status: 500 });
  }
}
