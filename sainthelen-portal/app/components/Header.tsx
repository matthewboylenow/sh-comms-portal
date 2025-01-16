// components/Header.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid';

export default function Header() {
  const [isDark, setIsDark] = useState(false);

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

  return (
    <header className="w-full flex items-center justify-between bg-sh-primary px-4 py-3">
      <Link href="/" className="text-white text-lg font-semibold">
        Saint Helen Portal
      </Link>

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
    </header>
  );
}
