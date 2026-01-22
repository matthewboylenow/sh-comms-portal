// app/components/admin/AdminLayout.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useNotificationContext } from '../../context/NotificationContext';
import { usePermissions } from '../../hooks/usePermissions';
import {
  HomeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  MoonIcon,
  SunIcon,
  ArrowRightOnRectangleIcon,
  DocumentTextIcon,
  ChartBarIcon,
  BellIcon,
  BuildingOffice2Icon,
  ClockIcon,
  Bars3Icon,
  XMarkIcon,
  MegaphoneIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const { data: session } = useSession();
  const notificationContext = useNotificationContext();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const { permissions } = usePermissions();

  useEffect(() => {
    const isDarkMode = localStorage.getItem('theme') === 'dark';
    setIsDark(isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    }

    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setCollapsed(true);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleToggleTheme = () => {
    const htmlEl = document.documentElement;
    if (htmlEl.classList.contains('dark')) {
      htmlEl.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      htmlEl.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  if (!session) return null;

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: HomeIcon, permission: permissions?.canAccessMainDashboard, color: 'sh-navy' },
    { href: '/admin/approvals', label: permissions?.role === 'adult_faith_approver' ? 'Adult Faith Approvals' : 'Approvals', icon: ClockIcon, permission: permissions?.canAccessApprovals, color: 'sh-rust' },
    { href: '/admin/completed', label: 'Completed', icon: CheckCircleIcon, permission: permissions?.canAccessCompleted, color: 'emerald' },
    { href: '/admin/analytics', label: 'Analytics', icon: ChartBarIcon, permission: permissions?.canAccessAnalytics, color: 'purple' },
    { href: '/admin/reports', label: 'Reports', icon: DocumentTextIcon, permission: permissions?.canAccessAnalytics, color: 'sky' },
    { href: '/admin/ministries', label: 'Ministries', icon: BuildingOffice2Icon, permission: permissions?.canAccessMinistries, color: 'amber' },
  ].filter(item => item.permission);

  const isActive = (href: string) => pathname === href;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-sh-cream via-white to-sh-cream-light dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      {/* Sidebar - Desktop */}
      <motion.aside
        className="hidden lg:flex flex-col fixed inset-y-0 left-0 z-30 bg-gradient-to-b from-white via-white to-sh-cream-light dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 border-r border-gray-200/80 dark:border-slate-700/80"
        style={{ boxShadow: '2px 0 12px -2px rgba(31, 52, 109, 0.06)' }}
        animate={{ width: collapsed ? 80 : 280 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {/* Logo Section */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 dark:border-slate-700">
          <Link href="/admin" className="flex items-center">
            <div className="w-10 h-10 bg-sh-navy rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white font-serif font-bold text-lg">SH</span>
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="ml-3 font-serif font-bold text-sh-navy dark:text-white text-lg whitespace-nowrap overflow-hidden"
                >
                  Admin Portal
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg text-gray-400 hover:text-sh-navy dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            {collapsed ? <ChevronRightIcon className="w-5 h-5" /> : <ChevronLeftIcon className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <div key={item.href} className="relative px-3">
              {/* Active indicator - positioned at sidebar edge */}
              {isActive(item.href) && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-sh-rust rounded-r-full" />
              )}
              <Link
                href={item.href}
                className={`
                  flex items-center px-3 py-3 rounded-xl transition-all duration-200 group
                  ${isActive(item.href)
                    ? 'bg-sh-navy text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                  }
                `}
              >
                <item.icon className={`w-6 h-6 flex-shrink-0 ${isActive(item.href) ? '' : 'group-hover:text-sh-navy dark:group-hover:text-white'}`} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="ml-3 font-medium whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </div>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-gray-100 dark:border-slate-700 space-y-1">
          <button
            onClick={handleToggleTheme}
            className="w-full flex items-center px-3 py-3 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors group"
          >
            {isDark ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
            {!collapsed && <span className="ml-3 font-medium">{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center px-3 py-3 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors group"
          >
            <ArrowRightOnRectangleIcon className="w-6 h-6" />
            {!collapsed && <span className="ml-3 font-medium">Sign Out</span>}
          </button>
        </div>
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-slate-800 z-50 lg:hidden shadow-2xl"
            >
              <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 dark:border-slate-700">
                <Link href="/admin" className="flex items-center">
                  <div className="w-10 h-10 bg-sh-navy rounded-xl flex items-center justify-center">
                    <span className="text-white font-serif font-bold text-lg">SH</span>
                  </div>
                  <span className="ml-3 font-serif font-bold text-sh-navy dark:text-white text-lg">Admin Portal</span>
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              <nav className="px-3 py-6 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center px-3 py-3 rounded-xl transition-all duration-200
                      ${isActive(item.href)
                        ? 'bg-sh-navy text-white'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                      }
                    `}
                  >
                    <item.icon className="w-6 h-6" />
                    <span className="ml-3 font-medium">{item.label}</span>
                  </Link>
                ))}
              </nav>
              <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-100 dark:border-slate-700 space-y-1">
                <button
                  onClick={handleToggleTheme}
                  className="w-full flex items-center px-3 py-3 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                >
                  {isDark ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
                  <span className="ml-3 font-medium">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
                <button
                  onClick={() => signOut()}
                  className="w-full flex items-center px-3 py-3 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors"
                >
                  <ArrowRightOnRectangleIcon className="w-6 h-6" />
                  <span className="ml-3 font-medium">Sign Out</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${!isMobile ? (collapsed ? 'lg:ml-20' : 'lg:ml-[280px]') : ''}`}>
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-b border-gray-200/80 dark:border-slate-700/80" style={{ boxShadow: '0 1px 3px rgba(31, 52, 109, 0.04)' }}>
          <div className="h-16 px-4 lg:px-6 flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 -ml-2 mr-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <Bars3Icon className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-xl lg:text-2xl font-serif font-bold text-sh-navy dark:text-white">{title}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                  Welcome back, {session?.user?.name?.split(' ')[0]}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setNotificationOpen(!notificationOpen)}
                  className="relative p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <BellIcon className="w-6 h-6" />
                  {notificationContext.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-sh-rust text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {notificationContext.unreadCount > 9 ? '9+' : notificationContext.unreadCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {notificationOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
                    >
                      <div className="px-4 py-3 bg-sh-navy text-white flex justify-between items-center">
                        <h3 className="font-semibold">Notifications</h3>
                        <button
                          onClick={() => notificationContext.markAllAsRead()}
                          className="text-xs text-white/80 hover:text-white"
                        >
                          Mark all read
                        </button>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notificationContext.notifications.length > 0 ? (
                          notificationContext.notifications.slice(0, 5).map((notification) => (
                            <div
                              key={notification.id}
                              className={`px-4 py-3 border-b border-gray-100 dark:border-slate-700 last:border-0 ${
                                !notification.isRead ? 'bg-sh-cream dark:bg-slate-700/50' : ''
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  notification.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                                  notification.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                                  notification.type === 'error' ? 'bg-red-100 text-red-600' :
                                  'bg-sh-navy-100 text-sh-navy'
                                }`}>
                                  <MegaphoneIcon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-gray-900 dark:text-white">{notification.message}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {new Date(notification.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-8 text-center text-gray-500">
                            <BellIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p>No notifications</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-sh-navy to-sh-navy-700 rounded-xl flex items-center justify-center text-white font-medium">
                    {session?.user?.name?.charAt(0) || 'U'}
                  </div>
                  <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-200">
                    {session?.user?.name?.split(' ')[0]}
                  </span>
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                        <p className="font-medium text-gray-900 dark:text-white">{session?.user?.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{session?.user?.email}</p>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={handleToggleTheme}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
                        >
                          {isDark ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
                          {isDark ? 'Light Mode' : 'Dark Mode'}
                        </button>
                        <Link
                          href="/"
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
                        >
                          <HomeIcon className="w-4 h-4" />
                          Back to Portal
                        </Link>
                        <button
                          onClick={() => signOut()}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                        >
                          <ArrowRightOnRectangleIcon className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">
          <div className="px-4 lg:px-6 py-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        {/* Footer - sticky to bottom */}
        <footer className="mt-auto border-t border-gray-200/80 dark:border-slate-700/80 bg-gradient-to-r from-white via-sh-cream-light to-white dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 py-4 px-6">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Saint Helen Communications Portal
          </p>
        </footer>
      </div>
    </div>
  );
}
