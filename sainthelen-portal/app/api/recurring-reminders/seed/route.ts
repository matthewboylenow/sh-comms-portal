// app/api/recurring-reminders/seed/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import * as remindersService from '../../../lib/db/services/recurring-reminders';

export const dynamic = 'force-dynamic';

/**
 * POST /api/recurring-reminders/seed
 * Seeds default recurring reminders for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;

    // Check if user already has reminders
    const existingReminders = await remindersService.getRemindersForUser(userEmail, false);
    if (existingReminders.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'User already has reminders. Delete existing reminders first if you want to reseed.',
      }, { status: 400 });
    }

    const reminders = await remindersService.seedDefaultReminders(userEmail);

    return NextResponse.json({
      success: true,
      reminders,
      message: `Created ${reminders.length} default reminders`,
    });
  } catch (error: any) {
    console.error('Error seeding reminders:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to seed reminders' },
      { status: 500 }
    );
  }
}
