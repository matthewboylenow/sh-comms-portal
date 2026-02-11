// app/api/tasks/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import * as tasksService from '../../lib/db/services/tasks';
import { emitEvent } from '../../lib/eventBus';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tasks
 * Fetches tasks for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;
    const searchParams = request.nextUrl.searchParams;

    const status = searchParams.get('status') || undefined;
    const includeCompleted = searchParams.get('includeCompleted') === 'true';
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let tasks;

    if (date) {
      // Get tasks for a specific date
      tasks = await tasksService.getTasksForDate(userEmail, date, { includeCompleted });
    } else if (startDate && endDate) {
      // Get tasks for a date range
      tasks = await tasksService.getTasksForDateRange(userEmail, startDate, endDate, { includeCompleted });
    } else {
      // Get all tasks with optional filters
      tasks = await tasksService.getTasksForUser(userEmail, {
        status,
        includeCompleted,
      });
    }

    return NextResponse.json({
      success: true,
      tasks,
    });
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tasks
 * Creates a new task
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;
    const body = await request.json();

    const { title, description, category, priority, dueDate, dueTime, linkedRecordId, linkedRecordType } = body;

    if (!title || !category) {
      return NextResponse.json(
        { success: false, error: 'Title and category are required' },
        { status: 400 }
      );
    }

    const task = await tasksService.createTask({
      userEmail,
      title,
      description,
      category,
      priority,
      dueDate,
      dueTime,
      linkedRecordId,
      linkedRecordType,
    });

    emitEvent('task_created', { task });

    return NextResponse.json({
      success: true,
      task,
    });
  } catch (error: any) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create task' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/tasks
 * Updates a task
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

    const task = await tasksService.updateTask(id, updates);

    emitEvent('task_updated', { task });

    return NextResponse.json({
      success: true,
      task,
    });
  } catch (error: any) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update task' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tasks
 * Deletes a task
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

    await tasksService.deleteTask(id);

    emitEvent('task_deleted', { taskId: id });

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete task' },
      { status: 500 }
    );
  }
}
