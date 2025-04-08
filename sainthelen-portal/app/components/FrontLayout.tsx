// app/components/FrontLayout.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Navigation */}
      <header className="bg-sh-primary dark:bg-sh-primary text-white">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
          {/* Logo and title */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <img 
                src="/images/Saint-Helen-Logo-White.png" 
                alt="Saint Helen Logo" 
                className="h-8 w-auto"
              />
              <span className="text-xl font-semibold ml-3">Communications Portal</span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden md:flex space-x-6">
            <Link href="/" className="flex items-center text-white hover:text-gray-300 transition">
              <HomeIcon className="h-5 w-5 mr-1" />
              <span>Home</span>
            </Link>
            <Link href="/guidelines" className="flex items-center text-white hover:text-gray-300 transition">
              <InformationCircleIcon className="h-5 w-5 mr-1" />
              <span>Guidelines</span>
            </Link>
            
            {/* No longer needed Request Services Dropdown */}
          </nav>

          {/* Theme toggle and mobile menu button */}
          <div className="flex items-center">
            <button
              onClick={handleToggleTheme}
              className="p-2 rounded-full hover:bg-sh-secondary dark:hover:bg-gray-700 transition"
              aria-label="Toggle Dark Mode"
            >
              {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </button>

            {/* Mobile menu button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden ml-2 p-2 rounded-full hover:bg-sh-secondary dark:hover:bg-gray-700 transition"
              aria-label="Toggle Mobile Menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="bg-sh-primary dark:bg-sh-primary py-2 shadow-inner">
              <div className="space-y-2 px-4">
                <Link 
                  href="/" 
                  className="flex items-center text-white hover:bg-sh-secondary dark:hover:bg-gray-700 px-3 py-2 rounded"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <HomeIcon className="h-5 w-5 mr-2" />
                  <span>Home</span>
                </Link>
                <Link 
                  href="/guidelines" 
                  className="flex items-center text-white hover:bg-sh-secondary dark:hover:bg-gray-700 px-3 py-2 rounded"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <InformationCircleIcon className="h-5 w-5 mr-2" />
                  <span>Guidelines</span>
                </Link>
                
                {/* Mobile menu links removed as requested */}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero banner */}
      <div className="relative bg-gray-900 text-white">
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src="/images/hero.jpg" 
            alt="Saint Helen Communications" 
            className="w-full h-full object-cover opacity-40"
          />
        </div>
        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Saint Helen Communications Portal
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-xl">
            Best practices for promoting your ministry or event
          </p>
        </div>
      </div>

      {/* Page title - only shown if not on homepage */}
      {title !== 'Saint Helen Communications Portal' && (
        <div className="bg-white dark:bg-gray-800 shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-sh-primary dark:bg-sh-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-sm">© {new Date().getFullYear()} Saint Helen Church, Westfield, NJ</p>
            </div>
            <div className="flex space-x-4">
              <Link href="/admin" className="text-sm text-white hover:text-gray-300 transition">
                Admin Login
              </Link>
              <Link href="/guidelines" className="text-sm text-white hover:text-gray-300 transition">
                Guidelines
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}