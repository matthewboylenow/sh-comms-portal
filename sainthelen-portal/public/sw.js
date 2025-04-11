// Service Worker for Saint Helen Communications Portal

const CACHE_NAME = 'sh-comms-portal-v1';
const urlsToCache = [
  '/',
  '/admin',
  '/manifest.json',
  '/images/Saint-Helen-Logo-White.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Push notification handler
self.addEventListener('push', event => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    
    const options = {
      body: data.message || 'New notification',
      icon: '/images/Saint-Helen-Logo-White.png',
      badge: '/images/Saint-Helen-Logo-White.png',
      data: {
        url: data.url || '/admin',
        id: data.id
      },
      actions: [
        {
          action: 'view',
          title: 'View'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ],
      vibrate: [100, 50, 100],
      timestamp: data.timestamp || Date.now()
    };

    event.waitUntil(
      self.registration.showNotification(
        data.title || 'Saint Helen Communications Portal', 
        options
      )
    );
  } catch (err) {
    console.error('Error showing notification:', err);
  }
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  const urlToOpen = event.notification.data && event.notification.data.url 
    ? event.notification.data.url 
    : '/admin';

  // Mark notification as read if we have an ID
  if (event.notification.data && event.notification.data.id) {
    fetch('/api/notifications/mark-read', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        notificationId: event.notification.data.id, 
        isRead: true 
      }),
    }).catch(err => console.error('Error marking notification as read:', err));
  }

  event.waitUntil(
    clients.matchAll({type: 'window'})
      .then(windowClients => {
        // Check if there is already a window/tab open with the target URL
        for (let client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // If no window/tab is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Push subscription change handler
self.addEventListener('pushsubscriptionchange', event => {
  event.waitUntil(
    fetch('/api/push/update-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        oldSubscription: event.oldSubscription ? JSON.stringify(event.oldSubscription) : null,
        newSubscription: JSON.stringify(event.newSubscription)
      })
    })
  );
});