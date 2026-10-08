// app/guidelines/page.tsx
'use client';

import { Metadata } from 'next';
import { InformationCircleIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import FrontLayout from '../components/FrontLayout';
import { FrontCard, FrontCardContent, FrontCardHeader, FrontCardTitle } from '../components/ui/FrontCard';

export default function GuidelinesPage() {
  return (
    <FrontLayout width="page">
      <div className="mx-auto max-w-[860px] py-7">
        {/* TL;DR Summary */}
        <FrontCard className="mb-8">
          <FrontCardHeader>
            <FrontCardTitle className="flex items-center gap-2">
              <InformationCircleIcon className="h-6 w-6 text-ink-3" />
              TL;DR (Quick Summary)
            </FrontCardTitle>
          </FrontCardHeader>
          <FrontCardContent>
            <ul className="list-disc list-inside space-y-2">
              <li>Submit announcements 2–3 weeks in advance for best placement.</li>
              <li>How long an announcement runs is decided case by case by the pastor and the Director of Communications. Some run for many weeks; others run for the three or four weeks before the event.</li>
              <li>Church Screens limited to 6-8 rotating announcements each week.</li>
              <li>High-demand periods (Sept, Dec, Jan, Holy Week) may reduce coverage time.</li>
              <li>All flyers should align with Saint Helen branding and be copyright-free.</li>
              <li>Priority given to events with broad relevance and those happening soonest.</li>
              <li>Pastor & Director of Communications must approve all items.</li>
            </ul>
          </FrontCardContent>
        </FrontCard>

        {/* Writing quick reference, from the Saint Helen Writing Guide */}
        <FrontCard className="mb-8">
          <FrontCardHeader>
            <FrontCardTitle className="flex items-center gap-2">
              <PencilSquareIcon className="h-5 w-5 text-ink-3" />
              Writing for Saint Helen: a quick reference
            </FrontCardTitle>
          </FrontCardHeader>
          <FrontCardContent className="space-y-6 text-ink">
            <div className="space-y-3">
              <h3 className="font-semibold">A word about AI</h3>
              <p>
                More and more of what reaches us was written or designed with AI tools, and we understand why.
                They are quick, and they are everywhere. We are glad people are finding ways to get their news to
                us. But AI writing has a sound to it, and parishioners hear it. It tends to be longer than it
                needs to be, it leans on the same phrases, and it reads like a brochure rather than a neighbor.
              </p>
              <p>
                Everything we publish speaks in Saint Helen&apos;s voice, so announcements that arrive in an AI
                voice will be rewritten before they run. The facts you give us stay. The wording may change a
                good deal. If you use AI to get a first draft down, please read it over and put it back in your
                own words before you send it.
              </p>
              <p>
                The same goes for fliers and graphics. We do not run AI-generated fliers or artwork. They rarely
                match the parish look, the images often have mistakes in them, and we cannot confirm the rights.
                If one comes in, we will most likely redo it, which takes longer than designing it from your
                details in the first place. If you need a flier, send a design request and we will make one.
              </p>
            </div>

            <div>
              <h3 className="mb-2 font-semibold">What every announcement needs</h3>
              <ul className="list-inside list-disc space-y-1.5">
                <li>The day, the date, the time, and the place.</li>
                <li>The cost, if there is one, and anything people should bring.</li>
                <li>A real person&apos;s name and an email or phone number for questions.</li>
                <li>One link, if there is a sign-up.</li>
                <li>
                  The parish is <strong>Saint Helen</strong>. Not St. Helen, not Saint Helen&apos;s, not Saint Helen
                  Parish.
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-2 font-semibold">How it should sound</h3>
              <ul className="list-inside list-disc space-y-1.5">
                <li>Short sentences. Plain words. Say &ldquo;you,&rdquo; not &ldquo;parishioners.&rdquo;</li>
                <li>Start with what is happening. End with what to do next.</li>
                <li>One exclamation point at most. No emoji except on social media.</li>
                <li>
                  Leave out: &ldquo;Join us as we,&rdquo; &ldquo;We&apos;re excited to announce,&rdquo; &ldquo;faith,
                  fellowship, and fun,&rdquo; journey, vibrant, empower, transformative, meaningful, heartfelt,
                  wonderful opportunity. These are the phrases that give AI writing away.
                </li>
              </ul>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <h3 className="mb-2 font-semibold">Length</h3>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-line">
                    {[
                      ['Bulletin', '90 words at most; 55 to 70 is better'],
                      ['Wednesday email', '150 words'],
                      ['Church screens', '15 words a slide, 2 slides'],
                      ['Text message', '160 characters'],
                      ['Flier headline', '6 words'],
                      ['Flier body', '40 words'],
                    ].map(([channel, limit]) => (
                      <tr key={channel}>
                        <td className="py-1.5 pr-4 font-medium">{channel}</td>
                        <td className="py-1.5 text-ink-2">{limit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 font-semibold">Dates and times</h3>
                  <p className="text-ink-2">Saturday, October 12 · 7:00 PM · 9:00 AM to 1:30 PM · noon</p>
                </div>
                <div>
                  <h3 className="mb-2 font-semibold">Names we spell this way</h3>
                  <p className="text-ink-2">
                    {[
                      'LifeLines',
                      'Kids Corner',
                      "Children's Liturgy of the Word",
                      'Religious Education',
                      'Walking with Purpose',
                      'Ageless at Saint Helen',
                      'Saint Helen Fest',
                      'Discovering Christ',
                      'Msgr. Tom',
                      'Meaney Hall',
                    ].map((name, i) => (
                      <span key={name}>
                        {i > 0 && ' · '}
                        <span className="whitespace-nowrap">{name}</span>
                      </span>
                    ))}
                  </p>
                </div>
                <div>
                  <h3 className="mb-2 font-semibold">Parish contacts</h3>
                  <p className="text-ink-2">1600 Rahway Ave, Westfield, NJ 07090 · 908-232-1214 · sainthelen.org · communications@sainthelen.org</p>
                </div>
              </div>
            </div>

            <p className="text-sm text-ink-2">
              Everything you send in may be edited for length and voice. Your facts and your contact stay.
            </p>
          </FrontCardContent>
        </FrontCard>

        {/* Purpose */}
        <section className="mb-10">
          <h2 className="text-xl md:text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Purpose</h2>
          <p className="text-gray-700 dark:text-gray-300">
            These guidelines keep parish communications consistent, timely, and
            fair to every ministry, and give each announcement the best chance
            of being seen.
          </p>
        </section>

        {/* Placement Options & Limitations */}
        <section className="mb-10">
          <h2 className="text-xl md:text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
            1. Placement Options &amp; Limitations
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <p className="mb-4 text-gray-700 dark:text-gray-300">
                <strong>Bulletin &amp; Email Blast:</strong> How long an announcement
                runs depends on the event and on available space. Priority is given to
                events that are coming up soon and to those with the widest relevance.
              </p>
              <p className="mb-4 text-gray-700 dark:text-gray-300">
                <strong>Church Screens:</strong>
                <br />
                <span className="font-medium">Main Screens:</span> Max of 6
                announcements displayed each week (1–2 cycles).
                <br />
                <span className="font-medium">Vertical Screens:</span> Ideal for
                slightly longer text, though visibility is lower than main screens.
              </p>
            </div>

            {/* Side Callout Card */}
            <FrontCard>
              <FrontCardContent>
                <h3 className="font-semibold text-ink-3 mb-2">
                  Quick Tip
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  If you have a view on how long your announcement should run, say so
                  in the notes on the form. We will plan the schedule with you.
                </p>
              </FrontCardContent>
            </FrontCard>
          </div>
        </section>

        {/* Duration of Announcements */}
        <section className="mb-10">
          <h2 className="text-xl md:text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
            2. Duration of Announcements
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <p className="mb-4 text-gray-700 dark:text-gray-300">
                There is no fixed limit. The pastor and the Director of Communications
                decide how long each announcement runs, based on the event, the season,
                and what else is scheduled. Some run for many weeks; many run for the
                three or four weeks before the event.
              </p>
              <p className="mb-4 text-gray-700 dark:text-gray-300">
                <strong>High-Demand Periods:</strong> During peak times (September,
                December, January, Holy Week), announcements may be shortened or
                limited to fewer mediums to ensure fair access for all ministries.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Ministry leaders will be informed of any adjustments by the
                communications department.
              </p>
            </div>

            {/* Side Callout Card */}
            <FrontCard>
              <FrontCardContent>
                <h3 className="font-semibold text-ink-3 mb-2">
                  Why 3 Weeks?
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Repetition is key, but too much repetition can lead to "announcement
                  fatigue." Three to four weeks strikes a balance between visibility and
                  freshness.
                </p>
              </FrontCardContent>
            </FrontCard>
          </div>
        </section>

        {/* Submission Lead Time */}
        <section className="mb-10">
          <h2 className="text-xl md:text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
            3. Submission Lead Time
          </h2>
          <FrontCard>
            <FrontCardContent>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Please submit requests at least <strong>2–3 weeks in advance</strong>.
                Last-minute requests may not be accommodated. Early submissions are
                welcome but not guaranteed placement until closer to the event date.
              </p>
            </FrontCardContent>
          </FrontCard>
        </section>

        {/* Prioritization */}
        <section className="mb-10">
          <h2 className="text-xl md:text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
            4. Prioritization
          </h2>
          <FrontCard>
            <FrontCardContent>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Announcements are prioritized based on:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 mb-4">
                <li>Relevance to the broad parish community</li>
                <li>Imminence of the event</li>
                <li>
                  Frequency of past communications from the requesting group (to
                  ensure diverse groups have a chance)
                </li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300">
                In <strong>high-demand periods</strong>, the communications department
                may limit an event's coverage to only two mediums (e.g., bulletin &
                screens, or bulletin & email). Final decisions rest with the Director
                of Communications in consultation with the Pastor.
              </p>
            </FrontCardContent>
          </FrontCard>
        </section>

        {/* Flyer Guidelines */}
        <section className="mb-10">
          <h2 className="text-xl md:text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
            5. Flyer Guidelines
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <FrontCard>
                <FrontCardContent>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    <strong>Copyright Compliance:</strong> Ensure all images/logos are
                    either copyright-free or properly licensed.
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    <strong>Saint Helen Branding:</strong> Flyers may be adjusted to
                    align with our branding and style. You'll be notified if changes are
                    made.
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong>Best Practices:</strong> Keep flyer copy minimal and
                    eye-catching, focusing on one main call-to-action or highlight.
                  </p>
                </FrontCardContent>
              </FrontCard>
            </div>

            {/* Side Callout Card */}
            <FrontCard>
              <FrontCardContent>
                <h3 className="font-semibold text-ink-3 mb-2">
                  Helpful Hint
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  A clean design with short copy gets read. Use bold headings and
                  large, clear fonts for your key message.
                </p>
              </FrontCardContent>
            </FrontCard>
          </div>
        </section>

        {/* Editing & Approval */}
        <section className="mb-10">
          <h2 className="text-xl md:text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
            6. Editing &amp; Approval
          </h2>
          <FrontCard>
            <FrontCardContent>
              <p className="text-gray-700 dark:text-gray-300">
                All submissions are subject to approval by the Pastor and the Director
                of Communications. Submissions may be edited for clarity, brevity, and
                overall relevance. Our aim is to keep messaging coherent and within
                space limitations. Major changes will be communicated with you before publication, 
                while minor edits may be made without prior notification.
              </p>
            </FrontCardContent>
          </FrontCard>
        </section>

        {/* Feedback & Review */}
        <section className="mb-10">
          <h2 className="text-xl md:text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
            7. Feedback &amp; Review
          </h2>
          <FrontCard>
            <FrontCardContent>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We appreciate the effort that goes into organizing events and
                announcements. Our goal is to support every ministry while ensuring
                the community receives clear, relevant communications. If you have
                feedback or concerns, please reach out to the Director of
                Communications.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Thank you for helping us maintain consistent and effective
                communications at Saint Helen!
              </p>
            </FrontCardContent>
          </FrontCard>
        </section>
      </div>
    </FrontLayout>
  );
}