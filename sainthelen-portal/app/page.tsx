// app/page.tsx
'use client';

import FrontLayout from './components/FrontLayout';
import Link from 'next/link';
import { FrontCard, FrontCardContent, FrontCardHeader, FrontCardTitle } from './components/ui/FrontCard';
import { 
  InformationCircleIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  QuestionMarkCircleIcon,
  MegaphoneIcon,
  GlobeAltIcon,
  ChatBubbleLeftRightIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';

export default function HomePage() {
  return (
    <FrontLayout>
      {/* MAIN CONTENT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 mt-10">
        {/* Intro Copy */}
        <div className="space-y-4 mb-10 max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white">Welcome!</h2>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            Thank you for your ministry work. We're here to help with promotion and communications. 
            Below you'll find resources and forms for various communication services.
          </p>
        </div>

        {/* How To Get Started (cards) */}
        <div className="mb-16">
          <h3 className="text-xl md:text-2xl font-semibold mb-6 flex items-center justify-center gap-2 text-gray-900 dark:text-white">
            <InformationCircleIcon className="h-6 w-6 text-sh-primary dark:text-blue-400" />
            How to Get Started
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FrontCard>
              <FrontCardContent className="flex flex-col items-center text-center p-6">
                <div className="rounded-full p-3 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 mb-4">
                  <CheckCircleIcon className="h-8 w-8" />
                </div>
                <h4 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">1. Review Guidelines</h4>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  See our detailed page with best practices, branding details, and recommended timelines.
                </p>
                <Link
                  href="/guidelines"
                  className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
                >
                  View Guidelines →
                </Link>
              </FrontCardContent>
            </FrontCard>

            <FrontCard>
              <FrontCardContent className="flex flex-col items-center text-center p-6">
                <div className="rounded-full p-3 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 mb-4">
                  <CheckCircleIcon className="h-8 w-8" />
                </div>
                <h4 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">2. Submit Your Request</h4>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Choose the appropriate form below and fill it out with all necessary details.
                </p>
                <Link
                  href="#forms"
                  className="text-green-600 dark:text-green-400 font-medium hover:underline"
                >
                  View Forms →
                </Link>
              </FrontCardContent>
            </FrontCard>

            <FrontCard>
              <FrontCardContent className="flex flex-col items-center text-center p-6">
                <div className="rounded-full p-3 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 mb-4">
                  <CheckCircleIcon className="h-8 w-8" />
                </div>
                <h4 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">3. Confirmation Email</h4>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  You'll receive a confirmation email. We may reach out if we need clarifications.
                </p>
              </FrontCardContent>
            </FrontCard>

            <FrontCard>
              <FrontCardContent className="flex flex-col items-center text-center p-6">
                <div className="rounded-full p-3 bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300 mb-4">
                  <CheckCircleIcon className="h-8 w-8" />
                </div>
                <h4 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">4. We Handle the Rest</h4>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Our team reviews each request, coordinates promotion channels, and ensures timely processing.
                </p>
              </FrontCardContent>
            </FrontCard>
          </div>
        </div>

        {/* Estimated Turnaround */}
        <div className="mb-16">
          <h3 className="text-xl md:text-2xl font-semibold mb-6 flex items-center justify-center gap-2 text-gray-900 dark:text-white">
            <ClockIcon className="h-6 w-6 text-sh-primary dark:text-blue-400" />
            Estimated Turnaround
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FrontCard>
              <FrontCardContent className="p-6">
                <h4 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">Bulletin & Email Blast</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Bulletin is typically finalized on <strong>Fridays</strong>. Email blasts are typically sent <strong>Wednesday evenings.</strong>. We recommend submitting 1–2 weeks in advance.
                </p>
              </FrontCardContent>
            </FrontCard>

            <FrontCard>
              <FrontCardContent className="p-6">
                <h4 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">Website Updates & SMS</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Website changes are posted <strong>within 2–3 business days</strong> of approval. SMS messages are sent <strong>within 48 hours</strong> once approved.
                </p>
              </FrontCardContent>
            </FrontCard>

            <FrontCard>
              <FrontCardContent className="p-6">
                <h4 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">A/V & Flyer Reviews</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  A/V should be submitted as early as possible, ideally <strong>1-2 weeks</strong> prior to the event. Flyer reviews are completed <strong>within 3-5 business days</strong> (1-2 days for urgent requests).
                </p>
              </FrontCardContent>
            </FrontCard>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <h3 className="text-xl md:text-2xl font-semibold mb-6 flex items-center justify-center gap-2 text-gray-900 dark:text-white">
            <QuestionMarkCircleIcon className="h-6 w-6 text-sh-primary dark:text-blue-400" />
            Frequently Asked Questions
          </h3>
          <div className="max-w-4xl mx-auto space-y-6">
            <FrontCard>
              <FrontCardContent>
                <h4 className="font-bold text-lg mb-2 text-sh-primary dark:text-blue-400">
                  Can I submit multiple PDFs or images?
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Absolutely. Our forms let you attach multiple files. If your files are very large, consider linking to a shared drive or cloud service.
                </p>
              </FrontCardContent>
            </FrontCard>

            <FrontCard>
              <FrontCardContent>
                <h4 className="font-bold text-lg mb-2 text-sh-primary dark:text-blue-400">
                  What's the difference between flyer review and an announcement?
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Flyer review is for feedback on your existing design before finalizing it, while an announcement is submitting content for our team to create and publish in our bulletin, email, and screens.
                </p>
              </FrontCardContent>
            </FrontCard>

            <FrontCard>
              <FrontCardContent>
                <h4 className="font-bold text-lg mb-2 text-sh-primary dark:text-blue-400">
                  How far in advance should I request A/V and livestreaming?
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Please submit A/V requests at least 2 weeks before your event. Livestreaming requires additional setup and planning, so earlier notice is always appreciated.
                </p>
              </FrontCardContent>
            </FrontCard>

            <FrontCard>
              <FrontCardContent>
                <h4 className="font-bold text-lg mb-2 text-sh-primary dark:text-blue-400">
                  Do I need to sign in to use these forms?
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  No sign-in required. The forms are public for easy submission. Only our communications staff needs to sign in to access the admin dashboard.
                </p>
              </FrontCardContent>
            </FrontCard>
          </div>
        </div>

        {/* Forms Section */}
        <div id="forms" className="pt-8">
          <h3 className="text-xl md:text-2xl font-semibold mb-6 text-center text-gray-900 dark:text-white">
            Submit Your Request
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FrontCard className="text-center">
              <FrontCardHeader>
                <FrontCardTitle className="flex items-center justify-center">
                  <MegaphoneIcon className="h-5 w-5 mr-2 text-sh-primary" />
                  Announcements
                </FrontCardTitle>
              </FrontCardHeader>
              <FrontCardContent className="flex flex-col items-center">
                <p className="mb-6 text-gray-600 dark:text-gray-300">
                  Submit bulletins, email blasts, and church screen announcements for your ministry or event.
                </p>
                <Link
                  href="/announcements"
                  className="bg-sh-primary hover:bg-sh-secondary text-white px-6 py-2 rounded transition"
                >
                  Submit Announcement
                </Link>
              </FrontCardContent>
            </FrontCard>

            <FrontCard className="text-center">
              <FrontCardHeader>
                <FrontCardTitle className="flex items-center justify-center">
                  <GlobeAltIcon className="h-5 w-5 mr-2 text-sh-primary" />
                  Website Updates
                </FrontCardTitle>
              </FrontCardHeader>
              <FrontCardContent className="flex flex-col items-center">
                <p className="mb-6 text-gray-600 dark:text-gray-300">
                  Request updates to the parish website, including new pages, events, or changes.
                </p>
                <Link
                  href="/website-updates"
                  className="bg-sh-primary hover:bg-sh-secondary text-white px-6 py-2 rounded transition"
                >
                  Request Website Update
                </Link>
              </FrontCardContent>
            </FrontCard>

            <FrontCard className="text-center">
              <FrontCardHeader>
                <FrontCardTitle className="flex items-center justify-center">
                  <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2 text-sh-primary" />
                  SMS Requests
                </FrontCardTitle>
              </FrontCardHeader>
              <FrontCardContent className="flex flex-col items-center">
                <p className="mb-6 text-gray-600 dark:text-gray-300">
                  Submit text message alerts for time-sensitive announcements or reminders.
                </p>
                <Link
                  href="/sms-requests"
                  className="bg-sh-primary hover:bg-sh-secondary text-white px-6 py-2 rounded transition"
                >
                  Submit SMS Request
                </Link>
              </FrontCardContent>
            </FrontCard>

            <FrontCard className="text-center">
              <FrontCardHeader>
                <FrontCardTitle className="flex items-center justify-center">
                  <VideoCameraIcon className="h-5 w-5 mr-2 text-sh-primary" />
                  A/V Requests
                </FrontCardTitle>
              </FrontCardHeader>
              <FrontCardContent className="flex flex-col items-center">
                <p className="mb-6 text-gray-600 dark:text-gray-300">
                  Request audio/visual support or livestreaming for your event or meeting.
                </p>
                <Link
                  href="/av-requests"
                  className="bg-sh-primary hover:bg-sh-secondary text-white px-6 py-2 rounded transition"
                >
                  Submit A/V Request
                </Link>
              </FrontCardContent>
            </FrontCard>

            <FrontCard className="text-center">
              <FrontCardHeader>
                <FrontCardTitle className="flex items-center justify-center">
                  <DocumentTextIcon className="h-5 w-5 mr-2 text-sh-primary" />
                  Flyer Review
                </FrontCardTitle>
              </FrontCardHeader>
              <FrontCardContent className="flex flex-col items-center">
                <p className="mb-6 text-gray-600 dark:text-gray-300">
                  Get feedback on your flyer design or request help making your flyer more effective.
                </p>
                <Link
                  href="/flyer-review"
                  className="bg-sh-primary hover:bg-sh-secondary text-white px-6 py-2 rounded transition"
                >
                  Submit Flyer for Review
                </Link>
              </FrontCardContent>
            </FrontCard>

            <FrontCard className="text-center">
              <FrontCardHeader>
                <FrontCardTitle className="flex items-center justify-center">
                  <PencilSquareIcon className="h-5 w-5 mr-2 text-sh-primary" />
                  Graphic Design
                </FrontCardTitle>
              </FrontCardHeader>
              <FrontCardContent className="flex flex-col items-center">
                <p className="mb-6 text-gray-600 dark:text-gray-300">
                  Request professional graphic design services for ministry materials, social media, posters, and more.
                </p>
                <Link
                  href="/graphic-design"
                  className="bg-sh-primary hover:bg-sh-secondary text-white px-6 py-2 rounded transition"
                >
                  Request Graphic Design
                </Link>
              </FrontCardContent>
            </FrontCard>

            <div className="text-center md:col-span-2 lg:col-span-3 mt-8">
              <p className="text-gray-600 dark:text-gray-300">
                Need additional communications support? Contact us at <a href="mailto:communications@sainthelen.org" className="text-sh-primary dark:text-blue-400 hover:underline">communications@sainthelen.org</a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </FrontLayout>
  );
}