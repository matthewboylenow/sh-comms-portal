// app/providers.tsx
'use client';

import { SessionProvider } from 'next-auth/react';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from 'next-themes';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class">
      <SessionProvider>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}