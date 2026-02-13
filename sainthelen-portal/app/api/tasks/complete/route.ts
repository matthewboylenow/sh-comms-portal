// app/api/tasks/complete/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import * as tasksService from '../../../lib/db/services/tasks';

export const dynamic = 'force-dynamic';

/**
 * POST /api/tasks/complete
 * Marks a task as completed
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, completed } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Task ID is required' },
        { status: 400 }
      );
    }

    // Verify the task belongs to the user
    const existing = await tasksService.getTaskById(id);
    if (!existing || existing.userEmail !== session.user.email) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    let task;
    if (completed === false) {
      // Uncomplete the task
      task = await tasksService.uncompleteTask(id);
    } else {
      // Complete the task
      task = await tasksService.completeTask(id);
    }

    return NextResponse.json({
      success: true,
      task,
    });
  } catch (error: any) {
    console.error('Error completing task:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to complete task' },
      { status: 500 }
    );
  }
}
