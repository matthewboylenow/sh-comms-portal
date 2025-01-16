// app/page.tsx
'use client';

import Link from 'next/link';
// Import some icons from Heroicons
import {
  InformationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/solid';

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
        {/* Dark overlay for better text contrast */}
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
      <section className="max-w-5xl mx-auto px-4 flex-1 w-full mb-8">
        {/* Intro Copy */}
        <div className="space-y-4 mb-10">
          <h2 className="text-2xl md:text-3xl font-semibold">Welcome!</h2>
          <p className="leading-relaxed">
            Thank you for the hard work you’ve put into your ministry or event.
            We’re here to help plan and strategize for a successful promotion.
            Below you’ll find resources, best practices, and forms for submitting
            announcements, website updates, and SMS requests.
          </p>
        </div>

        {/* How To Get Started (cards) */}
        <div className="mb-10">
          <h3 className="text-xl md:text-2xl font-semibold mb-4 flex items-center gap-2">
            <InformationCircleIcon className="h-6 w-6 text-sh-primary" />
            How to Get Started
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border border-gray-100 dark:border-gray-700 flex items-start gap-4">
              <CheckCircleIcon className="h-8 w-8 text-green-600 mt-1" />
              <div>
                <h4 className="font-bold mb-1">1. Review Our Guidelines</h4>
                <p className="text-sm">
                  We have a detailed page with best practices, branding details,
                  and recommended timelines.{' '}
                  <Link
                    href="/guidelines"
                    className="text-blue-500 underline"
                  >
                    View Guidelines
                  </Link>
                </p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border border-gray-100 dark:border-gray-700 flex items-start gap-4">
              <CheckCircleIcon className="h-8 w-8 text-green-600 mt-1" />
              <div>
                <h4 className="font-bold mb-1">2. Submit Your Request</h4>
                <p className="text-sm">
                  Choose the appropriate form below—Announcements, Website
                  Updates, or SMS—and fill it out with your details.
                </p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border border-gray-100 dark:border-gray-700 flex items-start gap-4">
              <CheckCircleIcon className="h-8 w-8 text-green-600 mt-1" />
              <div>
                <h4 className="font-bold mb-1">3. Confirmation Email</h4>
                <p className="text-sm">
                  You’ll receive an email confirming we got your submission. We
                  may reach out if we have questions or need clarifications.
                </p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border border-gray-100 dark:border-gray-700 flex items-start gap-4">
              <CheckCircleIcon className="h-8 w-8 text-green-600 mt-1" />
              <div>
                <h4 className="font-bold mb-1">4. We Handle the Rest</h4>
                <p className="text-sm">
                  Our team reviews each request, coordinates promotion channels,
                  and ensures your message is shared in a timely manner.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Estimated Turnaround (cards) */}
        <div className="mb-10">
          <h3 className="text-xl md:text-2xl font-semibold mb-4 flex items-center gap-2">
            <ClockIcon className="h-6 w-6 text-sh-primary" />
            Estimated Turnaround
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border border-gray-100 dark:border-gray-700">
              <h4 className="font-bold mb-1">Bulletin</h4>
              <p className="text-sm">
                Typically finalized and printed on <strong>Fridays</strong>. We
                recommend submitting announcements 1–2 weeks in advance.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border border-gray-100 dark:border-gray-700">
              <h4 className="font-bold mb-1">Email Blast</h4>
              <p className="text-sm">
                Usually sent <strong>Wednesday nights at 8 PM</strong>. We pull
                announcements the prior day.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border border-gray-100 dark:border-gray-700">
              <h4 className="font-bold mb-1">Website Updates</h4>
              <p className="text-sm">
                Changes are posted <strong>within 2–3 business days</strong> of
                approval.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border border-gray-100 dark:border-gray-700">
              <h4 className="font-bold mb-1">SMS Messages</h4>
              <p className="text-sm">
                Sent as needed, <strong>typically within 48 hours</strong> once
                approved.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-10">
          <h3 className="text-xl md:text-2xl font-semibold mb-4 flex items-center gap-2">
            <QuestionMarkCircleIcon className="h-6 w-6 text-sh-primary" />
            Frequently Asked Questions
          </h3>
          <div className="space-y-4">
            {/* Q1 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-gray-100 dark:border-gray-700">
              <h4 className="font-bold mb-1 text-sh-primary dark:text-sh-sage">
                Can I submit multiple PDFs or images?
              </h4>
              <p className="text-sm">
                Absolutely. Our forms let you attach multiple files. If your
                files are very large, consider linking to a shared drive or
                cloud service.
              </p>
            </div>
            {/* Q2 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-gray-100 dark:border-gray-700">
              <h4 className="font-bold mb-1 text-sh-primary dark:text-sh-sage">
                Do I need to sign in to use these forms?
              </h4>
              <p className="text-sm">
                Nope. The forms are public for easy submission. Our Admin
                Dashboard does require a Microsoft 365 sign-in, but that’s only
                for communications staff managing requests.
              </p>
            </div>
            {/* Q3 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-gray-100 dark:border-gray-700">
              <h4 className="font-bold mb-1 text-sh-primary dark:text-sh-sage">
                How do I know if my request was approved?
              </h4>
              <p className="text-sm">
                You’ll receive a confirmation email right away. We’ll follow up
                if we have any questions, and you’ll see your announcement go
                live in the requested channels.
              </p>
            </div>
          </div>
        </div>

        {/* Buttons to the three forms */}
        <div className="flex flex-col md:flex-row gap-4 mb-10">
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
