// app/page.tsx
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* HERO SECTION */}
      <section
        className="
          relative 
          w-full 
          h-[50vh] 
          bg-cover 
          bg-center 
          flex 
          items-center 
          justify-center
          text-white
          px-4
          mb-6
        "
        style={{ backgroundImage: `url('/images/hero.jpg')` }}
      >
        {/* Darker overlay for better text contrast */}
        <div className="absolute inset-0 bg-black/60"></div>

        {/* Hero Text */}
        <div className="relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Saint Helen Communications Portal
          </h1>
          <p className="text-lg md:text-xl">
            Best practices for promoting your ministry or event
          </p>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="max-w-4xl mx-auto px-4 flex-1 w-full mb-8">
        <div className="space-y-4 mb-10">
          <h2 className="text-xl md:text-2xl font-semibold">Matthew Boyle</h2>
          <p className="text-sm md:text-base">Director of Communications</p>
          <p className="text-sm md:text-base">
            <a
              href="mailto:mboyle@sainthelen.org"
              className="text-blue-600 underline"
            >
              mboyle@sainthelen.org
            </a>
          </p>
        </div>

        <div className="space-y-4 mb-10">
          <h2 className="text-xl md:text-2xl font-semibold">
            Updated Marketing &amp; Communications Guides:
          </h2>
          <p>
            Thanks so much for all of the hard work you've put into your ministry
            and/or event. We're here to help you plan and strategize to make it a
            success. To get started, we've created some simple, easy-to-read and
            digest guides below.
          </p>
          <p>
            As far as deadlines, we no longer are enforcing specific deadlines,
            but we ask that you send your request in at least 1-2 weeks in
            advance. Anything received less than one week before requested
            promotion may not make it in.
          </p>
        </div>

        {/* PDF Link */}
        <div className="mb-10">
          <a
            href="/files/SaintHelenCommsGuidelines2024-25.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-sh-primary text-white px-4 py-2 rounded hover:bg-sh-secondary transition-colors"
          >
            Saint Helen Communications Guidelines 2024-25
          </a>
        </div>

        {/* Buttons to the three forms */}
        <div className="flex flex-col md:flex-row gap-4">
          <Link
            href="/announcements"
            className="bg-sh-primary text-white px-6 py-3 rounded hover:bg-sh-secondary transition-colors text-center"
          >
            Submit an Announcement
          </Link>

          <Link
            href="/website-updates"
            className="bg-sh-primary text-white px-6 py-3 rounded hover:bg-sh-secondary transition-colors text-center"
          >
            Request a Website Update
          </Link>

          <Link
            href="/sms-requests"
            className="bg-sh-primary text-white px-6 py-3 rounded hover:bg-sh-secondary transition-colors text-center"
          >
            Submit an SMS Request
          </Link>
        </div>
      </section>
    </div>
  );
}
