// app/page.tsx
// The request chooser: which form, how long it takes, how far ahead to send
// it. The deadline that matters this week sits under the list, not in a
// banner.
'use client';

import Link from 'next/link';
import FrontLayout from './components/FrontLayout';
import { TypeSquare } from './components/ui/TypeMark';
import type { RequestType } from './lib/requests';

const CHOICES: Array<{ type: RequestType; href: string; title: string; blurb: string }> = [
  {
    type: 'announcement',
    href: '/announcements',
    title: 'Announcement',
    blurb: 'Bulletin, Wednesday email, church screens. Add it to the parish calendar in the same form.',
  },
  {
    type: 'website',
    href: '/website-updates',
    title: 'Website update',
    blurb: 'A change to a page on sainthelen.org.',
  },
  {
    type: 'text',
    href: '/sms-requests',
    title: 'Text message',
    blurb: 'A text to the parish. Each one is approved by the pastor.',
  },
  {
    type: 'av',
    href: '/av-requests',
    title: 'A/V or livestream',
    blurb: 'Sound, projection, or streaming for an event or meeting.',
  },
  {
    type: 'design',
    href: '/flyer-review',
    title: 'Flier review',
    blurb: 'Feedback on a flier you made before it goes out.',
  },
  {
    type: 'design',
    href: '/graphic-design',
    title: 'Design request',
    blurb: 'A flier, graphic, or social post made for you.',
  },
  {
    type: 'photo',
    href: '/share-photos',
    title: 'Share photos',
    blurb: 'Photos from a parish event or ministry.',
  },
];

export default function HomePage() {

  return (
    <FrontLayout width="page">
      <div className="mx-auto max-w-[760px] py-7 sm:py-9">
        <h1 className="text-[22px] font-semibold tracking-[-0.01em]">New request</h1>
        <p className="mt-1 text-sm text-ink-2">
          Choose the kind of request below. You will get a confirmation by email, and the Communications Office will be in touch if we have questions.
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
                <span aria-hidden="true" className="ml-1 hidden text-ink-3 group-hover:text-ink sm:block">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-sm text-ink-2">
          Questions? Email <a href="mailto:communications@sainthelen.org" className="text-navy hover:underline">communications@sainthelen.org</a>. The{' '}
          <Link href="/guidelines" className="text-navy hover:underline">guidelines</Link> explain how announcements are scheduled and edited.
        </p>
      </div>
    </FrontLayout>
  );
}
