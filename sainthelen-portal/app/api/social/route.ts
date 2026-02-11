// app/api/social/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import * as socialService from '../../lib/db/services/social-media-content';

export const dynamic = 'force-dynamic';

/**
 * GET /api/social
 * Fetches social media content for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;
    const searchParams = request.nextUrl.searchParams;

    const platform = searchParams.get('platform') as socialService.Platform | null;
    const contentType = searchParams.get('contentType') as socialService.ContentType | null;
    const status = searchParams.get('status') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    const content = await socialService.getContentForUser(userEmail, {
      platform: platform || undefined,
      contentType: contentType || undefined,
      status,
      limit,
    });

    return NextResponse.json({
      success: true,
      content,
    });
  } catch (error: any) {
    console.error('Error fetching social content:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch social content' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/social
 * Creates new social media content
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;
    const body = await request.json();

    const { platform, contentType, content, hashtags, suggestedDate, sourceRecordId, sourceRecordType } = body;

    if (!platform || !contentType || !content) {
      return NextResponse.json(
        { success: false, error: 'Platform, contentType, and content are required' },
        { status: 400 }
      );
    }

    const socialContent = await socialService.createContent({
      userEmail,
      platform,
      contentType,
      content,
      hashtags,
      suggestedDate,
      sourceRecordId,
      sourceRecordType,
    });

    return NextResponse.json({
      success: true,
      content: socialContent,
    });
  } catch (error: any) {
    console.error('Error creating social content:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create social content' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/social
 * Updates social media content
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Content ID is required' },
        { status: 400 }
      );
    }

    // Verify the content belongs to the user
    const existing = await socialService.getContentById(id);
    if (!existing || existing.userEmail !== session.user.email) {
      return NextResponse.json(
        { success: false, error: 'Content not found' },
        { status: 404 }
      );
    }

    const content = await socialService.updateContent(id, updates);

    return NextResponse.json({
      success: true,
      content,
    });
  } catch (error: any) {
    console.error('Error updating social content:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update social content' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/social
 * Deletes social media content
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Content ID is required' },
        { status: 400 }
      );
    }

    // Verify the content belongs to the user
    const existing = await socialService.getContentById(id);
    if (!existing || existing.userEmail !== session.user.email) {
      return NextResponse.json(
        { success: false, error: 'Content not found' },
        { status: 404 }
      );
    }

    await socialService.deleteContent(id);

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Error deleting social content:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete social content' },
      { status: 500 }
    );
  }
}
