// app/api/notes/toggle-pin/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import * as notesService from '../../../lib/db/services/notes';

export const dynamic = 'force-dynamic';

/**
 * POST /api/notes/toggle-pin
 * Toggles the pin status of a note
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Note ID is required' },
        { status: 400 }
      );
    }

    // Verify the note belongs to the user
    const existing = await notesService.getNoteById(id);
    if (!existing || existing.userEmail !== session.user.email) {
      return NextResponse.json(
        { success: false, error: 'Note not found' },
        { status: 404 }
      );
    }

    const note = await notesService.toggleNotePin(id);

    return NextResponse.json({
      success: true,
      note,
    });
  } catch (error: any) {
    console.error('Error toggling note pin:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to toggle note pin' },
      { status: 500 }
    );
  }
}
