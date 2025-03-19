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
  ArrowRightOnRectangleIcon,
  VideoCameraIcon, 
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Initialize dark mode based on localStorage
    const isDarkMode = localStorage.getItem('theme') === 'dark';
    setIsDark(isDarkMode);

    // Check if on mobile
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    handleResize();

    // Listen for resize events
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
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
      {/* Sidebar - hidden on mobile unless toggled */}
      <div 
        className={`${
          isMobile ? (mobileMenuOpen ? 'fixed inset-0 z-40' : 'hidden') : 
          (collapsed ? 'w-16' : 'w-64')
        } flex-shrink-0 transition-all duration-300 ease-in-out bg-sh-primary dark:bg-gray-800 shadow-lg ${
          isMobile && mobileMenuOpen ? 'md:w-64' : ''
        }`}
      >
        {/* Overlay for mobile menu */}
        {isMobile && mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-gray-800 bg-opacity-75 z-30"
            onClick={toggleMobileMenu}
          />
        )}
        
        <div className={`${isMobile && mobileMenuOpen ? 'fixed left-0 top-0 w-64 h-full z-50' : 'relative w-full'} bg-sh-primary dark:bg-gray-800`}>
          {/* Sidebar header */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-sh-primary dark:border-gray-700">
            {!collapsed && (
              <Link href="/admin" className="text-white font-semibold">
                Saint Helen Admin
              </Link>
            )}
            <button 
              onClick={isMobile ? toggleMobileMenu : toggleSidebar}
              className="p-1 rounded-md text-white hover:bg-sh-secondary dark:hover:bg-gray-700 transition-colors"
            >
              {isMobile ? 
                <ChevronDoubleLeftIcon className="h-5 w-5" /> :
                (collapsed ? 
                  <ChevronDoubleRightIcon className="h-5 w-5" /> : 
                  <ChevronDoubleLeftIcon className="h-5 w-5" />
                )
              }
            </button>
          </div>

          {/* Sidebar content */}
          <div className="py-4 h-full flex flex-col justify-between">
            <nav className="mt-5 px-2 space-y-1">
              <Link 
                href="/admin" 
                className="flex items-center px-4 py-2 text-sm font-medium text-white rounded-md hover:bg-sh-secondary dark:hover:bg-gray-700"
              >
                <HomeIcon className="h-5 w-5 mr-3 flex-shrink-0" />
                {!collapsed && <span>Dashboard</span>}
              </Link>

              <Link 
                href="/admin#announcements" 
                className="flex items-center px-4 py-2 text-sm font-medium text-white rounded-md hover:bg-sh-secondary dark:hover:bg-gray-700"
              >
                <MegaphoneIcon className="h-5 w-5 mr-3 flex-shrink-0" />
                {!collapsed && <span>Announcements</span>}
              </Link>

              <Link 
                href="/admin#websiteUpdates" 
                className="flex items-center px-4 py-2 text-sm font-medium text-white rounded-md hover:bg-sh-secondary dark:hover:bg-gray-700"
              >
                <GlobeAltIcon className="h-5 w-5 mr-3 flex-shrink-0" />
                {!collapsed && <span>Website Updates</span>}
              </Link>

              <Link 
                href="/admin#smsRequests" 
                className="flex items-center px-4 py-2 text-sm font-medium text-white rounded-md hover:bg-sh-secondary dark:hover:bg-gray-700"
              >
                <ChatBubbleLeftRightIcon className="h-5 w-5 mr-3 flex-shrink-0" />
                {!collapsed && <span>SMS Requests</span>}
              </Link>
              
              <Link 
                href="/admin#avRequests" 
                className="flex items-center px-4 py-2 text-sm font-medium text-white rounded-md hover:bg-sh-secondary dark:hover:bg-gray-700"
              >
                <VideoCameraIcon className="h-5 w-5 mr-3 flex-shrink-0" />
                {!collapsed && <span>A/V Requests</span>}
              </Link>
              
              <Link 
                href="/admin#flyerReviews" 
                className="flex items-center px-4 py-2 text-sm font-medium text-white rounded-md hover:bg-sh-secondary dark:hover:bg-gray-700"
              >
                <DocumentTextIcon className="h-5 w-5 mr-3 flex-shrink-0" />
                {!collapsed && <span>Flyer Reviews</span>}
              </Link>

              <Link 
                href="/admin/completed" 
                className="flex items-center px-4 py-2 text-sm font-medium text-white rounded-md hover:bg-sh-secondary dark:hover:bg-gray-700"
              >
                <CheckCircleIcon className="h-5 w-5 mr-3 flex-shrink-0" />
                {!collapsed && <span>Completed Items</span>}
              </Link>
            </nav>

            {/* Sidebar footer */}
            <div className="mt-auto border-t border-sh-primary dark:border-gray-700 p-4">
              <div className="flex flex-col space-y-4">
                <button
                  onClick={handleToggleTheme}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white rounded-md hover:bg-sh-secondary dark:hover:bg-gray-700 w-full"
                >
                  {isDark ? 
                    <SunIcon className="h-5 w-5 mr-3 flex-shrink-0" /> : 
                    <MoonIcon className="h-5 w-5 mr-3 flex-shrink-0" />
                  }
                  {!collapsed && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
                </button>
                
                <button
                  onClick={handleSignOut}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white rounded-md hover:bg-sh-secondary dark:hover:bg-gray-700 w-full"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3 flex-shrink-0" />
                  {!collapsed && <span>Sign Out</span>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top navigation */}
        <header className="bg-white dark:bg-gray-800 shadow-sm z-10">
          <div className="px-4 h-16 flex items-center justify-between">
            <div className="flex items-center">
              {/* Mobile menu button - visible on small screens */}
              <button
                onClick={toggleMobileMenu}
                className="md:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 mr-3"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              </button>
              <h1 className="text-xl font-semibold">{title}</h1>
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
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 pb-24 bg-gray-50 dark:bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
}