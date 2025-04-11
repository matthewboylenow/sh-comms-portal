// app/context/PushNotificationContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface PushNotificationContextType {
  isPushSupported: boolean;
  isSubscribed: boolean;
  isPromptShown: boolean;
  subscription: PushSubscription | null;
  subscribeToPush: () => Promise<boolean>;
  unsubscribeFromPush: () => Promise<boolean>;
}

const PushNotificationContext = createContext<PushNotificationContextType | undefined>(undefined);

// VAPID public key - replace with your actual public key in production
const PUBLIC_VAPID_KEY = 'BNbKpVjn7a0DrH-EkSQ_Gl00-UwEn2Cn12U2WGIAVr5R15bXCLwXB7TXqFkyGciKoQYNXktnjVlEQWI1FKsnnSc';

export function PushNotificationProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [isPushSupported, setIsPushSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isPromptShown, setIsPromptShown] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Check if push notifications are supported
  useEffect(() => {
    const checkPushSupport = () => {
      if (!('serviceWorker' in navigator)) {
        console.log('Service workers are not supported');
        return;
      }

      if (!('PushManager' in window)) {
        console.log('Push notifications are not supported');
        return;
      }

      setIsPushSupported(true);
    };

    checkPushSupport();
  }, []);

  // Register service worker
  useEffect(() => {
    if (!isPushSupported) return;

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully:', registration);
        setSwRegistration(registration);

        // Check if already subscribed
        const existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) {
          console.log('User is already subscribed to push notifications');
          setIsSubscribed(true);
          setSubscription(existingSubscription);
        }
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    };

    registerServiceWorker();
  }, [isPushSupported]);

  // Prompt for notifications after user is authenticated and has been on the site for 3 seconds
  useEffect(() => {
    if (!isPushSupported || status !== 'authenticated' || isSubscribed || isPromptShown) return;

    const timer = setTimeout(() => {
      if (window.confirm('Would you like to receive push notifications for new submissions?')) {
        subscribeToPush();
      }
      setIsPromptShown(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [isPushSupported, status, isSubscribed, isPromptShown]);

  // Function to convert base64 to Uint8Array
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // Subscribe to push notifications
  const subscribeToPush = useCallback(async () => {
    if (!swRegistration || !session?.user?.email) return false;

    try {
      const applicationServerKey = urlBase64ToUint8Array(PUBLIC_VAPID_KEY);
      const newSubscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      console.log('User is subscribed to push notifications:', newSubscription);
      setIsSubscribed(true);
      setSubscription(newSubscription);

      // Save subscription to server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: newSubscription,
          userEmail: session.user.email,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save subscription to server');
      }

      return true;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return false;
    }
  }, [swRegistration, session]);

  // Unsubscribe from push notifications
  const unsubscribeFromPush = useCallback(async () => {
    if (!subscription) return false;

    try {
      await subscription.unsubscribe();
      console.log('User unsubscribed from push notifications');
      setIsSubscribed(false);
      setSubscription(null);

      // Delete subscription from server
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
        }),
      });

      return true;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }, [subscription]);

  const value = {
    isPushSupported,
    isSubscribed,
    isPromptShown,
    subscription,
    subscribeToPush,
    unsubscribeFromPush,
  };

  return (
    <PushNotificationContext.Provider value={value}>
      {children}
    </PushNotificationContext.Provider>
  );
}

export function usePushNotifications() {
  const context = useContext(PushNotificationContext);
  if (context === undefined) {
    throw new Error('usePushNotifications must be used within a PushNotificationProvider');
  }
  return context;
}