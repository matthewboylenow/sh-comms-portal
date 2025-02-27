// app/components/admin/AdminLayout.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { 
  MegaphoneIcon, 
  GlobeAltIcon, 
  ChatBubbleLeftRightIcon, 
  HomeIcon, 
  ChevronDoubleLeftIcon, 
  ChevronDoubleRightIcon,
  CheckCircleIcon,
  MoonIcon,
  SunIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Initialize dark mode based on localStorage
    const isDarkMode = localStorage.getItem('theme') === 'dark';
    setIsDark(isDarkMode);
  }, []);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

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

  const handleSignOut = () => {
    signOut();
  };

  if (!session) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Sidebar */}
      <div 
        className={`${
          collapsed ? 'w-16' : 'w-64'
        } hidden md:block flex-shrink-0 transition-all duration-300 ease-in-out bg-sh-primary dark:bg-gray-800 shadow-lg z-20`}
      >
        {/* Sidebar header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-sh-primary dark:border-gray-700">
          {!collapsed && (
            <Link href="/admin" className="text-white font-semibold">
              Saint Helen Admin
            </Link>
          )}
          <button 
            onClick={toggleSidebar}
            className="p-1 rounded-md text-white hover:bg-sh-secondary dark:hover:bg-gray-700 transition-colors"
          >
            {collapsed ? 
              <ChevronDoubleRightIcon className="h-5 w-5" /> : 
              <ChevronDoubleLeftIcon className="h-5 w-5" />
            }
          </button>
        </div>

        {/* Sidebar content */}
        <div className="py-4">
          <nav className="mt-5 px-2 space-y-1">
            <Link 
              href="/admin" 
              className="flex items-center px-4 py-2 text-sm font-medium text-white rounded-md hover:bg-sh-secondary dark:hover:bg-gray-700"
            >
              <HomeIcon className="h-5 w-5 mr-3" />
              {!collapsed && <span>Dashboard</span>}
            </Link>

            <Link 
              href="/admin#announcements" 
              className="flex items-center px-4 py-2 text-sm font-medium text-white rounded-md hover:bg-sh-secondary dark:hover:bg-gray-700"
            >
              <MegaphoneIcon className="h-5 w-5 mr-3" />
              {!collapsed && <span>Announcements</span>}
            </Link>

            <Link 
              href="/admin#websiteUpdates" 
              className="flex items-center px-4 py-2 text-sm font-medium text-white rounded-md hover:bg-sh-secondary dark:hover:bg-gray-700"
            >
              <GlobeAltIcon className="h-5 w-5 mr-3" />
              {!collapsed && <span>Website Updates</span>}
            </Link>

            <Link 
              href="/admin#smsRequests" 
              className="flex items-center px-4 py-2 text-sm font-medium text-white rounded-md hover:bg-sh-secondary dark:hover:bg-gray-700"
            >
              <ChatBubbleLeftRightIcon className="h-5 w-5 mr-3" />
              {!collapsed && <span>SMS Requests</span>}
            </Link>

            <Link 
              href="/admin/completed" 
              className="flex items-center px-4 py-2 text-sm font-medium text-white rounded-md hover:bg-sh-secondary dark:hover:bg-gray-700"
            >
              <CheckCircleIcon className="h-5 w-5 mr-3" />
              {!collapsed && <span>Completed Items</span>}
            </Link>
          </nav>
        </div>

        {/* Sidebar footer */}
        <div className="absolute bottom-0 w-full border-t border-sh-primary dark:border-gray-700 p-4">
          <div className="flex flex-col space-y-4">
            <button
              onClick={handleToggleTheme}
              className="flex items-center px-4 py-2 text-sm font-medium text-white rounded-md hover:bg-sh-secondary dark:hover:bg-gray-700"
            >
              {isDark ? 
                <SunIcon className="h-5 w-5 mr-3" /> : 
                <MoonIcon className="h-5 w-5 mr-3" />
              }
              {!collapsed && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
            </button>
            
            <button
              onClick={handleSignOut}
              className="flex items-center px-4 py-2 text-sm font-medium text-white rounded-md hover:bg-sh-secondary dark:hover:bg-gray-700"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
              {!collapsed && <span>Sign Out</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top navigation */}
        <header className="bg-white dark:bg-gray-800 shadow-sm z-10">
          <div className="px-4 h-16 flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">{title}</h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Mobile menu button - visible on small screens */}
              <div className="md:hidden">
                <button
                  onClick={toggleSidebar}
                  className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <ChevronDoubleRightIcon className="h-6 w-6" />
                </button>
              </div>
              
              {/* User profile */}
              <div className="relative">
                <button className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sh-primary">
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-full bg-sh-primary text-white flex items-center justify-center">
                    {session?.user?.name?.charAt(0) || 'U'}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
}