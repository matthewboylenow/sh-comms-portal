// app/api/photo-submissions/route.ts
//
// POST (public): staff/parishioners share parish-life photos with Communications
// GET (admin):   list all photo submissions for the admin Photos page

import { NextRequest, NextResponse } from 'next/server';
import { useNeonDatabase } from '../../lib/db';
import * as photoSubmissionsService from '../../lib/db/services/photo-submissions';
import { getAdminSession } from '../../lib/adminAuth';

export const dynamic = 'force-dynamic';

const MAX_FILES = 40;

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

export async function POST(request: NextRequest) {
  try {
    if (!useNeonDatabase()) {
      return NextResponse.json({ error: 'Not available' }, { status: 503 });
    }

    const data = await request.json();
    const description = typeof data.description === 'string' ? data.description.trim() : '';
    const fileLinks = Array.isArray(data.fileLinks) ? data.fileLinks : [];

    if (!description) {
      return NextResponse.json({ error: 'Please tell us what the photos are of' }, { status: 400 });
    }
    if (fileLinks.length === 0) {
      return NextResponse.json({ error: 'Please add at least one photo or video' }, { status: 400 });
    }
    if (fileLinks.length > MAX_FILES) {
      return NextResponse.json({ error: `Please share at most ${MAX_FILES} files at once` }, { status: 400 });
    }
    if (!fileLinks.every((url: unknown) => typeof url === 'string' && isAllowedFileUrl(url))) {
      return NextResponse.json({ error: 'Invalid file URL' }, { status: 400 });
    }

    const submission = await photoSubmissionsService.createPhotoSubmission({
      submitterName: data.submitterName?.trim() || null,
      ministry: data.ministry?.trim() || null,
      description,
      photoDate: data.photoDate || null,
      fileLinks,
      privacyConcern: data.privacyConcern === true,
      privacyNotes: data.privacyNotes?.trim() || null,
    });

    return NextResponse.json({ success: true, id: submission.id });
  } catch (error: any) {
    console.error('Photo submission error:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const submissions = await photoSubmissionsService.getAllPhotoSubmissions();
    return NextResponse.json({ submissions });
  } catch (error: any) {
    console.error('Error fetching photo submissions:', error);
    return NextResponse.json({ error: 'Error fetching photo submissions' }, { status: 500 });
  }
}
