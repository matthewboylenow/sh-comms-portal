// app/api/cron/daily-digest/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { format, addDays } from 'date-fns';
import * as userPreferencesService from '../../../lib/db/services/user-preferences';
import * as tasksService from '../../../lib/db/services/tasks';

export const dynamic = 'force-dynamic';

// Vercel cron secret for authentication
const CRON_SECRET = process.env.CRON_SECRET;

// Microsoft Graph credentials
const TENANT_ID = process.env.AZURE_AD_TENANT_ID;
const CLIENT_ID = process.env.AZURE_AD_CLIENT_ID;
const CLIENT_SECRET = process.env.AZURE_AD_CLIENT_SECRET;

/**
 * GET /api/cron/daily-digest
 * Sends daily digest emails to users who have it enabled
 * Called by Vercel Cron daily at 7:30 AM ET
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret in production
    if (CRON_SECRET) {
      const authHeader = request.headers.get('authorization');
      if (authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const tomorrowStr = format(addDays(today, 1), 'yyyy-MM-dd');

    console.log(`[daily-digest] Running for ${todayStr}`);

    // Get users with daily digest enabled
    const usersWithDigest = await userPreferencesService.getUsersWithDigestEnabled();
    console.log(`[daily-digest] Found ${usersWithDigest.length} users with digest enabled`);

    const results: any[] = [];
    const errors: any[] = [];

    for (const userPrefs of usersWithDigest) {
      try {
        // Get today's tasks for the user
        const todaysTasks = await tasksService.getTasksForDate(userPrefs.userEmail, todayStr);
        const overdueTasks = await tasksService.getOverdueTasks(userPrefs.userEmail);
        const pendingCount = await tasksService.getPendingTaskCount(userPrefs.userEmail);

        // Only send if there are tasks
        if (todaysTasks.length === 0 && overdueTasks.length === 0) {
          console.log(`[daily-digest] No tasks for ${userPrefs.userEmail}, skipping`);
          continue;
        }

        // Build email content
        const emailHtml = buildDigestEmail({
          userName: userPrefs.userEmail.split('@')[0],
          date: format(today, 'EEEE, MMMM d, yyyy'),
          todaysTasks,
          overdueTasks,
          pendingCount,
        });

        // Send email via Microsoft Graph
        if (TENANT_ID && CLIENT_ID && CLIENT_SECRET) {
          await sendEmailViaGraph({
            to: userPrefs.userEmail,
            subject: `Daily Digest: ${format(today, 'EEEE, MMM d')} - ${todaysTasks.length} tasks today`,
            htmlContent: emailHtml,
          });

          results.push({
            email: userPrefs.userEmail,
            tasksToday: todaysTasks.length,
            overdueCount: overdueTasks.length,
          });

          console.log(`[daily-digest] Sent digest to ${userPrefs.userEmail}`);
        } else {
          console.log(`[daily-digest] Email not configured, skipping send for ${userPrefs.userEmail}`);
        }
      } catch (error: any) {
        console.error(`[daily-digest] Error for ${userPrefs.userEmail}:`, error);
        errors.push({
          email: userPrefs.userEmail,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      date: todayStr,
      emailsSent: results.length,
      results,
      errors,
    });
  } catch (error: any) {
    console.error('[daily-digest] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send daily digest' },
      { status: 500 }
    );
  }
}

/**
 * Build the HTML email content for the daily digest
 */
function buildDigestEmail({
  userName,
  date,
  todaysTasks,
  overdueTasks,
  pendingCount,
}: {
  userName: string;
  date: string;
  todaysTasks: any[];
  overdueTasks: any[];
  pendingCount: number;
}) {
  const priorityColors: Record<string, string> = {
    urgent: '#ef4444',
    high: '#f59e0b',
    normal: '#3b82f6',
    low: '#6b7280',
  };

  const overdueSection =
    overdueTasks.length > 0
      ? `
        <div style="margin-bottom: 24px; padding: 16px; background-color: #fef2f2; border-radius: 8px; border-left: 4px solid #ef4444;">
          <h3 style="color: #991b1b; margin: 0 0 12px 0; font-size: 16px;">Overdue Tasks (${overdueTasks.length})</h3>
          ${overdueTasks
            .map(
              (task) => `
            <div style="padding: 8px 0; border-bottom: 1px solid #fecaca;">
              <strong style="color: #1f2937;">${task.title}</strong>
              <span style="color: #ef4444; font-size: 12px; margin-left: 8px;">Due: ${task.dueDate}</span>
            </div>
          `
            )
            .join('')}
        </div>
      `
      : '';

  const tasksSection =
    todaysTasks.length > 0
      ? `
        <div style="margin-bottom: 24px;">
          <h3 style="color: #1f346d; margin: 0 0 12px 0; font-size: 16px;">Today's Tasks (${todaysTasks.length})</h3>
          ${todaysTasks
            .map(
              (task) => `
            <div style="padding: 12px; background-color: #f9fafb; border-radius: 8px; margin-bottom: 8px; border-left: 4px solid ${
              priorityColors[task.priority || 'normal']
            };">
              <strong style="color: #1f2937;">${task.title}</strong>
              ${task.dueTime ? `<span style="color: #6b7280; font-size: 12px; margin-left: 8px;">${task.dueTime.substring(0, 5)}</span>` : ''}
              ${task.description ? `<p style="color: #6b7280; font-size: 14px; margin: 4px 0 0 0;">${task.description}</p>` : ''}
            </div>
          `
            )
            .join('')}
        </div>
      `
      : '<p style="color: #6b7280;">No tasks scheduled for today!</p>';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1f346d, #8b3d2b); padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Good Morning, ${userName}!</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0 0; font-size: 14px;">${date}</p>
      </div>

      <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <div style="margin-bottom: 16px; padding: 12px; background-color: #f0f9ff; border-radius: 8px;">
          <span style="color: #1f346d; font-weight: 600;">${pendingCount} total pending tasks</span>
        </div>

        ${overdueSection}
        ${tasksSection}

        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center;">
          <a href="${process.env.NEXTAUTH_URL || 'https://comms.sainthelen.org'}/command-center" style="display: inline-block; padding: 12px 24px; background-color: #1f346d; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Open Command Center
          </a>
        </div>
      </div>

      <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">
        Saint Helen Communications Portal<br>
        <a href="${process.env.NEXTAUTH_URL || 'https://comms.sainthelen.org'}/command-center" style="color: #6b7280;">Manage your preferences</a>
      </p>
    </body>
    </html>
  `;
}

/**
 * Send email via Microsoft Graph API
 */
async function sendEmailViaGraph({
  to,
  subject,
  htmlContent,
}: {
  to: string;
  subject: string;
  htmlContent: string;
}) {
  // Get access token
  const tokenResponse = await fetch(
    `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID!,
        client_secret: CLIENT_SECRET!,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials',
      }),
    }
  );

  if (!tokenResponse.ok) {
    throw new Error('Failed to get access token');
  }

  const { access_token } = await tokenResponse.json();

  // Send email
  const sendResponse = await fetch(
    `https://graph.microsoft.com/v1.0/users/mboyle@sainthelen.org/sendMail`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          subject,
          body: {
            contentType: 'HTML',
            content: htmlContent,
          },
          toRecipients: [{ emailAddress: { address: to } }],
        },
        saveToSentItems: true,
      }),
    }
  );

  if (!sendResponse.ok) {
    const error = await sendResponse.text();
    throw new Error(`Failed to send email: ${error}`);
  }
}
