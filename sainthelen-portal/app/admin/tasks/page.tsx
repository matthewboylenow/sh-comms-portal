// app/admin/tasks/page.tsx
export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import TasksClient from './TasksClient';

export const metadata: Metadata = {
  title: 'Tasks | Saint Helen Communications',
};

export default function TasksPage() {
  return <TasksClient />;
}
