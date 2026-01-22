// app/page.tsx
'use client';

import FrontLayout from './components/FrontLayout';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FrontCard, FrontCardContent, FrontCardHeader, FrontCardTitle } from './components/ui/FrontCard';
import {
  CheckCircleIcon,
  ClockIcon,
  QuestionMarkCircleIcon,
  MegaphoneIcon,
  GlobeAltIcon,
  ChatBubbleLeftRightIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

export default function HomePage() {
  return (
    <FrontLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Decorative orbs */}
        <div className="sh-orb w-96 h-96 -top-48 -right-48 absolute" />
        <div className="sh-orb sh-orb-rust w-64 h-64 top-1/2 -left-32 absolute" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <motion.div
            className="text-center max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-sh-navy dark:text-white mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Communications Portal
            </motion.h1>
            <motion.p
              className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 leading-relaxed mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Submit forms and requests to help publicize your ministries and events.
              Our team is here to help promote your ministry work.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Link
                href="#forms"
                className="inline-flex items-center gap-2 bg-sh-navy hover:bg-sh-navy-700 text-white px-8 py-4 rounded-button font-medium transition-all duration-300 hover:-translate-y-1 hover:shadow-button-hover group"
              >
                Get Started
                <ArrowRightIcon className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How To Get Started */}
      <section className="sh-section bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-sh-navy dark:text-white sh-heading-underline">
              How to Get Started
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: '1',
                title: 'Review Guidelines',
                description: 'View guidelines and information for submitting communications requests.',
                color: 'sh-navy',
                link: '/guidelines',
                linkText: 'View Guidelines'
              },
              {
                step: '2',
                title: 'Submit Your Request',
                description: 'Select the perfect form below and provide comprehensive details for your ministry needs.',
                color: 'sh-rust',
                link: '#forms',
                linkText: 'View Forms'
              },
              {
                step: '3',
                title: 'Confirmation Email',
                description: 'Receive instant confirmation and personalized follow-up for any clarifications needed.',
                color: 'emerald',
                link: null,
                linkText: null
              },
              {
                step: '4',
                title: 'We Handle the Rest',
                description: 'Our communications team will help promote your ministry events and announcements.',
                color: 'amber',
                link: null,
                linkText: null
              }
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <FrontCard className="h-full">
                  <FrontCardContent className="flex flex-col items-center text-center p-8 h-full">
                    <div className={`
                      w-16 h-16 rounded-full flex items-center justify-center mb-6
                      ${item.color === 'sh-navy' ? 'bg-sh-navy-100 dark:bg-sh-navy-900/50' : ''}
                      ${item.color === 'sh-rust' ? 'bg-sh-rust-100 dark:bg-sh-rust-900/50' : ''}
                      ${item.color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900/50' : ''}
                      ${item.color === 'amber' ? 'bg-amber-100 dark:bg-amber-900/50' : ''}
                      transition-all duration-300 group-hover:scale-110
                    `}>
                      <span className={`
                        text-2xl font-bold
                        ${item.color === 'sh-navy' ? 'text-sh-navy dark:text-sh-navy-300' : ''}
                        ${item.color === 'sh-rust' ? 'text-sh-rust dark:text-sh-rust-300' : ''}
                        ${item.color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' : ''}
                        ${item.color === 'amber' ? 'text-amber-600 dark:text-amber-400' : ''}
                      `}>
                        {item.step}
                      </span>
                    </div>
                    <h3 className="font-serif font-bold text-xl mb-3 text-sh-navy dark:text-white">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed flex-grow">
                      {item.description}
                    </p>
                    {item.link && (
                      <Link
                        href={item.link}
                        className="text-sh-rust font-medium hover:text-sh-rust-600 transition-colors duration-200 flex items-center gap-1 group"
                      >
                        {item.linkText}
                        <ArrowRightIcon className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                      </Link>
                    )}
                  </FrontCardContent>
                </FrontCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Estimated Turnaround */}
      <section className="sh-section sh-section-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-sh-navy dark:text-white flex items-center justify-center gap-3">
              <ClockIcon className="h-8 w-8 text-sh-rust" />
              Estimated Turnaround
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Bulletin & Email Blast',
                content: 'Bulletin is typically finalized on <strong>Fridays</strong>. Email blasts are typically sent <strong>Wednesday evenings</strong>. We recommend submitting 1-2 weeks in advance.'
              },
              {
                title: 'Website Updates & SMS',
                content: 'Website changes are posted <strong>within 2-3 business days</strong> of approval. SMS messages are sent <strong>within 48 hours</strong> once approved.'
              },
              {
                title: 'A/V & Flyer Reviews',
                content: 'A/V should be submitted as early as possible, ideally <strong>1-2 weeks</strong> prior to the event. Flyer reviews are completed <strong>within 3-5 business days</strong>.'
              }
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <FrontCard>
                  <FrontCardContent className="p-6">
                    <h3 className="font-serif font-bold text-lg mb-3 text-sh-navy dark:text-white">
                      {item.title}
                    </h3>
                    <p
                      className="text-gray-600 dark:text-gray-300"
                      dangerouslySetInnerHTML={{ __html: item.content }}
                    />
                  </FrontCardContent>
                </FrontCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="sh-section bg-white dark:bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-sh-navy dark:text-white flex items-center justify-center gap-3">
              <QuestionMarkCircleIcon className="h-8 w-8 text-sh-rust" />
              Frequently Asked Questions
            </h2>
          </motion.div>

          <div className="space-y-4">
            {[
              {
                question: 'Can I submit multiple PDFs or images?',
                answer: 'Absolutely. Our forms let you attach multiple files. If your files are very large, consider linking to a shared drive or cloud service.'
              },
              {
                question: "What's the difference between flyer review and an announcement?",
                answer: 'Flyer review is for feedback on your existing design before finalizing it, while an announcement is submitting content for our team to create and publish in our bulletin, email, and screens.'
              },
              {
                question: 'How far in advance should I request A/V and livestreaming?',
                answer: 'Please submit A/V requests at least 2 weeks before your event. Livestreaming requires additional setup and planning, so earlier notice is always appreciated.'
              },
              {
                question: 'Do I need to sign in to use these forms?',
                answer: 'No sign-in required. The forms are public for easy submission. Only our communications staff needs to sign in to access the admin dashboard.'
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <FrontCard>
                  <FrontCardContent className="p-6">
                    <h3 className="font-serif font-bold text-lg mb-2 text-sh-navy dark:text-white">
                      {item.question}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {item.answer}
                    </p>
                  </FrontCardContent>
                </FrontCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Forms Section */}
      <section id="forms" className="sh-section sh-section-cream-alt">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-sh-navy dark:text-white sh-heading-underline">
              Submit Your Request
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Announcements',
                description: 'Create impactful bulletin notices, email campaigns, and digital screen announcements for maximum ministry reach.',
                icon: MegaphoneIcon,
                href: '/announcements',
                buttonText: 'Submit Announcement',
                color: 'sh-navy'
              },
              {
                title: 'Website Updates',
                description: 'Request updates to the parish website, including new pages, events, or changes.',
                icon: GlobeAltIcon,
                href: '/website-updates',
                buttonText: 'Request Update',
                color: 'sh-rust'
              },
              {
                title: 'SMS Requests',
                description: 'Submit text message alerts for time-sensitive announcements or reminders.',
                icon: ChatBubbleLeftRightIcon,
                href: '/sms-requests',
                buttonText: 'Submit SMS Request',
                color: 'emerald'
              },
              {
                title: 'A/V Requests',
                description: 'Request audio/visual support or livestreaming for your event or meeting.',
                icon: VideoCameraIcon,
                href: '/av-requests',
                buttonText: 'Submit A/V Request',
                color: 'purple'
              },
              {
                title: 'Flyer Review',
                description: 'Get feedback on your flyer design or request help making your flyer more effective.',
                icon: DocumentTextIcon,
                href: '/flyer-review',
                buttonText: 'Submit Flyer',
                color: 'amber'
              },
              {
                title: 'Graphic Design',
                description: 'Request graphic design services for ministry materials, social media, posters, and more.',
                icon: PencilSquareIcon,
                href: '/graphic-design',
                buttonText: 'Request Design',
                color: 'rose'
              }
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <FrontCard gradient className="h-full">
                  <FrontCardContent className="flex flex-col items-center text-center p-8 h-full">
                    <div className={`
                      w-16 h-16 rounded-2xl flex items-center justify-center mb-6
                      ${item.color === 'sh-navy' ? 'bg-sh-navy-100 dark:bg-sh-navy-900/50' : ''}
                      ${item.color === 'sh-rust' ? 'bg-sh-rust-100 dark:bg-sh-rust-900/50' : ''}
                      ${item.color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900/50' : ''}
                      ${item.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/50' : ''}
                      ${item.color === 'amber' ? 'bg-amber-100 dark:bg-amber-900/50' : ''}
                      ${item.color === 'rose' ? 'bg-rose-100 dark:bg-rose-900/50' : ''}
                    `}>
                      <item.icon className={`
                        w-8 h-8
                        ${item.color === 'sh-navy' ? 'text-sh-navy dark:text-sh-navy-300' : ''}
                        ${item.color === 'sh-rust' ? 'text-sh-rust dark:text-sh-rust-300' : ''}
                        ${item.color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' : ''}
                        ${item.color === 'purple' ? 'text-purple-600 dark:text-purple-400' : ''}
                        ${item.color === 'amber' ? 'text-amber-600 dark:text-amber-400' : ''}
                        ${item.color === 'rose' ? 'text-rose-600 dark:text-rose-400' : ''}
                      `} />
                    </div>
                    <h3 className="font-serif font-bold text-xl mb-3 text-sh-navy dark:text-white">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed flex-grow">
                      {item.description}
                    </p>
                    <Link
                      href={item.href}
                      className={`
                        inline-flex items-center gap-2 px-6 py-3 rounded-button font-medium
                        transition-all duration-300 hover:-translate-y-1 hover:shadow-button-hover group text-white hover:text-white
                        ${item.color === 'sh-navy' ? 'bg-sh-navy hover:bg-sh-navy-700' : ''}
                        ${item.color === 'sh-rust' ? 'bg-sh-rust hover:bg-sh-rust-600' : ''}
                        ${item.color === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                        ${item.color === 'purple' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                        ${item.color === 'amber' ? 'bg-amber-600 hover:bg-amber-700' : ''}
                        ${item.color === 'rose' ? 'bg-rose-600 hover:bg-rose-700' : ''}
                      `}
                    >
                      {item.buttonText}
                      <ArrowRightIcon className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                  </FrontCardContent>
                </FrontCard>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <p className="text-gray-600 dark:text-gray-300">
              Need additional communications support? Contact us at{' '}
              <a
                href="mailto:communications@sainthelen.org"
                className="text-sh-rust hover:text-sh-rust-600 font-medium transition-colors"
              >
                communications@sainthelen.org
              </a>
            </p>
          </motion.div>
        </div>
      </section>
    </FrontLayout>
  );
}
