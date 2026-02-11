// app/api/recurring-reminders/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import * as remindersService from '../../lib/db/services/recurring-reminders';

export const dynamic = 'force-dynamic';

/**
 * GET /api/recurring-reminders
 * Fetches recurring reminders for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;
    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    const reminders = await remindersService.getRemindersForUser(userEmail, activeOnly);

    return NextResponse.json({
      success: true,
      reminders,
    });
  } catch (error: any) {
    console.error('Error fetching reminders:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch reminders' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/recurring-reminders
 * Creates a new recurring reminder
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;
    const body = await request.json();

    const { title, description, category, frequency, dayOfWeek, dayOfMonth, timeOfDay, priority } = body;

    if (!title || !category || !frequency) {
      return NextResponse.json(
        { success: false, error: 'Title, category, and frequency are required' },
        { status: 400 }
      );
    }

    const reminder = await remindersService.createReminder({
      userEmail,
      title,
      description,
      category,
      frequency,
      dayOfWeek,
      dayOfMonth,
      timeOfDay,
      priority,
    });

    return NextResponse.json({
      success: true,
      reminder,
    });
  } catch (error: any) {
    console.error('Error creating reminder:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create reminder' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/recurring-reminders
 * Updates a recurring reminder
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
        { success: false, error: 'Reminder ID is required' },
        { status: 400 }
      );
    }

    // Verify the reminder belongs to the user
    const existing = await remindersService.getReminderById(id);
    if (!existing || existing.userEmail !== session.user.email) {
      return NextResponse.json(
        { success: false, error: 'Reminder not found' },
        { status: 404 }
      );
    }

    const reminder = await remindersService.updateReminder(id, updates);

    return NextResponse.json({
      success: true,
      reminder,
    });
  } catch (error: any) {
    console.error('Error updating reminder:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update reminder' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/recurring-reminders
 * Deletes a recurring reminder
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
        { success: false, error: 'Reminder ID is required' },
        { status: 400 }
      );
    }

    // Verify the reminder belongs to the user
    const existing = await remindersService.getReminderById(id);
    if (!existing || existing.userEmail !== session.user.email) {
      return NextResponse.json(
        { success: false, error: 'Reminder not found' },
        { status: 404 }
      );
    }

    await remindersService.deleteReminder(id);

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Error deleting reminder:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete reminder' },
      { status: 500 }
    );
  }
}
