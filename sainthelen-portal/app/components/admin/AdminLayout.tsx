// app/components/admin/AdminLayout.tsx
// The office shell: a 240px sidebar (brand, New request, queues with counts,
// request-type filters, the signed-in user) and a main column that owns its
// header, its views row and its content. A page can hand in a right-hand
// panel; the body becomes a two-column grid while it is open.
'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import {
  InboxIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  PhotoIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
  DocumentTextIcon,
  PlusIcon,
  Bars3Icon,
  XMarkIcon,
  MoonIcon,
  SunIcon,
  ArrowRightOnRectangleIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { usePermissions } from '../../hooks/usePermissions';
import { useRequests } from '../../context/RequestsContext';
import { Wordmark } from '../ui/Mark';
import { Avatar } from '../ui/Avatar';
import { TypeSquare } from '../ui/TypeMark';
import { REQUEST_TYPES, nextWeekendIso, sameWeekend, weekendLabel, type RequestType } from '../../lib/requests';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  /** The views row: tabs on the left, tools on the right. */
  views?: React.ReactNode;
  /** A right-hand detail panel; null keeps the body single-column. */
  panel?: React.ReactNode;
  /** Remove the content padding (for pages that draw their own surface). */
  flush?: boolean;
}

export default function AdminLayout({ children, title, subtitle, actions, views, panel, flush }: AdminLayoutProps) {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setMenuOpen(false), [pathname]);

  if (!session) return null;

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* Sidebar, desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-canvas lg:flex">
        <Suspense fallback={null}>
          <Sidebar />
        </Suspense>
      </aside>

      {/* Sidebar, phone and tablet */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMenuOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col border-r border-line bg-canvas shadow-pop">
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="absolute right-2 top-3 grid h-8 w-8 place-items-center rounded text-ink-3 hover:bg-surface-2"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
            <Suspense fallback={null}>
              <Sidebar />
            </Suspense>
          </aside>
        </div>
      )}

      <div className="flex min-h-screen flex-col lg:pl-60">
        {/* Page header */}
        <header className="flex flex-wrap items-center gap-x-2.5 gap-y-1 px-4 pt-3 lg:px-6 lg:pt-4">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="-ml-1 mr-1 grid h-8 w-8 place-items-center rounded text-ink-2 hover:bg-surface-2 lg:hidden"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>
          <h1 className="text-[22px] font-semibold leading-8 tracking-[-0.01em]">{title}</h1>
          {subtitle && <span className="text-sm text-ink-3">{subtitle}</span>}
          {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
        </header>

        {/* Views + tools */}
        {views ? (
          <div className="mt-2 flex items-center gap-0.5 overflow-x-auto border-b border-line px-4 lg:px-6">{views}</div>
        ) : (
          <div className="mt-3 border-b border-line" />
        )}

        {/* Body */}
        <div className={`grid min-h-0 flex-1 ${panel ? 'grid-cols-1 xl:grid-cols-[minmax(0,1fr)_400px]' : 'grid-cols-1'}`}>
          <main className={`min-w-0 ${flush ? '' : 'px-4 py-4 lg:px-6 lg:py-5'}`}>{children}</main>
          {panel && (
            <aside
              aria-live="polite"
              className="fixed inset-x-0 bottom-0 z-20 flex max-h-[85vh] min-w-0 flex-col overflow-hidden border-t border-line bg-surface shadow-pop xl:sticky xl:top-0 xl:h-screen xl:max-h-screen xl:border-l xl:border-t-0 xl:shadow-none"
            >
              {panel}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Sidebar() {
  const { data: session } = useSession();
  const { permissions } = usePermissions();
  const { requests } = useRequests();
  const pathname = usePathname();
  const search = useSearchParams();
  const { resolvedTheme, setTheme } = useTheme();

  const open = requests.filter((r) => r.status !== 'done');
  const weekend = nextWeekendIso();
  const counts = {
    inbox: open.length,
    week: open.filter((r) => sameWeekend(r.runsOn, weekend) || (r.type === 'text' && r.runsOn && r.runsOn <= weekend)).length,
    approval: open.filter((r) => r.status === 'approval').length,
    calendar: open.filter((r) => r.calendar === 'requested').length,
  };
  const typeCounts = (t: RequestType) => open.filter((r) => r.type === t).length;

  const queue = search.get('queue');
  const type = search.get('type');
  const onInbox = pathname === '/admin';

  const canMain = permissions?.canAccessMainDashboard !== false;
  const queues = [
    canMain && { href: '/admin', label: 'Inbox', icon: InboxIcon, n: counts.inbox, on: onInbox && !queue && !type },
    canMain && { href: '/admin?queue=week', label: `This weekend`, icon: CalendarIcon, n: counts.week, on: onInbox && queue === 'week' },
    permissions?.canAccessApprovals && {
      href: '/admin/approvals',
      label: permissions?.role === 'adult_faith_approver' ? 'Adult Faith approvals' : 'Waiting on approval',
      icon: ClockIcon,
      n: counts.approval,
      on: pathname === '/admin/approvals',
    },
    canMain && { href: '/admin/calendar-requests', label: 'Calendar drafts', icon: CalendarDaysIcon, n: counts.calendar, on: pathname === '/admin/calendar-requests' },
    permissions?.canAccessCompleted && { href: '/admin/completed', label: 'Done', icon: CheckCircleIcon, n: 0, on: pathname === '/admin/completed' },
  ].filter(Boolean) as Array<{ href: string; label: string; icon: any; n: number; on: boolean }>;

  const more = [
    canMain && { href: '/admin/photos', label: 'Shared photos', icon: PhotoIcon },
    permissions?.canAccessMinistries && { href: '/admin/ministries', label: 'Ministries', icon: BuildingOffice2Icon },
    permissions?.canAccessAnalytics && { href: '/admin/analytics', label: 'Analytics', icon: ChartBarIcon },
    permissions?.canAccessAnalytics && { href: '/admin/reports', label: 'Reports', icon: DocumentTextIcon },
  ].filter(Boolean) as Array<{ href: string; label: string; icon: any }>;

  const item =
    'flex h-8 w-full items-center gap-2.5 rounded-md px-2.5 text-[13.5px] font-medium text-ink-2 hover:bg-black/[.04] dark:hover:bg-white/[.05]';
  const on = 'bg-surface text-ink shadow-[0_1px_0_rgba(0,0,0,.04)]';

  return (
    <div className="flex h-full flex-col overflow-y-auto px-2.5 pb-3 pt-3.5">
      <Link href="/admin" className="mb-3 block px-2 pt-1">
        <Wordmark sub="Communications" markBg="var(--canvas)" />
      </Link>

      <Link
        href="/"
        className="mb-2.5 inline-flex h-[34px] items-center justify-center gap-1.5 rounded-md bg-navy text-[13.5px] font-medium text-on-navy hover:bg-navy-hover"
      >
        <PlusIcon className="h-4 w-4" />
        New request
      </Link>

      <nav className="flex flex-col gap-0.5">
        {queues.map((q) => (
          <Link key={q.href} href={q.href} className={`${item} ${q.on ? on : ''}`}>
            <q.icon className="h-4 w-4 flex-none" strokeWidth={1.8} />
            {q.label}
            {q.n > 0 && <span className="tnum ml-auto text-xs text-ink-3">{q.n}</span>}
          </Link>
        ))}
      </nav>

      {canMain && (
        <>
          <div className="px-2.5 pb-1 pt-3.5 text-[11.5px] font-semibold tracking-[.02em] text-ink-3">Request types</div>
          <nav className="flex flex-col gap-0.5">
            {(Object.keys(REQUEST_TYPES) as RequestType[])
              .filter((t) => t !== 'photo')
              .map((t) => {
                const active = onInbox && type === t;
                const n = typeCounts(t);
                return (
                  <Link key={t} href={active ? '/admin' : `/admin?type=${t}`} className={`${item} ${active ? on : ''}`}>
                    <TypeSquare type={t} className="mx-[3px]" />
                    {REQUEST_TYPES[t].plural}
                    {n > 0 && <span className="tnum ml-auto text-xs text-ink-3">{n}</span>}
                  </Link>
                );
              })}
          </nav>
        </>
      )}

      {more.length > 0 && (
        <>
          <div className="px-2.5 pb-1 pt-3.5 text-[11.5px] font-semibold tracking-[.02em] text-ink-3">More</div>
          <nav className="flex flex-col gap-0.5">
            {more.map((m) => (
              <Link key={m.href} href={m.href} className={`${item} ${pathname === m.href ? on : ''}`}>
                <m.icon className="h-4 w-4 flex-none" strokeWidth={1.8} />
                {m.label}
              </Link>
            ))}
          </nav>
        </>
      )}

      <div className="mt-auto border-t border-line pt-2.5">
        <div className="flex items-center gap-2.5 px-2 py-1.5 text-sm text-ink-2">
          <Avatar name={session?.user?.name || 'You'} size={32} />
          <div className="min-w-0 leading-tight">
            <div className="truncate text-ink">{session?.user?.name}</div>
            <div className="truncate text-[11.5px] text-ink-3">{session?.user?.email}</div>
          </div>
        </div>
        <div className="mt-1 flex gap-0.5">
          <button
            type="button"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className={`${item} flex-1`}
          >
            {resolvedTheme === 'dark' ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
            {resolvedTheme === 'dark' ? 'Light' : 'Dark'}
          </button>
          <button type="button" onClick={() => signOut()} className={`${item} flex-1`}>
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

/** Tabs for the views row. */
export function ViewTab({
  on,
  onClick,
  children,
  n,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
  n?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px inline-flex h-[38px] items-center gap-1.5 whitespace-nowrap border-b-2 px-2.5 text-[13.5px] font-medium ${
        on ? 'border-ink text-ink' : 'border-transparent text-ink-2 hover:text-ink'
      }`}
    >
      {children}
      {typeof n === 'number' && (
        <span className="tnum grid h-[17px] place-items-center rounded-sm border border-line bg-surface-2 px-1.5 text-[11.5px] text-ink-3">{n}</span>
      )}
    </button>
  );
}

export function ViewTools({ children }: { children: React.ReactNode }) {
  return <div className="ml-auto flex items-center gap-1 pb-1.5 pl-3">{children}</div>;
}

export { weekendLabel };
