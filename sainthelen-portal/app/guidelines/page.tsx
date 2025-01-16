// app/guidelines/page.tsx
import { Metadata } from 'next';
import { InformationCircleIcon } from '@heroicons/react/24/solid';

export const metadata: Metadata = {
  title: 'Saint Helen Communications Guidelines 2024-25',
};

export default function GuidelinesPage() {
  return (
    <section className="max-w-5xl mx-auto px-4 py-8 min-h-screen">
      <h1 className="text-3xl md:text-4xl font-bold mb-4">
        Saint Helen Communications Guidelines 2024-25
      </h1>

      {/* TL;DR Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-100 dark:border-gray-700 p-6 mb-8">
        <h2 className="text-xl font-semibold mb-2 flex items-center gap-2 text-sh-primary dark:text-sh-sage">
          <InformationCircleIcon className="h-6 w-6" />
          TL;DR (Quick Summary)
        </h2>
        <ul className="list-disc list-inside space-y-2 text-sm md:text-base">
          <li>Submit announcements 2–3 weeks in advance for best placement.</li>
          <li>Maximum 3-4 consecutive weeks for any announcement in Bulletin/Email/Screens.</li>
          <li>Church Screens limited to 6-8 rotating announcements each week.</li>
          <li>High-demand periods (Sept, Dec, Jan, Holy Week) may reduce coverage time.</li>
          <li>All flyers should align with Saint Helen branding and be copyright-free.</li>
          <li>Priority given to events with broad relevance and those happening soonest.</li>
          <li>Pastor & Director of Communications must approve all items.</li>
        </ul>
      </div>

      {/* Purpose */}
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-semibold mb-2">Purpose</h2>
        <p className="leading-relaxed text-sm md:text-base">
          To ensure consistent, timely, and equitable communication of parish
          events and announcements to our community, while also maximizing the
          impact and visibility of each announcement.
        </p>
      </div>

      {/* Placement Options & Limitations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="col-span-2">
          <h2 className="text-xl md:text-2xl font-semibold mb-2">
            1. Placement Options &amp; Limitations
          </h2>
          <p className="leading-relaxed text-sm md:text-base mb-4">
            <strong>Bulletin &amp; Email Blast:</strong> Announcements can be
            placed for up to three weeks at a time, depending on available
            space. Priority is given to imminent events and those with the
            widest relevance.
          </p>
          <p className="leading-relaxed text-sm md:text-base mb-4">
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
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-4 shadow flex flex-col gap-2">
          <h3 className="font-semibold text-sh-primary dark:text-sh-sage">
            Quick Tip
          </h3>
          <p className="text-sm">
            If you need more than 3-4 weeks of promotion, consider rotating
            announcements or focusing on different channels in subsequent weeks, or putting in a request for longer promotion.
          </p>
        </div>
      </div>

      {/* Duration of Announcements */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="col-span-2">
          <h2 className="text-xl md:text-2xl font-semibold mb-2">
            2. Duration of Announcements
          </h2>
          <p className="leading-relaxed text-sm md:text-base mb-4">
            Announcements may be displayed/printed for a maximum of three to four
            consecutive weeks. Some major parish events, or events that have been given prior approval may run longer.
          </p>
          <p className="leading-relaxed text-sm md:text-base mb-4">
            <strong>High-Demand Periods:</strong> During peak times (September,
            December, January, Holy Week), announcements may be shortened or
            limited to fewer mediums to ensure fair access for all ministries.
          </p>
          <p className="leading-relaxed text-sm md:text-base">
            Ministry leaders will be informed of any adjustments by the
            communications department.
          </p>
        </div>

        {/* Side Callout Card */}
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-4 shadow flex flex-col gap-2">
          <h3 className="font-semibold text-sh-primary dark:text-sh-sage">
            Why 3 Weeks?
          </h3>
          <p className="text-sm">
            Repetition is key—but too much repetition can lead to “announcement
            fatigue.” Three to four weeks strikes a balance between visibility and
            freshness.
          </p>
        </div>
      </div>

      {/* Submission Lead Time */}
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-semibold mb-2">
          3. Submission Lead Time
        </h2>
        <p className="leading-relaxed text-sm md:text-base mb-4">
          Please submit requests at least <strong>2–3 weeks in advance</strong>.
          Last-minute requests may not be accommodated. Early submissions are
          welcome but not guaranteed placement until closer to the event date.
        </p>
      </div>

      {/* Prioritization */}
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-semibold mb-2">
          4. Prioritization
        </h2>
        <p className="leading-relaxed text-sm md:text-base mb-4">
          Announcements are prioritized based on:
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm md:text-base mb-4">
          <li>Relevance to the broad parish community</li>
          <li>Imminence of the event</li>
          <li>
            Frequency of past communications from the requesting group (to
            ensure diverse groups have a chance)
          </li>
        </ul>
        <p className="leading-relaxed text-sm md:text-base mb-4">
          In <strong>high-demand periods</strong>, the communications department
          may limit an event’s coverage to only two mediums (e.g., bulletin &
          screens, or bulletin & email). Final decisions rest with the Director
          of Communications in consultation with the Pastor.
        </p>
      </div>

      {/* Flyer Guidelines */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="col-span-2">
          <h2 className="text-xl md:text-2xl font-semibold mb-2">
            5. Flyer Guidelines
          </h2>
          <p className="leading-relaxed text-sm md:text-base mb-4">
            <strong>Copyright Compliance:</strong> Ensure all images/logos are
            either copyright-free or properly licensed.
          </p>
          <p className="leading-relaxed text-sm md:text-base mb-4">
            <strong>Saint Helen Branding:</strong> Flyers may be adjusted to
            align with our branding and style. You’ll be notified if changes are
            made.
          </p>
          <p className="leading-relaxed text-sm md:text-base">
            <strong>Best Practices:</strong> Keep flyer copy minimal and
            eye-catching, focusing on one main call-to-action or highlight.
          </p>
        </div>

        {/* Side Callout Card */}
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-4 shadow flex flex-col gap-2">
          <h3 className="font-semibold text-sh-primary dark:text-sh-sage">
            Helpful Hint
          </h3>
          <p className="text-sm">
            A clean design + short copy can dramatically improve engagement.
            Leverage bold headings and clear, large fonts for your key message.
          </p>
        </div>
      </div>

      {/* Editing & Approval */}
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-semibold mb-2">
          6. Editing &amp; Approval
        </h2>
        <p className="leading-relaxed text-sm md:text-base mb-4">
          All submissions are subject to approval by the Pastor and the Director
          of Communications. Submissions may be edited for clarity, brevity, and
          overall relevance. Our aim is to keep messaging coherent and within
          space limitations.
        </p>
      </div>

      {/* Feedback & Review */}
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-semibold mb-2">
          7. Feedback &amp; Review
        </h2>
        <p className="leading-relaxed text-sm md:text-base mb-4">
          We appreciate the effort that goes into organizing events and
          announcements. Our goal is to support every ministry while ensuring
          the community receives clear, relevant communications. If you have
          feedback or concerns, please reach out to the Director of
          Communications.
        </p>
        <p className="leading-relaxed text-sm md:text-base">
          Thank you for helping us maintain consistent and effective
          communications at Saint Helen!
        </p>
      </div>
    </section>
  );
}
