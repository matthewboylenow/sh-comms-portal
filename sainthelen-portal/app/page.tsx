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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 mt-16">
        {/* Intro Copy */}
        <div className="space-y-6 mb-16 max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-sh-primary via-sh-primary-light to-sh-sage-dark bg-clip-text text-transparent">
            Welcome to Excellence in Ministry Communications
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
            Thank you for your dedicated ministry work. We're here to amplify your message with professional 
            communications tools and strategic promotion services.
          </p>
        </div>

        {/* How To Get Started (cards) */}
        <div className="mb-20">
          <h3 className="text-2xl md:text-3xl font-bold mb-12 text-center text-gray-900 dark:text-white">
            <span className="bg-gradient-to-r from-sh-primary to-sh-sage bg-clip-text text-transparent">
              How to Get Started
            </span>
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FrontCard className="group hover:scale-105 transition-all duration-300">
              <FrontCardContent className="flex flex-col items-center text-center p-8">
                <div className="rounded-2xl p-4 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 text-blue-600 dark:text-blue-300 mb-6 group-hover:shadow-lg transition-all duration-300">
                  <CheckCircleIcon className="h-10 w-10" />
                </div>
                <h4 className="font-bold text-xl mb-3 text-gray-900 dark:text-white">1. Review Guidelines</h4>
                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  Discover our comprehensive guide featuring best practices, brand standards, and strategic timelines.
                </p>
                <Link
                  href="/guidelines"
                  className="text-sh-primary dark:text-blue-400 font-semibold hover:text-sh-primary-light transition-colors duration-200 flex items-center"
                >
                  View Guidelines 
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </FrontCardContent>
            </FrontCard>

            <FrontCard className="group hover:scale-105 transition-all duration-300">
              <FrontCardContent className="flex flex-col items-center text-center p-8">
                <div className="rounded-2xl p-4 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 text-green-600 dark:text-green-300 mb-6 group-hover:shadow-lg transition-all duration-300">
                  <CheckCircleIcon className="h-10 w-10" />
                </div>
                <h4 className="font-bold text-xl mb-3 text-gray-900 dark:text-white">2. Submit Your Request</h4>
                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  Select the perfect form below and provide comprehensive details for your ministry needs.
                </p>
                <Link
                  href="#forms"
                  className="text-sh-sage dark:text-green-400 font-semibold hover:text-sh-sage-dark transition-colors duration-200 flex items-center"
                >
                  View Forms
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </FrontCardContent>
            </FrontCard>

            <FrontCard className="group hover:scale-105 transition-all duration-300">
              <FrontCardContent className="flex flex-col items-center text-center p-8">
                <div className="rounded-2xl p-4 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 text-purple-600 dark:text-purple-300 mb-6 group-hover:shadow-lg transition-all duration-300">
                  <CheckCircleIcon className="h-10 w-10" />
                </div>
                <h4 className="font-bold text-xl mb-3 text-gray-900 dark:text-white">3. Confirmation Email</h4>
                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  Receive instant confirmation and personalized follow-up for any clarifications needed.
                </p>
              </FrontCardContent>
            </FrontCard>

            <FrontCard className="group hover:scale-105 transition-all duration-300">
              <FrontCardContent className="flex flex-col items-center text-center p-8">
                <div className="rounded-2xl p-4 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900 dark:to-amber-800 text-amber-600 dark:text-amber-300 mb-6 group-hover:shadow-lg transition-all duration-300">
                  <CheckCircleIcon className="h-10 w-10" />
                </div>
                <h4 className="font-bold text-xl mb-3 text-gray-900 dark:text-white">4. We Handle the Rest</h4>
                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  Our expert team orchestrates multi-channel promotion with precision timing and professional execution.
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
        <div id="forms" className="pt-12">
          <h3 className="text-2xl md:text-3xl font-bold mb-12 text-center text-gray-900 dark:text-white">
            <span className="bg-gradient-to-r from-sh-primary to-sh-sage bg-clip-text text-transparent">
              Submit Your Request
            </span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FrontCard className="text-center group hover:scale-105 transition-all duration-300">
              <FrontCardHeader className="pb-4">
                <FrontCardTitle className="flex items-center justify-center text-2xl">
                  <div className="rounded-xl p-3 bg-gradient-to-br from-sh-primary/10 to-sh-primary/20 mr-3 group-hover:shadow-lg transition-all duration-300">
                    <MegaphoneIcon className="h-6 w-6 text-sh-primary" />
                  </div>
                  Announcements
                </FrontCardTitle>
              </FrontCardHeader>
              <FrontCardContent className="flex flex-col items-center pt-2">
                <p className="mb-8 text-gray-600 dark:text-gray-300 leading-relaxed">
                  Create impactful bulletin notices, email campaigns, and digital screen announcements for maximum ministry reach.
                </p>
                <Link
                  href="/announcements"
                  className="bg-gradient-to-r from-sh-primary to-sh-primary-light hover:from-sh-primary-light hover:to-sh-primary text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 shadow-soft hover:shadow-soft-lg transform hover:-translate-y-1"
                >
                  Submit Announcement
                </Link>
              </FrontCardContent>
            </FrontCard>

            <FrontCard className="text-center group hover:scale-105 transition-all duration-300">
              <FrontCardHeader className="pb-4">
                <FrontCardTitle className="flex items-center justify-center text-2xl">
                  <div className="rounded-xl p-3 bg-gradient-to-br from-sh-sage/10 to-sh-sage/20 mr-3 group-hover:shadow-lg transition-all duration-300">
                    <GlobeAltIcon className="h-6 w-6 text-sh-sage" />
                  </div>
                  Website Updates
                </FrontCardTitle>
              </FrontCardHeader>
              <FrontCardContent className="flex flex-col items-center pt-2">
                <p className="mb-8 text-gray-600 dark:text-gray-300 leading-relaxed">
                  Request updates to the parish website, including new pages, events, or changes.
                </p>
                <Link
                  href="/website-updates"
                  className="bg-gradient-to-r from-sh-sage to-sh-sage-dark hover:from-sh-sage-dark hover:to-sh-sage text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 shadow-soft hover:shadow-soft-lg transform hover:-translate-y-1"
                >
                  Request Website Update
                </Link>
              </FrontCardContent>
            </FrontCard>

            <FrontCard className="text-center group hover:scale-105 transition-all duration-300">
              <FrontCardHeader className="pb-4">
                <FrontCardTitle className="flex items-center justify-center text-2xl">
                  <div className="rounded-xl p-3 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900 dark:to-emerald-800 mr-3 group-hover:shadow-lg transition-all duration-300">
                    <ChatBubbleLeftRightIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-300" />
                  </div>
                  SMS Requests
                </FrontCardTitle>
              </FrontCardHeader>
              <FrontCardContent className="flex flex-col items-center pt-2">
                <p className="mb-8 text-gray-600 dark:text-gray-300 leading-relaxed">
                  Submit text message alerts for time-sensitive announcements or reminders.
                </p>
                <Link
                  href="/sms-requests"
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 shadow-soft hover:shadow-soft-lg transform hover:-translate-y-1"
                >
                  Submit SMS Request
                </Link>
              </FrontCardContent>
            </FrontCard>

            <FrontCard className="text-center group hover:scale-105 transition-all duration-300">
              <FrontCardHeader className="pb-4">
                <FrontCardTitle className="flex items-center justify-center text-2xl">
                  <div className="rounded-xl p-3 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 mr-3 group-hover:shadow-lg transition-all duration-300">
                    <VideoCameraIcon className="h-6 w-6 text-purple-600 dark:text-purple-300" />
                  </div>
                  A/V Requests
                </FrontCardTitle>
              </FrontCardHeader>
              <FrontCardContent className="flex flex-col items-center pt-2">
                <p className="mb-8 text-gray-600 dark:text-gray-300 leading-relaxed">
                  Request audio/visual support or livestreaming for your event or meeting.
                </p>
                <Link
                  href="/av-requests"
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 shadow-soft hover:shadow-soft-lg transform hover:-translate-y-1"
                >
                  Submit A/V Request
                </Link>
              </FrontCardContent>
            </FrontCard>

            <FrontCard className="text-center group hover:scale-105 transition-all duration-300">
              <FrontCardHeader className="pb-4">
                <FrontCardTitle className="flex items-center justify-center text-2xl">
                  <div className="rounded-xl p-3 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-800 mr-3 group-hover:shadow-lg transition-all duration-300">
                    <DocumentTextIcon className="h-6 w-6 text-orange-600 dark:text-orange-300" />
                  </div>
                  Flyer Review
                </FrontCardTitle>
              </FrontCardHeader>
              <FrontCardContent className="flex flex-col items-center pt-2">
                <p className="mb-8 text-gray-600 dark:text-gray-300 leading-relaxed">
                  Get feedback on your flyer design or request help making your flyer more effective.
                </p>
                <Link
                  href="/flyer-review"
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 shadow-soft hover:shadow-soft-lg transform hover:-translate-y-1"
                >
                  Submit Flyer for Review
                </Link>
              </FrontCardContent>
            </FrontCard>

            <FrontCard className="text-center group hover:scale-105 transition-all duration-300">
              <FrontCardHeader className="pb-4">
                <FrontCardTitle className="flex items-center justify-center text-2xl">
                  <div className="rounded-xl p-3 bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-900 dark:to-pink-800 mr-3 group-hover:shadow-lg transition-all duration-300">
                    <PencilSquareIcon className="h-6 w-6 text-pink-600 dark:text-pink-300" />
                  </div>
                  Graphic Design
                </FrontCardTitle>
              </FrontCardHeader>
              <FrontCardContent className="flex flex-col items-center pt-2">
                <p className="mb-8 text-gray-600 dark:text-gray-300 leading-relaxed">
                  Request professional graphic design services for ministry materials, social media, posters, and more.
                </p>
                <Link
                  href="/graphic-design"
                  className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 shadow-soft hover:shadow-soft-lg transform hover:-translate-y-1"
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