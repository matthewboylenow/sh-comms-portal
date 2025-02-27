// app/guidelines/page.tsx
'use client';

import { Metadata } from 'next';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import FrontLayout from '../components/FrontLayout';
import { FrontCard, FrontCardContent, FrontCardHeader, FrontCardTitle } from '../components/ui/FrontCard';

export default function GuidelinesPage() {
  return (
    <FrontLayout title="Communications Guidelines">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* TL;DR Summary */}
        <FrontCard className="mb-8">
          <FrontCardHeader>
            <FrontCardTitle className="flex items-center gap-2">
              <InformationCircleIcon className="h-6 w-6 text-sh-primary dark:text-blue-400" />
              TL;DR (Quick Summary)
            </FrontCardTitle>
          </FrontCardHeader>
          <FrontCardContent>
            <ul className="list-disc list-inside space-y-2">
              <li>Submit announcements 2–3 weeks in advance for best placement.</li>
              <li>Maximum 3-4 consecutive weeks for any announcement in Bulletin/Email/Screens.</li>
              <li>Church Screens limited to 6-8 rotating announcements each week.</li>
              <li>High-demand periods (Sept, Dec, Jan, Holy Week) may reduce coverage time.</li>
              <li>All flyers should align with Saint Helen branding and be copyright-free.</li>
              <li>Priority given to events with broad relevance and those happening soonest.</li>
              <li>Pastor & Director of Communications must approve all items.</li>
            </ul>
          </FrontCardContent>
        </FrontCard>

        {/* Purpose */}
        <section className="mb-10">
          <h2 className="text-xl md:text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Purpose</h2>
          <p className="text-gray-700 dark:text-gray-300">
            To ensure consistent, timely, and equitable communication of parish
            events and announcements to our community, while also maximizing the
            impact and visibility of each announcement.
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
                <strong>Bulletin &amp; Email Blast:</strong> Announcements can be
                placed for up to three weeks at a time, depending on available
                space. Priority is given to imminent events and those with the
                widest relevance.
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
                <h3 className="font-semibold text-sh-primary dark:text-blue-400 mb-2">
                  Quick Tip
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  If you need more than 3-4 weeks of promotion, consider rotating
                  announcements or focusing on different channels in subsequent weeks, or putting in a request for longer promotion.
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
                Announcements may be displayed/printed for a maximum of three to four
                consecutive weeks. Some major parish events, or events that have been given prior approval may run longer.
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
                <h3 className="font-semibold text-sh-primary dark:text-blue-400 mb-2">
                  Why 3 Weeks?
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Repetition is key—but too much repetition can lead to "announcement
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
                <h3 className="font-semibold text-sh-primary dark:text-blue-400 mb-2">
                  Helpful Hint
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  A clean design + short copy can dramatically improve engagement.
                  Leverage bold headings and clear, large fonts for your key message.
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