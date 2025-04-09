// components/Header.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { SunIcon, MoonIcon, UserCircleIcon, BellIcon } from '@heroicons/react/24/solid';
import { useNotificationContext } from '../context/NotificationContext';
import { useSession } from 'next-auth/react';

export default function Header() {
  const { data: session } = useSession();
  const notificationContext = useNotificationContext();
  const [isDark, setIsDark] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationCenter, setNotificationCenter] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const htmlEl = document.documentElement;
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark') {
      htmlEl.classList.add('dark');
      setIsDark(true);
    } else {
      htmlEl.classList.remove('dark');
      setIsDark(false);
    }
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationCenter(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleToggleTheme = () => {
    const htmlEl = document.documentElement;
    if (htmlEl.classList.contains('dark')) {
      // Switch to light mode
      htmlEl.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      // Switch to dark mode
      htmlEl.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  return (
    <header className="w-full flex items-center justify-between bg-sh-primary py-3">
      <div className="container mx-auto flex items-center justify-between px-0">
      {/* Logo + Text */}
      <div className="flex items-center space-x-3">
        {/* Logo */}
        <Link href="/">
          <img
            src="/images/Saint-Helen-Logo-White.png"
            alt="Saint Helen Logo"
            className="h-10 object-contain" 
          />
        </Link>
        {/* Text */}
        <Link href="/" className="text-white text-xl font-semibold">
          Communications Portal
        </Link>
      </div>

      {/* Right side actions */}
      <div className="flex items-center space-x-3">
        {/* Dark Mode Toggle Button */}
        <button
          onClick={handleToggleTheme}
          className="text-white rounded-md p-2 hover:bg-sh-secondary transition-colors"
          aria-label="Toggle Dark Mode"
        >
          {isDark ? (
            <SunIcon className="h-5 w-5" />
          ) : (
            <MoonIcon className="h-5 w-5" />
          )}
        </button>

        {/* Notifications bell - only show if logged in */}
        {session?.user && (
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setNotificationCenter(!notificationCenter)}
              className="text-white rounded-md p-2 hover:bg-sh-secondary transition-colors"
            >
              <BellIcon className="h-5 w-5" />
              {notificationContext.unreadCount > 0 && (
                <span className="absolute top-1 right-1 inline-flex items-center justify-center h-4 w-4 rounded-full bg-red-500 text-white text-xs font-medium">
                  {notificationContext.unreadCount}
                </span>
              )}
            </button>
            
            {notificationCenter && (
              <div className="absolute right-0 mt-2 w-80 rounded-md shadow-lg py-1 bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">Notifications</h3>
                  <button 
                    onClick={() => notificationContext.markAllAsRead()}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    Mark all as read
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {notificationContext.loading ? (
                    <div className="px-4 py-6 text-center">
                      <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent dark:border-blue-400 dark:border-r-transparent"></div>
                    </div>
                  ) : notificationContext.notifications.length > 0 ? (
                    notificationContext.notifications.map(notification => (
                      <div key={notification.id} className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 pt-0.5">
                            <div className={`h-8 w-8 rounded-full ${
                              notification.type === 'info' ? 'bg-blue-100 dark:bg-blue-900' :
                              notification.type === 'success' ? 'bg-green-100 dark:bg-green-900' :
                              notification.type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900' :
                              'bg-red-100 dark:bg-red-900'
                            } flex items-center justify-center`}>
                              <BellIcon className={`h-4 w-4 ${
                                notification.type === 'info' ? 'text-blue-600 dark:text-blue-400' :
                                notification.type === 'success' ? 'text-green-600 dark:text-green-400' :
                                notification.type === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                                'text-red-600 dark:text-red-400'
                              }`} />
                            </div>
                          </div>
                          <div className="ml-3 w-0 flex-1">
                            <div className="flex justify-between items-start">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {notification.message}
                              </p>
                              {!notification.isRead && (
                                <button 
                                  onClick={() => notificationContext.markAsRead(notification.id)}
                                  className="ml-2 flex-shrink-0 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                >
                                  Mark read
                                </button>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(notification.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                      No notifications
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* User profile */}
        <div className="relative" ref={userMenuRef}>
          <button 
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="text-white rounded-md p-2 hover:bg-sh-secondary transition-colors"
          >
            <UserCircleIcon className="h-6 w-6" />
          </button>
          
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
              <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                <p className="font-medium">{session?.user?.name || 'Guest User'}</p>
                {session?.user?.email && (
                  <p className="text-gray-500 dark:text-gray-400 truncate">{session.user.email}</p>
                )}
              </div>
              <button onClick={handleToggleTheme} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </button>
              <Link href="/admin" className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                Admin Portal
              </Link>
            </div>
          )}
        </div>
      </div>
      </div>
    </header>
  );
}
