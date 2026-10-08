// app/page.tsx
// The request chooser: which form, how long it takes, how far ahead to send
// it. The deadline that matters this week sits under the list, not in a
// banner.
'use client';

import Link from 'next/link';
import FrontLayout from './components/FrontLayout';
import { TypeSquare } from './components/ui/TypeMark';
import { nextWeekendIso, weekendLabel, type RequestType } from './lib/requests';

const CHOICES: Array<{ type: RequestType; href: string; title: string; blurb: string; time: string; lead: string }> = [
  {
    type: 'announcement',
    href: '/announcements',
    title: 'Announcement',
    blurb: 'Bulletin, Wednesday email, church screens. Add it to the parish calendar in the same form.',
    time: '5 min',
    lead: '2–3 weeks ahead',
  },
  {
    type: 'website',
    href: '/website-updates',
    title: 'Website update',
    blurb: 'A change to a page on sainthelen.org.',
    time: '3 min',
    lead: '2–3 business days',
  },
  {
    type: 'text',
    href: '/sms-requests',
    title: 'Text message',
    blurb: 'A short parish text for something time-sensitive.',
    time: '2 min',
    lead: '1 week ahead',
  },
  {
    type: 'av',
    href: '/av-requests',
    title: 'A/V or livestream',
    blurb: 'Sound, projection, or streaming for an event or meeting.',
    time: '4 min',
    lead: '1–2 weeks ahead',
  },
  {
    type: 'design',
    href: '/flyer-review',
    title: 'Flier review',
    blurb: 'Feedback on a flier you made before it goes out.',
    time: '3 min',
    lead: '1 week ahead',
  },
  {
    type: 'design',
    href: '/graphic-design',
    title: 'Design request',
    blurb: 'A flier, graphic, or social post made for you.',
    time: '4 min',
    lead: '2 weeks ahead',
  },
  {
    type: 'photo',
    href: '/share-photos',
    title: 'Share photos',
    blurb: 'Took photos at a parish event? Send them in.',
    time: '2 min',
    lead: '',
  },
];

export default function HomePage() {
  const weekend = nextWeekendIso();
  const sat = new Date(`${weekend}T12:00:00Z`);
  const mon = new Date(sat);
  mon.setUTCDate(sat.getUTCDate() - 5);
  const monLabel = mon.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });

  return (
    <FrontLayout width="page">
      <div className="mx-auto max-w-[760px] py-7 sm:py-9">
        <h1 className="text-[22px] font-semibold tracking-[-0.01em]">New request</h1>
        <p className="mt-1 text-sm text-ink-2">
          Pick the form that fits. You will get a confirmation by email, and the office will write back if anything is missing.
        </p>

        <ul className="mt-5 divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
          {CHOICES.map((c) => (
            <li key={c.href}>
              <Link href={c.href} className="group flex items-start gap-3.5 px-4 py-3.5 hover:bg-surface-2 sm:items-center sm:px-5">
                <TypeSquare type={c.type} className="mt-[7px] h-[11px] w-[11px] sm:mt-0" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold leading-snug">{c.title}</span>
                  <span className="block text-sm text-ink-2">{c.blurb}</span>
                </span>
                <span className="tnum whitespace-nowrap text-xs text-ink-3">
                  {c.time}
                  {c.lead ? ` · ${c.lead}` : ''}
                </span>
                <span aria-hidden="true" className="ml-1 hidden text-ink-3 group-hover:text-ink sm:block">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <dl className="mt-6 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs font-semibold text-ink-3">Bulletin for {weekendLabel(weekend)}</dt>
            <dd className="mt-0.5 text-ink">Closes {monLabel}, noon</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-ink-3">Wednesday email</dt>
            <dd className="mt-0.5 text-ink">Drafted Monday, sent Wednesday</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-ink-3">Questions</dt>
            <dd className="mt-0.5">
              <a href="mailto:communications@sainthelen.org" className="text-navy hover:underline">
                communications@sainthelen.org
              </a>
            </dd>
          </div>
        </dl>

        <p className="mt-6 text-sm text-ink-2">
          First time? The <Link href="/guidelines" className="text-navy hover:underline">guidelines</Link> cover lead times, word limits and how we
          edit. Announcements run about 90 words in the bulletin.
        </p>
      </div>
    </FrontLayout>
  );
}
