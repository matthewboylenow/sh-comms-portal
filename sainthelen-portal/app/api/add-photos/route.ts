// app/api/add-photos/route.ts
//
// Public endpoint behind the "add photos from your phone" QR code / link.
// GET  ?type=<table>&id=<uuid>   -> minimal info about the request (title only)
// POST { type, id, fileLinks[] } -> appends uploaded blob URLs to the record
//
// Links stop working 30 days after the request was submitted, and each
// record is capped at MAX_FILES_PER_RECORD attachments.

import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db, useNeonDatabase } from '../../lib/db';
import {
  announcements,
  websiteUpdates,
  smsRequests,
  avRequests,
  flyerReviews,
  graphicDesignRequests,
} from '../../lib/db/schema';

export const dynamic = 'force-dynamic';

const UPLOAD_WINDOW_DAYS = 30;
const MAX_FILES_PER_CALL = 20;
const MAX_FILES_PER_RECORD = 40;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type TableConfig = {
  table: any;
  label: string;
  getTitle: (record: any) => string;
  getCreatedAt: (record: any) => Date | null;
};

const TABLES: Record<string, TableConfig> = {
  announcements: {
    table: announcements,
    label: 'Announcement',
    getTitle: (r) => r.name || 'Announcement',
    getCreatedAt: (r) => r.submittedAt,
  },
  websiteUpdates: {
    table: websiteUpdates,
    label: 'Website Update',
    getTitle: (r) => r.pageToUpdate || 'Website Update',
    getCreatedAt: (r) => r.createdAt,
  },
  smsRequests: {
    table: smsRequests,
    label: 'SMS Request',
    getTitle: (r) => 'SMS Request',
    getCreatedAt: (r) => r.createdAt,
  },
  avRequests: {
    table: avRequests,
    label: 'A/V Request',
    getTitle: (r) => r.eventName || 'A/V Request',
    getCreatedAt: (r) => r.createdAt,
  },
  flyerReviews: {
    table: flyerReviews,
    label: 'Flyer Review',
    getTitle: (r) => r.eventName || 'Flyer Review',
    getCreatedAt: (r) => r.createdAt,
  },
  graphicDesign: {
    table: graphicDesignRequests,
    label: 'Graphic Design Request',
    getTitle: (r) => r.projectType || 'Graphic Design Request',
    getCreatedAt: (r) => r.createdAt,
  },
};

function isExpired(createdAt: Date | null): boolean {
  if (!createdAt) return false;
  const ageMs = Date.now() - new Date(createdAt).getTime();
  return ageMs > UPLOAD_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

// Only accept URLs that point at our own Vercel Blob store
function isAllowedFileUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'https:' &&
      parsed.hostname.endsWith('.public.blob.vercel-storage.com')
    );
  } catch {
    return false;
  }
}

async function findRecord(type: string, id: string) {
  const config = TABLES[type];
  if (!config) return { error: 'Unknown request type', status: 400 as const };
  if (!UUID_RE.test(id)) return { error: 'Invalid request ID', status: 400 as const };

  const results = await db.select().from(config.table).where(eq(config.table.id, id));
  const record = results[0];
  if (!record) return { error: 'Request not found', status: 404 as const };
  if (isExpired(config.getCreatedAt(record))) {
    return { error: 'This upload link has expired', status: 410 as const };
  }

  return { config, record };
}

export async function GET(request: NextRequest) {
  try {
    if (!useNeonDatabase()) {
      return NextResponse.json({ error: 'Not available' }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || '';
    const id = searchParams.get('id') || '';

    const result = await findRecord(type, id);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const existingCount = (result.record.fileLinks || []).length;
    return NextResponse.json({
      title: result.config.getTitle(result.record),
      typeLabel: result.config.label,
      remainingSlots: Math.max(0, MAX_FILES_PER_RECORD - existingCount),
    });
  } catch (error: any) {
    console.error('add-photos GET error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!useNeonDatabase()) {
      return NextResponse.json({ error: 'Not available' }, { status: 503 });
    }

    const { type, id, fileLinks } = await request.json();

    if (!Array.isArray(fileLinks) || fileLinks.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }
    if (fileLinks.length > MAX_FILES_PER_CALL) {
      return NextResponse.json(
        { error: `Please add at most ${MAX_FILES_PER_CALL} files at a time` },
        { status: 400 }
      );
    }
    if (!fileLinks.every((url: unknown) => typeof url === 'string' && isAllowedFileUrl(url))) {
      return NextResponse.json({ error: 'Invalid file URL' }, { status: 400 });
    }

    const result = await findRecord(String(type), String(id));
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const existing: string[] = result.record.fileLinks || [];
    const newLinks = fileLinks.filter((url: string) => !existing.includes(url));
    if (existing.length + newLinks.length > MAX_FILES_PER_RECORD) {
      return NextResponse.json(
        { error: 'This request already has the maximum number of files' },
        { status: 400 }
      );
    }

    await db
      .update(result.config.table)
      .set({ fileLinks: [...existing, ...newLinks] })
      .where(eq(result.config.table.id, id));

    return NextResponse.json({ success: true, added: newLinks.length });
  } catch (error: any) {
    console.error('add-photos POST error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
