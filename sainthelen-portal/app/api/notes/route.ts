// app/api/notes/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import * as notesService from '../../lib/db/services/notes';

export const dynamic = 'force-dynamic';

/**
 * GET /api/notes
 * Fetches notes for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;
    const notes = await notesService.getNotesForUser(userEmail);

    return NextResponse.json({
      success: true,
      notes,
    });
  } catch (error: any) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notes
 * Creates a new note
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;
    const body = await request.json();

    const { content, color, isPinned } = body;

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      );
    }

    const note = await notesService.createNote({
      userEmail,
      content,
      color,
      isPinned,
    });

    return NextResponse.json({
      success: true,
      note,
    });
  } catch (error: any) {
    console.error('Error creating note:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create note' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notes
 * Updates a note
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

    const note = await notesService.updateNote(id, updates);

    return NextResponse.json({
      success: true,
      note,
    });
  } catch (error: any) {
    console.error('Error updating note:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update note' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notes
 * Deletes a note
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

    await notesService.deleteNote(id);

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Error deleting note:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete note' },
      { status: 500 }
    );
  }
}
