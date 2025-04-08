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
  DocumentTextIcon,
  PencilSquareIcon,
  ChartBarIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [notifications, setNotifications] = useState(3); // Example notification count

  useEffect(() => {
    // Initialize dark mode based on localStorage
    const isDarkMode = localStorage.getItem('theme') === 'dark';
    setIsDark(isDarkMode);

    // Check if on mobile
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setCollapsed(true);
      }
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

  // Animation variants for sidebar
  const sidebarVariants = {
    expanded: { width: '16rem' },
    collapsed: { width: '4.5rem' }
  };

  // Animation variants for mobile menu
  const mobileMenuVariants = {
    open: { x: 0, opacity: 1 },
    closed: { x: '-100%', opacity: 0 }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-inter">
      {/* Desktop Sidebar */}
      <AnimatePresence initial={false}>
        <motion.div 
          className={`fixed z-20 h-full bg-gradient-to-b from-sh-primary to-blue-900 shadow-xl hidden md:block ${isMobile ? 'hidden' : 'block'}`}
          animate={collapsed ? 'collapsed' : 'expanded'}
          variants={sidebarVariants}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {/* Sidebar header with logo */}
          <div className="flex h-16 items-center justify-between px-4">
            {!collapsed && (
              <Link href="/admin" className="text-white font-bold flex items-center space-x-2">
                <span className="text-xl tracking-tight">Saint Helen</span>
              </Link>
            )}
            <button 
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg text-white bg-blue-800 hover:bg-blue-700 transition-colors"
            >
              {collapsed ? 
                <ChevronDoubleRightIcon className="h-5 w-5" /> : 
                <ChevronDoubleLeftIcon className="h-5 w-5" />
              }
            </button>
          </div>

          {/* Sidebar main navigation */}
          <div className="py-6 flex flex-col h-[calc(100%-4rem)] justify-between">
            <nav className="px-2 space-y-1">
              {/* Dashboard link */}
              <Link 
                href="/admin" 
                className="flex items-center px-3 py-3 text-white rounded-lg hover:bg-blue-800 transition-colors group"
              >
                <div className="flex items-center justify-center w-10 h-10 bg-blue-800 group-hover:bg-blue-700 rounded-lg flex-shrink-0">
                  <HomeIcon className="h-5 w-5" />
                </div>
                {!collapsed && <span className="ml-3 font-medium">Dashboard</span>}
              </Link>

              {/* Announcements */}
              <Link 
                href="/admin#announcements" 
                className="flex items-center px-3 py-3 text-white rounded-lg hover:bg-blue-800 transition-colors group"
              >
                <div className="flex items-center justify-center w-10 h-10 bg-blue-800 group-hover:bg-blue-700 rounded-lg flex-shrink-0">
                  <MegaphoneIcon className="h-5 w-5" />
                </div>
                {!collapsed && <span className="ml-3 font-medium">Announcements</span>}
              </Link>

              {/* Website Updates */}
              <Link 
                href="/admin#websiteUpdates" 
                className="flex items-center px-3 py-3 text-white rounded-lg hover:bg-blue-800 transition-colors group"
              >
                <div className="flex items-center justify-center w-10 h-10 bg-blue-800 group-hover:bg-blue-700 rounded-lg flex-shrink-0">
                  <GlobeAltIcon className="h-5 w-5" />
                </div>
                {!collapsed && <span className="ml-3 font-medium">Website Updates</span>}
              </Link>

              {/* SMS Requests */}
              <Link 
                href="/admin#smsRequests" 
                className="flex items-center px-3 py-3 text-white rounded-lg hover:bg-blue-800 transition-colors group"
              >
                <div className="flex items-center justify-center w-10 h-10 bg-blue-800 group-hover:bg-blue-700 rounded-lg flex-shrink-0">
                  <ChatBubbleLeftRightIcon className="h-5 w-5" />
                </div>
                {!collapsed && <span className="ml-3 font-medium">SMS Requests</span>}
              </Link>
              
              {/* A/V Requests */}
              <Link 
                href="/admin#avRequests" 
                className="flex items-center px-3 py-3 text-white rounded-lg hover:bg-blue-800 transition-colors group"
              >
                <div className="flex items-center justify-center w-10 h-10 bg-blue-800 group-hover:bg-blue-700 rounded-lg flex-shrink-0">
                  <VideoCameraIcon className="h-5 w-5" />
                </div>
                {!collapsed && <span className="ml-3 font-medium">A/V Requests</span>}
              </Link>
              
              {/* Flyer Reviews */}
              <Link 
                href="/admin#flyerReviews" 
                className="flex items-center px-3 py-3 text-white rounded-lg hover:bg-blue-800 transition-colors group"
              >
                <div className="flex items-center justify-center w-10 h-10 bg-blue-800 group-hover:bg-blue-700 rounded-lg flex-shrink-0">
                  <DocumentTextIcon className="h-5 w-5" />
                </div>
                {!collapsed && <span className="ml-3 font-medium">Flyer Reviews</span>}
              </Link>

              {/* Graphic Design */}
              <Link 
                href="/admin#graphicDesign" 
                className="flex items-center px-3 py-3 text-white rounded-lg hover:bg-blue-800 transition-colors group"
              >
                <div className="flex items-center justify-center w-10 h-10 bg-blue-800 group-hover:bg-blue-700 rounded-lg flex-shrink-0">
                  <PencilSquareIcon className="h-5 w-5" />
                </div>
                {!collapsed && <span className="ml-3 font-medium">Graphic Design</span>}
              </Link>

              {/* Completed Items */}
              <Link 
                href="/admin/completed" 
                className="flex items-center px-3 py-3 text-white rounded-lg hover:bg-blue-800 transition-colors group"
              >
                <div className="flex items-center justify-center w-10 h-10 bg-blue-800 group-hover:bg-blue-700 rounded-lg flex-shrink-0">
                  <CheckCircleIcon className="h-5 w-5" />
                </div>
                {!collapsed && <span className="ml-3 font-medium">Completed Items</span>}
              </Link>

              {/* Analytics */}
              <Link 
                href="/admin/analytics" 
                className="flex items-center px-3 py-3 text-white rounded-lg hover:bg-blue-800 transition-colors group"
              >
                <div className="flex items-center justify-center w-10 h-10 bg-blue-800 group-hover:bg-blue-700 rounded-lg flex-shrink-0">
                  <ChartBarIcon className="h-5 w-5" />
                </div>
                {!collapsed && <span className="ml-3 font-medium">Analytics</span>}
              </Link>
            </nav>

            {/* Sidebar footer */}
            <div className="mt-auto border-t border-blue-800 p-4">
              <div className="flex flex-col space-y-2">
                {/* Toggle theme button */}
                <button
                  onClick={handleToggleTheme}
                  className="flex items-center p-3 text-white rounded-lg hover:bg-blue-800 transition-colors group"
                >
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-800 group-hover:bg-blue-700 rounded-lg flex-shrink-0">
                    {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
                  </div>
                  {!collapsed && (
                    <span className="ml-3 font-medium">
                      {isDark ? 'Light Mode' : 'Dark Mode'}
                    </span>
                  )}
                </button>
                
                {/* Sign out button */}
                <button
                  onClick={handleSignOut}
                  className="flex items-center p-3 text-white rounded-lg hover:bg-blue-800 transition-colors group"
                >
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-800 group-hover:bg-blue-700 rounded-lg flex-shrink-0">
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  </div>
                  {!collapsed && <span className="ml-3 font-medium">Sign Out</span>}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Mobile menu backdrop */}
      {isMobile && mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Mobile sidebar */}
      <AnimatePresence>
        {isMobile && mobileMenuOpen && (
          <motion.div 
            className="fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-sh-primary to-blue-900 shadow-xl z-30"
            initial="closed"
            animate="open"
            exit="closed"
            variants={mobileMenuVariants}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="flex h-16 items-center justify-between px-4 border-b border-blue-800">
              <Link href="/admin" className="text-white font-bold flex items-center space-x-2">
                <span className="text-xl tracking-tight">Saint Helen</span>
              </Link>
              <button 
                onClick={toggleMobileMenu}
                className="p-1.5 rounded-lg text-white bg-blue-800 hover:bg-blue-700 transition-colors"
              >
                <ChevronDoubleLeftIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="py-6 flex flex-col h-[calc(100%-4rem)] justify-between">
              <nav className="px-2 space-y-1">
                {/* Mobile navigation - same as desktop but without collapsing */}
                <Link 
                  href="/admin" 
                  className="flex items-center px-3 py-3 text-white rounded-lg hover:bg-blue-800 transition-colors group"
                  onClick={toggleMobileMenu}
                >
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-800 group-hover:bg-blue-700 rounded-lg flex-shrink-0">
                    <HomeIcon className="h-5 w-5" />
                  </div>
                  <span className="ml-3 font-medium">Dashboard</span>
                </Link>

                <Link 
                  href="/admin#announcements" 
                  className="flex items-center px-3 py-3 text-white rounded-lg hover:bg-blue-800 transition-colors group"
                  onClick={toggleMobileMenu}
                >
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-800 group-hover:bg-blue-700 rounded-lg flex-shrink-0">
                    <MegaphoneIcon className="h-5 w-5" />
                  </div>
                  <span className="ml-3 font-medium">Announcements</span>
                </Link>

                <Link 
                  href="/admin#websiteUpdates" 
                  className="flex items-center px-3 py-3 text-white rounded-lg hover:bg-blue-800 transition-colors group"
                  onClick={toggleMobileMenu}
                >
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-800 group-hover:bg-blue-700 rounded-lg flex-shrink-0">
                    <GlobeAltIcon className="h-5 w-5" />
                  </div>
                  <span className="ml-3 font-medium">Website Updates</span>
                </Link>

                <Link 
                  href="/admin#smsRequests" 
                  className="flex items-center px-3 py-3 text-white rounded-lg hover:bg-blue-800 transition-colors group"
                  onClick={toggleMobileMenu}
                >
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-800 group-hover:bg-blue-700 rounded-lg flex-shrink-0">
                    <ChatBubbleLeftRightIcon className="h-5 w-5" />
                  </div>
                  <span className="ml-3 font-medium">SMS Requests</span>
                </Link>

                <Link 
                  href="/admin#avRequests" 
                  className="flex items-center px-3 py-3 text-white rounded-lg hover:bg-blue-800 transition-colors group"
                  onClick={toggleMobileMenu}
                >
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-800 group-hover:bg-blue-700 rounded-lg flex-shrink-0">
                    <VideoCameraIcon className="h-5 w-5" />
                  </div>
                  <span className="ml-3 font-medium">A/V Requests</span>
                </Link>

                <Link 
                  href="/admin#flyerReviews" 
                  className="flex items-center px-3 py-3 text-white rounded-lg hover:bg-blue-800 transition-colors group"
                  onClick={toggleMobileMenu}
                >
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-800 group-hover:bg-blue-700 rounded-lg flex-shrink-0">
                    <DocumentTextIcon className="h-5 w-5" />
                  </div>
                  <span className="ml-3 font-medium">Flyer Reviews</span>
                </Link>

                <Link 
                  href="/admin#graphicDesign" 
                  className="flex items-center px-3 py-3 text-white rounded-lg hover:bg-blue-800 transition-colors group"
                  onClick={toggleMobileMenu}
                >
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-800 group-hover:bg-blue-700 rounded-lg flex-shrink-0">
                    <PencilSquareIcon className="h-5 w-5" />
                  </div>
                  <span className="ml-3 font-medium">Graphic Design</span>
                </Link>

                <Link 
                  href="/admin/completed" 
                  className="flex items-center px-3 py-3 text-white rounded-lg hover:bg-blue-800 transition-colors group"
                  onClick={toggleMobileMenu}
                >
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-800 group-hover:bg-blue-700 rounded-lg flex-shrink-0">
                    <CheckCircleIcon className="h-5 w-5" />
                  </div>
                  <span className="ml-3 font-medium">Completed Items</span>
                </Link>

                <Link 
                  href="/admin/analytics" 
                  className="flex items-center px-3 py-3 text-white rounded-lg hover:bg-blue-800 transition-colors group"
                  onClick={toggleMobileMenu}
                >
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-800 group-hover:bg-blue-700 rounded-lg flex-shrink-0">
                    <ChartBarIcon className="h-5 w-5" />
                  </div>
                  <span className="ml-3 font-medium">Analytics</span>
                </Link>
              </nav>

              <div className="mt-auto border-t border-blue-800 p-4">
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={handleToggleTheme}
                    className="flex items-center p-3 text-white rounded-lg hover:bg-blue-800 transition-colors group"
                  >
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-800 group-hover:bg-blue-700 rounded-lg flex-shrink-0">
                      {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
                    </div>
                    <span className="ml-3 font-medium">
                      {isDark ? 'Light Mode' : 'Dark Mode'}
                    </span>
                  </button>
                  
                  <button
                    onClick={handleSignOut}
                    className="flex items-center p-3 text-white rounded-lg hover:bg-blue-800 transition-colors group"
                  >
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-800 group-hover:bg-blue-700 rounded-lg flex-shrink-0">
                      <ArrowRightOnRectangleIcon className="h-5 w-5" />
                    </div>
                    <span className="ml-3 font-medium">Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden md:ml-[4.5rem] transition-all duration-300" style={{ marginLeft: collapsed ? '4.5rem' : '16rem' }}>
        {/* Top navigation */}
        <header className="bg-white dark:bg-slate-800 shadow-sm z-10 relative">
          <div className="px-4 h-16 flex items-center justify-between">
            <div className="flex items-center">
              {/* Mobile menu button */}
              <button
                onClick={toggleMobileMenu}
                className="md:hidden p-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 mr-3"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              </button>
              
              {/* Page title */}
              <h1 className="text-xl font-semibold font-baskerville">{title}</h1>
            </div>
            
            {/* Right side actions */}
            <div className="flex items-center">
              {/* Notifications bell */}
              <button className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full mr-2">
                <BellIcon className="h-6 w-6" />
                {notifications > 0 && (
                  <span className="absolute top-1 right-1 inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-xs font-medium">
                    {notifications}
                  </span>
                )}
              </button>

              {/* User profile */}
              <div className="relative">
                <button className="flex text-sm rounded-full bg-blue-100 dark:bg-blue-900 p-1 hover:ring-2 hover:ring-blue-300 dark:hover:ring-blue-700 transition-all">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 text-white flex items-center justify-center">
                    {session?.user?.name?.charAt(0) || 'U'}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content with nice glass effect */}
        <main className="flex-1 overflow-y-auto p-6 pb-24 bg-slate-50 dark:bg-slate-900">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}