// app/command-center/layout.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Command Center | Saint Helen Communications',
  description: 'Personal productivity command center for the Communications Director',
};

export default function CommandCenterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[hsl(35,30%,97%)] dark:bg-slate-900">
      {children}
    </div>
  );
}
