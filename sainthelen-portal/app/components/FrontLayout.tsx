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
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface FrontLayoutProps {
  children: React.ReactNode;
  title?: string;
  showHero?: boolean;
}

export default function FrontLayout({
  children,
  title = 'Saint Helen Communications Portal',
  showHero = true
}: FrontLayoutProps) {
  const [isDark, setIsDark] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isHomePage = pathname === '/';

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
      htmlEl.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      htmlEl.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  const navLinks = [
    { href: '/', label: 'Home', icon: HomeIcon },
    { href: '/guidelines', label: 'Guidelines', icon: InformationCircleIcon },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-sh-cream dark:bg-slate-900">
      {/* Navigation */}
      <header className="bg-sh-navy dark:bg-slate-800 text-white sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center group">
              <img
                src="/images/Saint-Helen-Logo-White.png"
                alt="Saint Helen"
                className="h-8 w-auto transition-transform duration-200 group-hover:scale-105"
              />
              <span className="ml-3 font-serif font-bold text-lg hidden sm:block">
                Communications Portal
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    flex items-center px-4 py-2 rounded-button text-sm font-medium
                    transition-all duration-200
                    ${pathname === link.href
                      ? 'bg-white/15 text-white'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                    }
                  `}
                >
                  <link.icon className="w-5 h-5 mr-2" />
                  {link.label}
                </Link>
              ))}

              {/* Theme Toggle */}
              <button
                onClick={handleToggleTheme}
                className="p-2 ml-2 rounded-button text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
                aria-label="Toggle theme"
              >
                {isDark ? (
                  <SunIcon className="w-5 h-5" />
                ) : (
                  <MoonIcon className="w-5 h-5" />
                )}
              </button>
            </nav>

            {/* Mobile menu button */}
            <div className="flex md:hidden items-center space-x-2">
              <button
                onClick={handleToggleTheme}
                className="p-2 rounded-button text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
                aria-label="Toggle theme"
              >
                {isDark ? (
                  <SunIcon className="w-5 h-5" />
                ) : (
                  <MoonIcon className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-button text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="w-6 h-6" />
                ) : (
                  <Bars3Icon className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-white/10"
            >
              <div className="px-4 py-3 space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center px-4 py-3 rounded-button text-sm font-medium
                      transition-all duration-200
                      ${pathname === link.href
                        ? 'bg-white/15 text-white'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                      }
                    `}
                  >
                    <link.icon className="w-5 h-5 mr-3" />
                    {link.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero Section - Only on homepage */}
      {isHomePage && showHero && (
        <div className="relative bg-sh-navy dark:bg-slate-800 overflow-hidden">
          {/* Background image with overlay */}
          <div className="absolute inset-0">
            <img
              src="/images/hero.jpg"
              alt=""
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-sh-navy via-sh-navy-700 to-sh-navy-900 opacity-90" />
          </div>

          {/* Decorative elements */}
          <div className="absolute top-10 left-10 w-32 h-32 bg-sh-rust/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-white/5 rounded-full blur-3xl" />

          {/* Content */}
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white mb-6">
                Saint Helen
                <span className="block">Communications Portal</span>
              </h1>
              <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10">
                Simple forms and tools to help promote your ministry and events
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="#forms"
                  className="inline-flex items-center justify-center px-8 py-4 bg-sh-rust hover:bg-sh-rust-600 text-white rounded-button font-medium transition-all duration-300 hover:-translate-y-1 hover:shadow-button-hover"
                >
                  Get Started
                </Link>
                <Link
                  href="/guidelines"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-button font-medium border border-white/20 transition-all duration-300 hover:-translate-y-1"
                >
                  View Guidelines
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Page Title - For non-homepage */}
      {!isHomePage && title && (
        <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-sh-navy dark:text-white">
              {title}
            </h1>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-sh-navy dark:bg-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start mb-3">
                <img
                  src="/images/Saint-Helen-Logo-White.png"
                  alt="Saint Helen"
                  className="h-8 w-auto mr-3"
                />
                <span className="font-serif font-bold text-lg">Saint Helen Church</span>
              </div>
              <p className="text-sm text-white/60">
                © {new Date().getFullYear()} Saint Helen Church, Westfield, NJ
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/admin"
                className="text-sm text-white/70 hover:text-white px-3 py-2 rounded-button hover:bg-white/10 transition-all duration-200"
              >
                Admin Login
              </Link>
              <Link
                href="/guidelines"
                className="text-sm text-white/70 hover:text-white px-3 py-2 rounded-button hover:bg-white/10 transition-all duration-200"
              >
                Guidelines
              </Link>
              <a
                href="https://sainthelen.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-white/70 hover:text-white px-3 py-2 rounded-button hover:bg-white/10 transition-all duration-200"
              >
                Main Website
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
