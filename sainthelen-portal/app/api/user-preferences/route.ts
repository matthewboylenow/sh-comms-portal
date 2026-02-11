// app/api/user-preferences/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import * as preferencesService from '../../lib/db/services/user-preferences';

export const dynamic = 'force-dynamic';

/**
 * GET /api/user-preferences
 * Fetches preferences for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;
    const preferences = await preferencesService.getPreferencesForUser(userEmail);

    return NextResponse.json({
      success: true,
      preferences,
    });
  } catch (error: any) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user-preferences
 * Updates preferences for the authenticated user
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;
    const body = await request.json();

    const { dailyDigestEnabled, dailyDigestTime, defaultView, theme } = body;

    const preferences = await preferencesService.updatePreferences(userEmail, {
      dailyDigestEnabled,
      dailyDigestTime,
      defaultView,
      theme,
    });

    return NextResponse.json({
      success: true,
      preferences,
    });
  } catch (error: any) {
    console.error('Error updating preferences:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
