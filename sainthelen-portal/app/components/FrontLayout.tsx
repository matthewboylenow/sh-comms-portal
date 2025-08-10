// app/components/FrontLayout.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  SunIcon, 
  MoonIcon, 
  HomeIcon, 
  InformationCircleIcon, 
  MegaphoneIcon, 
  GlobeAltIcon, 
  ChatBubbleLeftRightIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';

interface FrontLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function FrontLayout({ children, title = 'Saint Helen Communications Portal' }: FrontLayoutProps) {
  const [isDark, setIsDark] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close dropdown when route changes
  useEffect(() => {
    setDropdownOpen(false);
  }, [pathname]);

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

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Removed form links as requested

  // No form pages anymore
  const isFormPage = false;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-925 dark:via-gray-900 dark:to-gray-850">
      {/* Top Navigation */}
      <header className="bg-sh-primary/95 dark:bg-sh-primary-dark/95 backdrop-blur-sm text-white border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          {/* Logo and title */}
          <motion.div 
            className="flex items-center"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Link href="/" className="flex items-center group">
              <motion.img 
                src="/images/Saint-Helen-Logo-White.png" 
                alt="Saint Helen Logo" 
                className="h-8 w-auto transition-transform duration-200 group-hover:scale-105"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
              <span className="text-xl font-bold ml-3 bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                Communications Portal
              </span>
            </Link>
          </motion.div>

          {/* Desktop navigation */}
          <nav className="hidden md:flex space-x-2">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Link 
                href="/" 
                className={`flex items-center text-white/90 hover:text-white transition-all duration-200 px-4 py-2.5 rounded-xl hover:bg-white/10 group ${
                  pathname === '/' ? 'bg-white/15 text-white' : ''
                }`}
              >
                <HomeIcon className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-200" />
                <span className="font-medium">Home</span>
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Link 
                href="/guidelines" 
                className={`flex items-center text-white/90 hover:text-white transition-all duration-200 px-4 py-2.5 rounded-xl hover:bg-white/10 group ${
                  pathname === '/guidelines' ? 'bg-white/15 text-white' : ''
                }`}
              >
                <InformationCircleIcon className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-200" />
                <span className="font-medium">Guidelines</span>
              </Link>
            </motion.div>
          </nav>

          {/* Theme toggle and mobile menu button */}
          <div className="flex items-center space-x-2">
            <motion.button
              onClick={handleToggleTheme}
              className="p-2.5 rounded-xl hover:bg-white/10 transition-all duration-200 group"
              aria-label="Toggle Dark Mode"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={isDark ? 'sun' : 'moon'}
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {isDark ? (
                    <SunIcon className="h-5 w-5 group-hover:text-amber-300 transition-colors duration-200" />
                  ) : (
                    <MoonIcon className="h-5 w-5 group-hover:text-blue-200 transition-colors duration-200" />
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.button>

            {/* Mobile menu button */}
            <motion.button
              onClick={toggleMobileMenu}
              className="md:hidden p-2.5 rounded-xl hover:bg-white/10 transition-all duration-200"
              aria-label="Toggle Mobile Menu"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={{ rotate: mobileMenuOpen ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </motion.div>
            </motion.button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              className="md:hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <div className="bg-sh-primary/90 dark:bg-sh-primary/90 backdrop-blur-sm border-t border-white/10">
                <div className="container mx-auto px-4 py-3 space-y-1">
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.2, delay: 0.1 }}
                  >
                    <Link 
                      href="/" 
                      className={`flex items-center text-white/90 hover:text-white hover:bg-white/10 px-4 py-3 rounded-xl transition-all duration-200 group ${
                        pathname === '/' ? 'bg-white/15 text-white' : ''
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <HomeIcon className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform duration-200" />
                      <span className="font-medium">Home</span>
                    </Link>
                  </motion.div>
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.2, delay: 0.2 }}
                  >
                    <Link 
                      href="/guidelines" 
                      className={`flex items-center text-white/90 hover:text-white hover:bg-white/10 px-4 py-3 rounded-xl transition-all duration-200 group ${
                        pathname === '/guidelines' ? 'bg-white/15 text-white' : ''
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <InformationCircleIcon className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform duration-200" />
                      <span className="font-medium">Guidelines</span>
                    </Link>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero banner */}
      <div className="relative bg-gradient-to-br from-sh-primary via-sh-primary-dark to-gray-900 text-white overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="/images/hero.jpg" 
            alt="Saint Helen Communications" 
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-sh-primary/60 via-sh-primary-dark/70 to-gray-900/80"></div>
        </div>
        <div className="container relative mx-auto py-32 sm:py-40 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl bg-gradient-to-r from-white via-gray-100 to-sh-sage-light bg-clip-text text-transparent">
              Saint Helen Communications Portal
            </h1>
            <p className="mt-8 max-w-2xl mx-auto text-xl text-gray-200 leading-relaxed">
              Simple forms and tools to help promote your ministry and events
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="#forms" 
                className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 border border-white/20"
              >
                Get Started
              </Link>
              <Link 
                href="/guidelines" 
                className="bg-sh-sage/20 backdrop-blur-sm hover:bg-sh-sage/30 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 border border-sh-sage/30"
              >
                View Guidelines
              </Link>
            </div>
          </div>
        </div>
        
        {/* Floating elements for visual interest */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-sh-sage/20 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-20 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 right-10 w-16 h-16 bg-sh-sage/15 rounded-full blur-lg"></div>
      </div>

      {/* Page title - only shown if not on homepage */}
      {title !== 'Saint Helen Communications Portal' && (
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-sh-primary to-sh-primary-light bg-clip-text text-transparent">{title}</h1>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-sh-primary via-sh-primary-dark to-sh-secondary text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container relative mx-auto py-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center mb-2">
                <img 
                  src="/images/Saint-Helen-Logo-White.png" 
                  alt="Saint Helen Logo" 
                  className="h-8 w-auto mr-3"
                />
                <span className="font-bold text-lg">Saint Helen Church</span>
              </div>
              <p className="text-sm text-gray-200">© {new Date().getFullYear()} Saint Helen Church, Westfield, NJ</p>
            </div>
            <div className="flex space-x-6">
              <Link href="/admin" className="text-sm text-white/90 hover:text-white transition-all duration-200 px-3 py-2 rounded-lg hover:bg-white/10">
                Admin Login
              </Link>
              <Link href="/guidelines" className="text-sm text-white/90 hover:text-white transition-all duration-200 px-3 py-2 rounded-lg hover:bg-white/10">
                Guidelines
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-sh-sage/20 rounded-full blur-xl"></div>
        <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full blur-lg"></div>
      </footer>
    </div>
  );
}