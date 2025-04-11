// app/components/admin/PushNotificationToggle.tsx
'use client';

import React from 'react';
import { usePushNotifications } from '@/app/context/PushNotificationContext';
import { Switch } from '@headlessui/react';

export default function PushNotificationToggle() {
  const { 
    isPushSupported, 
    isSubscribed, 
    subscribeToPush, 
    unsubscribeFromPush 
  } = usePushNotifications();

  if (!isPushSupported) {
    return null; // Don't show anything if push is not supported
  }

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribeFromPush();
    } else {
      await subscribeToPush();
    }
  };

  return (
    <div className="flex items-center gap-3 ml-4">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Notifications
      </span>
      <Switch
        checked={isSubscribed}
        onChange={handleToggle}
        className={`${
          isSubscribed ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
        } relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75`}
      >
        <span
          className={`${
            isSubscribed ? 'translate-x-5' : 'translate-x-0'
          } pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out`}
        />
      </Switch>
    </div>
  );
}