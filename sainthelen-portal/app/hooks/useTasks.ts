// app/hooks/useTasks.ts

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export interface Task {
  id: string;
  userEmail: string;
  title: string;
  description: string | null;
  category: string;
  priority: string | null;
  status: string | null;
  dueDate: string | null;
  dueTime: string | null;
  completedAt: string | null;
  linkedRecordId: string | null;
  linkedRecordType: string | null;
  recurringReminderId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UseTasksOptions {
  date?: string;
  startDate?: string;
  endDate?: string;
  includeCompleted?: boolean;
  autoFetch?: boolean;
}

export default function useTasks(options: UseTasksOptions = {}) {
  const { data: session, status } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    if (status !== 'authenticated' || !session?.user?.email) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (options.date) params.set('date', options.date);
      if (options.startDate) params.set('startDate', options.startDate);
      if (options.endDate) params.set('endDate', options.endDate);
      if (options.includeCompleted) params.set('includeCompleted', 'true');

      const response = await fetch(`/api/tasks?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch tasks (${response.status})`);
      }

      const data = await response.json();

      if (data.success) {
        setTasks(data.tasks || []);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err: any) {
      console.error('Error fetching tasks:', err);
      setError(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [session, status, options.date, options.startDate, options.endDate, options.includeCompleted]);

  // Create a task
  const createTask = useCallback(async (taskData: {
    title: string;
    description?: string;
    category: string;
    priority?: string;
    dueDate?: string;
    dueTime?: string;
    linkedRecordId?: string;
    linkedRecordType?: string;
  }) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create task');
      }

      const data = await response.json();

      if (data.success) {
        setTasks(prev => [...prev, data.task]);
        return data.task;
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err: any) {
      console.error('Error creating task:', err);
      throw err;
    }
  }, []);

  // Update a task
  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update task');
      }

      const data = await response.json();

      if (data.success) {
        setTasks(prev => prev.map(t => t.id === id ? data.task : t));
        return data.task;
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err: any) {
      console.error('Error updating task:', err);
      throw err;
    }
  }, []);

  // Complete a task
  const completeTask = useCallback(async (id: string) => {
    try {
      const response = await fetch('/api/tasks/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, completed: true }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to complete task');
      }

      const data = await response.json();

      if (data.success) {
        // Remove from list if not including completed, otherwise update
        if (!options.includeCompleted) {
          setTasks(prev => prev.filter(t => t.id !== id));
        } else {
          setTasks(prev => prev.map(t => t.id === id ? data.task : t));
        }
        return data.task;
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err: any) {
      console.error('Error completing task:', err);
      throw err;
    }
  }, [options.includeCompleted]);

  // Uncomplete a task
  const uncompleteTask = useCallback(async (id: string) => {
    try {
      const response = await fetch('/api/tasks/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, completed: false }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to uncomplete task');
      }

      const data = await response.json();

      if (data.success) {
        setTasks(prev => prev.map(t => t.id === id ? data.task : t));
        return data.task;
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err: any) {
      console.error('Error uncompleting task:', err);
      throw err;
    }
  }, []);

  // Delete a task
  const deleteTask = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/tasks?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete task');
      }

      const data = await response.json();

      if (data.success) {
        setTasks(prev => prev.filter(t => t.id !== id));
        return true;
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err: any) {
      console.error('Error deleting task:', err);
      throw err;
    }
  }, []);

  // Load tasks on mount and when session/options change
  useEffect(() => {
    if (status === 'authenticated' && options.autoFetch !== false) {
      fetchTasks();
    }
  }, [status, fetchTasks, options.autoFetch]);

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    completeTask,
    uncompleteTask,
    deleteTask,
  };
}
