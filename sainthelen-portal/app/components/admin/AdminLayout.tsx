// app/components/admin/AdminLayout.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useNotificationContext } from '../../context/NotificationContext';
import { usePermissions } from '../../hooks/usePermissions';
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
  BellIcon,
  BuildingOffice2Icon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const { data: session } = useSession();
  const notificationContext = useNotificationContext();
  const [collapsed, setCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [userPreferences, setUserPreferences] = useState(false);
  const [notificationCenter, setNotificationCenter] = useState(false);
  
  // Get user permissions
  const { permissions, loading: permissionsLoading } = usePermissions();

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
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-inter">
      {/* Desktop Sidebar */}
      <AnimatePresence initial={false}>
        <motion.div 
          className={`fixed z-20 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-sm hidden md:block ${isMobile ? 'hidden' : 'block'}`}
          animate={collapsed ? 'collapsed' : 'expanded'}
          variants={sidebarVariants}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {/* Sidebar header with logo */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
            {!collapsed && (
              <Link href="/admin" className="text-gray-900 dark:text-gray-100 font-bold flex items-center space-x-2">
                <span className="text-xl tracking-tight">Saint Helen</span>
              </Link>
            )}
            <button 
              onClick={toggleSidebar}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
            >
              {collapsed ? 
                <ChevronDoubleRightIcon className="h-4 w-4" /> : 
                <ChevronDoubleLeftIcon className="h-4 w-4" />
              }
            </button>
          </div>

          {/* Sidebar main navigation */}
          <div className="py-6 flex flex-col h-[calc(100%-4rem)] justify-between">
            <nav className="px-3 space-y-1">
              {/* Dashboard link - only for admins */}
              {permissions?.canAccessMainDashboard && (
                <Link 
                  href="/admin" 
                  className="flex items-center px-3 py-2.5 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all duration-200 group"
                >
                  <div className="flex items-center justify-center w-8 h-8 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                    <HomeIcon className="h-5 w-5" />
                  </div>
                  {!collapsed && <span className="ml-3 font-medium">Dashboard</span>}
                </Link>
              )}

              {/* Approvals link - for both admins and approvers */}
              {permissions?.canAccessApprovals && (
                <Link 
                  href="/admin/approvals" 
                  className="flex items-center px-3 py-2.5 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all duration-200 group"
                >
                  <div className="flex items-center justify-center w-8 h-8 text-gray-500 dark:text-gray-400 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-200">
                    <ClockIcon className="h-5 w-5" />
                  </div>
                  {!collapsed && <span className="ml-3 font-medium">
                    {permissions.role === 'adult_faith_approver' ? 'Adult Faith Approvals' : 'Approvals'}
                  </span>}
                </Link>
              )}

              {/* Completed Items - only for admins */}
              {permissions?.canAccessCompleted && (
                <Link 
                  href="/admin/completed" 
                  className="flex items-center px-3 py-2.5 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all duration-200 group"
                >
                  <div className="flex items-center justify-center w-8 h-8 text-gray-500 dark:text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-200">
                    <CheckCircleIcon className="h-5 w-5" />
                  </div>
                  {!collapsed && <span className="ml-3 font-medium">Completed Items</span>}
                </Link>
              )}

              {/* Analytics - only for admins */}
              {permissions?.canAccessAnalytics && (
                <Link 
                  href="/admin/analytics" 
                  className="flex items-center px-3 py-2.5 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all duration-200 group"
                >
                  <div className="flex items-center justify-center w-8 h-8 text-gray-500 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-200">
                    <ChartBarIcon className="h-5 w-5" />
                  </div>
                  {!collapsed && <span className="ml-3 font-medium">Analytics</span>}
                </Link>
              )}

              {/* Reports - only for admins */}
              {permissions?.canAccessAnalytics && (
                <Link 
                  href="/admin/reports" 
                  className="flex items-center px-3 py-2.5 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all duration-200 group"
                >
                  <div className="flex items-center justify-center w-8 h-8 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                    <DocumentTextIcon className="h-5 w-5" />
                  </div>
                  {!collapsed && <span className="ml-3 font-medium">Weekly Reports</span>}
                </Link>
              )}

              {/* Ministries - only for admins */}
              {permissions?.canAccessMinistries && (
                <Link 
                  href="/admin/ministries" 
                  className="flex items-center px-3 py-2.5 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all duration-200 group"
                >
                  <div className="flex items-center justify-center w-8 h-8 text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200">
                    <BuildingOffice2Icon className="h-5 w-5" />
                  </div>
                  {!collapsed && <span className="ml-3 font-medium">Ministries</span>}
                </Link>
              )}
            </nav>

            {/* Sidebar footer */}
            <div className="mt-auto border-t border-gray-200 dark:border-gray-800 pt-4 px-3">
              <div className="flex flex-col space-y-1">
                {/* Toggle theme button */}
                <button
                  onClick={handleToggleTheme}
                  className="flex items-center px-3 py-2.5 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all duration-200 group"
                >
                  <div className="flex items-center justify-center w-8 h-8 text-gray-500 dark:text-gray-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors duration-200">
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
                  className="flex items-center px-3 py-2.5 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 group"
                >
                  <div className="flex items-center justify-center w-8 h-8 text-gray-500 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-200">
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
            className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-lg z-30"
            initial="closed"
            animate="open"
            exit="closed"
            variants={mobileMenuVariants}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
              <Link href="/admin" className="text-gray-900 dark:text-gray-100 font-bold flex items-center space-x-2">
                <span className="text-xl tracking-tight">Saint Helen</span>
              </Link>
              <button 
                onClick={toggleMobileMenu}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
              >
                <ChevronDoubleLeftIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="py-6 flex flex-col h-[calc(100%-4rem)] justify-between">
              <nav className="px-3 space-y-1">
                {/* Mobile navigation - role-based like desktop */}
                {permissions?.canAccessMainDashboard && (
                  <Link 
                    href="/admin" 
                    className="flex items-center px-3 py-2.5 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all duration-200 group"
                    onClick={toggleMobileMenu}
                  >
                    <div className="flex items-center justify-center w-8 h-8 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                      <HomeIcon className="h-5 w-5" />
                    </div>
                    <span className="ml-3 font-medium">Dashboard</span>
                  </Link>
                )}

                {permissions?.canAccessApprovals && (
                  <Link 
                    href="/admin/approvals" 
                    className="flex items-center px-3 py-2.5 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all duration-200 group"
                    onClick={toggleMobileMenu}
                  >
                    <div className="flex items-center justify-center w-8 h-8 text-gray-500 dark:text-gray-400 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-200">
                      <ClockIcon className="h-5 w-5" />
                    </div>
                    <span className="ml-3 font-medium">
                      {permissions.role === 'adult_faith_approver' ? 'Adult Faith Approvals' : 'Approvals'}
                    </span>
                  </Link>
                )}

                {permissions?.canAccessCompleted && (
                  <Link 
                    href="/admin/completed" 
                    className="flex items-center px-3 py-2.5 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all duration-200 group"
                    onClick={toggleMobileMenu}
                  >
                    <div className="flex items-center justify-center w-8 h-8 text-gray-500 dark:text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-200">
                      <CheckCircleIcon className="h-5 w-5" />
                    </div>
                    <span className="ml-3 font-medium">Completed Items</span>
                  </Link>
                )}

                {permissions?.canAccessAnalytics && (
                  <Link 
                    href="/admin/analytics" 
                    className="flex items-center px-3 py-2.5 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all duration-200 group"
                    onClick={toggleMobileMenu}
                  >
                    <div className="flex items-center justify-center w-8 h-8 text-gray-500 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-200">
                      <ChartBarIcon className="h-5 w-5" />
                    </div>
                    <span className="ml-3 font-medium">Analytics</span>
                  </Link>
                )}

                {permissions?.canAccessMinistries && (
                  <Link 
                    href="/admin/ministries" 
                    className="flex items-center px-3 py-2.5 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all duration-200 group"
                    onClick={toggleMobileMenu}
                  >
                    <div className="flex items-center justify-center w-8 h-8 text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200">
                      <BuildingOffice2Icon className="h-5 w-5" />
                    </div>
                    <span className="ml-3 font-medium">Ministries</span>
                  </Link>
                )}
              </nav>

              <div className="mt-auto border-t border-gray-200 dark:border-gray-800 pt-4 px-3">
                <div className="flex flex-col space-y-1">
                  <button
                    onClick={handleToggleTheme}
                    className="flex items-center px-3 py-2.5 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all duration-200 group"
                  >
                    <div className="flex items-center justify-center w-8 h-8 text-gray-500 dark:text-gray-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors duration-200">
                      {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
                    </div>
                    <span className="ml-3 font-medium">
                      {isDark ? 'Light Mode' : 'Dark Mode'}
                    </span>
                  </button>
                  
                  <button
                    onClick={handleSignOut}
                    className="flex items-center px-3 py-2.5 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 group"
                  >
                    <div className="flex items-center justify-center w-8 h-8 text-gray-500 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-200">
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
      <div className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 ${isMobile ? '' : (collapsed ? 'ml-[4.5rem]' : 'ml-64')}`}>
        {/* Top navigation */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-10 relative">
          <div className="px-4 h-16 flex items-center justify-between">
            <div className="flex items-center">
              {/* Mobile menu button */}
              <button
                onClick={toggleMobileMenu}
                className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all duration-200 mr-3"
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
              {/* Notifications dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setNotificationCenter(!notificationCenter)}
                  className="relative p-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white rounded-xl transition-all duration-200 mr-2"
                >
                  <BellIcon className="h-6 w-6" />
                  {notificationContext.unreadCount > 0 && (
                    <span className="absolute top-1 right-1 inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-xs font-medium">
                      {notificationContext.unreadCount}
                    </span>
                  )}
                </button>
                
                {notificationCenter && (
                  <div className="absolute right-0 mt-2 w-80 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 z-50">
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
                                  {notification.relatedRecordType === 'Announcements' ? (
                                    <MegaphoneIcon className={`h-4 w-4 ${
                                      notification.type === 'info' ? 'text-blue-600 dark:text-blue-400' :
                                      notification.type === 'success' ? 'text-green-600 dark:text-green-400' :
                                      notification.type === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                                      'text-red-600 dark:text-red-400'
                                    }`} />
                                  ) : (
                                    <BellIcon className={`h-4 w-4 ${
                                      notification.type === 'info' ? 'text-blue-600 dark:text-blue-400' :
                                      notification.type === 'success' ? 'text-green-600 dark:text-green-400' :
                                      notification.type === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                                      'text-red-600 dark:text-red-400'
                                    }`} />
                                  )}
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
                    {notificationContext.notifications.length > 0 && (
                      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                        <button 
                          onClick={() => {
                            // Here you would navigate to a full notifications page
                            setNotificationCenter(false);
                          }}
                          className="w-full text-center text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                        >
                          View all notifications
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* User profile dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex text-sm rounded-full bg-gray-100 dark:bg-gray-800 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
                >
                  <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-medium">
                    {session?.user?.name?.charAt(0) || 'U'}
                  </div>
                </button>
                
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 z-50">
                    <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                      <p className="font-medium">{session?.user?.name}</p>
                      <p className="text-gray-500 dark:text-gray-400 truncate">{session?.user?.email}</p>
                    </div>
                    <button onClick={handleToggleTheme} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                      {isDark ? 'Light Mode' : 'Dark Mode'}
                    </button>
                    <button onClick={() => setUserPreferences(!userPreferences)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                      Preferences
                    </button>
                    <button onClick={handleSignOut} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                      Sign Out
                    </button>
                  </div>
                )}
                
                {userPreferences && (
                  <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="preferences-modal" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setUserPreferences(false)}></div>
                      <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                      <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                        <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                          <div className="sm:flex sm:items-start">
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100" id="modal-title">
                                User Preferences
                              </h3>
                              <div className="mt-6 space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Theme</label>
                                  <select 
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                    value={isDark ? 'dark' : 'light'}
                                    onChange={(e) => {
                                      const htmlEl = document.documentElement;
                                      if (e.target.value === 'dark') {
                                        htmlEl.classList.add('dark');
                                        localStorage.setItem('theme', 'dark');
                                        setIsDark(true);
                                      } else {
                                        htmlEl.classList.remove('dark');
                                        localStorage.setItem('theme', 'light');
                                        setIsDark(false);
                                      }
                                    }}
                                  >
                                    <option value="light">Light</option>
                                    <option value="dark">Dark</option>
                                    <option value="system">System</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notifications</label>
                                  <div className="mt-2 space-y-2">
                                    <div className="flex items-center">
                                      <input 
                                        id="notify-new-requests" 
                                        type="checkbox" 
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        defaultChecked
                                      />
                                      <label htmlFor="notify-new-requests" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                        New request notifications
                                      </label>
                                    </div>
                                    <div className="flex items-center">
                                      <input 
                                        id="notify-status-updates" 
                                        type="checkbox" 
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        defaultChecked
                                      />
                                      <label htmlFor="notify-status-updates" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                        Status update notifications
                                      </label>
                                    </div>
                                    <div className="flex items-center">
                                      <input 
                                        id="notify-completion" 
                                        type="checkbox" 
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        defaultChecked
                                      />
                                      <label htmlFor="notify-completion" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                        Request completion notifications
                                      </label>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                          <button 
                            type="button" 
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                            onClick={() => setUserPreferences(false)}
                          >
                            Save
                          </button>
                          <button 
                            type="button" 
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                            onClick={() => setUserPreferences(false)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content with nice glass effect */}
        <main className="flex-1 overflow-y-auto p-6 pb-24 bg-gray-50 dark:bg-gray-900">
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