// app/components/FrontLayout.tsx
// The volunteer-facing shell: a plain top bar (mark, name, three links) and
// the page. No hero, no welcome copy. The `title` and `showHero` props are
// kept so older pages compile; `title` becomes the document heading only
// when a page does not draw its own.
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { Bars3Icon, XMarkIcon, MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { Wordmark } from './ui/Mark';

interface FrontLayoutProps {
  children: React.ReactNode;
  title?: string;
  showHero?: boolean;
  /** Narrow (640) for forms, wide (960) for the chooser and guidelines */
  width?: 'form' | 'page';
}

export default function FrontLayout({ children, width = 'form' }: FrontLayoutProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const links = [
    { href: '/', label: 'Requests', on: pathname === '/' || !pathname?.startsWith('/guidelines') },
    { href: '/guidelines', label: 'Guidelines', on: pathname?.startsWith('/guidelines') },
    { href: '/admin', label: session ? 'Office' : 'Sign in', on: false },
  ];

  const linkCls = (on: boolean) =>
    `inline-flex h-8 items-center rounded-md px-2.5 text-[13.5px] font-medium ${
      on ? 'bg-surface-2 text-ink' : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
    }`;

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-[52px] max-w-[1120px] items-center gap-3 px-4 sm:px-6">
          <Link href="/" className="flex items-center" aria-label="Saint Helen Communications">
            <Wordmark markBg="var(--surface)" />
          </Link>
          <nav className="ml-auto hidden items-center gap-1 sm:flex" aria-label="Main">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className={linkCls(l.on)}>
                {l.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle dark mode"
              className="ml-1 grid h-8 w-8 place-items-center rounded-md text-ink-2 hover:bg-surface-2 hover:text-ink"
            >
              {resolvedTheme === 'dark' ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
            </button>
          </nav>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className="ml-auto grid h-8 w-8 place-items-center rounded-md text-ink-2 hover:bg-surface-2 sm:hidden"
          >
            {open ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
          </button>
        </div>
        {open && (
          <nav className="border-t border-line px-4 py-2 sm:hidden" aria-label="Main">
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className={`${linkCls(l.on)} flex w-full`}>
                {l.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className={`${linkCls(false)} flex w-full gap-2`}
            >
              {resolvedTheme === 'dark' ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
              {resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
          </nav>
        )}
      </header>

      <main className={`mx-auto w-full flex-1 px-4 sm:px-6 ${width === 'page' ? 'max-w-[1120px]' : 'max-w-[1120px]'}`}>{children}</main>

      <footer className="mt-10 border-t border-line">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center gap-x-4 gap-y-1 px-4 py-4 text-xs text-ink-3 sm:px-6">
          <span>Saint Helen Parish · Westfield, NJ</span>
          <a href="mailto:communications@sainthelen.org" className="hover:text-ink">
            communications@sainthelen.org
          </a>
          <Link href="/guidelines" className="hover:text-ink">
            Writing and deadlines
          </Link>
        </div>
      </footer>
    </div>
  );
}
