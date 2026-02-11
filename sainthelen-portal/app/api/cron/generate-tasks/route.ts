// app/api/cron/generate-tasks/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { format } from 'date-fns';
import * as remindersService from '../../../lib/db/services/recurring-reminders';
import * as tasksService from '../../../lib/db/services/tasks';

export const dynamic = 'force-dynamic';

// Vercel cron secret for authentication
const CRON_SECRET = process.env.CRON_SECRET;

/**
 * GET /api/cron/generate-tasks
 * Generates tasks from recurring reminders
 * Called by Vercel Cron daily at 5:00 AM ET
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
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const todayStr = format(today, 'yyyy-MM-dd');

    console.log(`[generate-tasks] Running for ${todayStr} (day ${dayOfWeek})`);

    // Get daily reminders
    const dailyReminders = await remindersService.getDailyRemindersToGenerate();
    console.log(`[generate-tasks] Found ${dailyReminders.length} daily reminders`);

    // Get weekly reminders for today
    const weeklyReminders = await remindersService.getWeeklyRemindersForToday(dayOfWeek);
    console.log(`[generate-tasks] Found ${weeklyReminders.length} weekly reminders for today`);

    const allReminders = [...dailyReminders, ...weeklyReminders];
    const createdTasks: any[] = [];
    const errors: any[] = [];

    for (const reminder of allReminders) {
      try {
        // Check if task already exists for this reminder and date
        const existingTasks = await tasksService.getTasksForDate(reminder.userEmail, todayStr);
        const alreadyCreated = existingTasks.some(
          (task) => task.recurringReminderId === reminder.id
        );

        if (alreadyCreated) {
          console.log(`[generate-tasks] Task already exists for reminder ${reminder.id}`);
          continue;
        }

        // Create the task
        const task = await tasksService.createTask({
          userEmail: reminder.userEmail,
          title: reminder.title,
          description: reminder.description || undefined,
          category: reminder.category,
          priority: reminder.priority || 'normal',
          dueDate: todayStr,
          dueTime: reminder.timeOfDay || undefined,
          recurringReminderId: reminder.id,
        });

        // Update last generated timestamp
        await remindersService.updateLastGenerated(reminder.id);

        createdTasks.push({
          id: task.id,
          title: task.title,
          userEmail: task.userEmail,
        });

        console.log(`[generate-tasks] Created task: ${task.title}`);
      } catch (error: any) {
        console.error(`[generate-tasks] Error creating task for reminder ${reminder.id}:`, error);
        errors.push({
          reminderId: reminder.id,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      date: todayStr,
      dayOfWeek,
      totalReminders: allReminders.length,
      tasksCreated: createdTasks.length,
      tasks: createdTasks,
      errors,
    });
  } catch (error: any) {
    console.error('[generate-tasks] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate tasks' },
      { status: 500 }
    );
  }
}
