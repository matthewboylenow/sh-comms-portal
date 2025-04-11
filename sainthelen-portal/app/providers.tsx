// app/providers.tsx
'use client';

import { SessionProvider } from 'next-auth/react';
import { NotificationProvider } from './context/NotificationContext';
import { PushNotificationProvider } from './context/PushNotificationContext';
import { ThemeProvider } from 'next-themes';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class">
      <SessionProvider>
        <NotificationProvider>
          <PushNotificationProvider>
            {children}
          </PushNotificationProvider>
        </NotificationProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}