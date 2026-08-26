// app/announcements/page.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FrontLayout from '../components/FrontLayout';
import { FrontCard, FrontCardContent, FrontCardHeader, FrontCardTitle } from '../components/ui/FrontCard';
import { Button } from '../components/ui/Button';
import { ExclamationCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import MinistryAutocomplete from '../components/ui/MinistryAutocomplete';
import AddPhotosPanel from '../components/AddPhotosPanel';
import UploadProgress from '../components/ui/UploadProgress';
import { uploadFilesWithStatus, type UploadStatus } from '../lib/upload';

interface Ministry {
  id: string;
  name: string;
  aliases?: string[];
  requiresApproval: boolean;
  approvalCoordinator?: string;
  description?: string;
  active: boolean;
}

// A single occurrence of the event (an event can happen on several dates)
type EventDateEntry = {
  id: string;
  date: string;
  time: string;
};

// A labeled sign-up link (e.g. separate SignUpGenius links per activity)
type SignUpLinkEntry = {
  id: string;
  label: string;
  url: string;
};

export default function AnnouncementsFormPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [ministry, setMinistry] = useState('');
  const [selectedMinistry, setSelectedMinistry] = useState<Ministry | undefined>();
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [eventDates, setEventDates] = useState<EventDateEntry[]>([
    { id: '1', date: '', time: '' },
  ]);
  const [promotionStart, setPromotionStart] = useState('');
  const [publicationNotes, setPublicationNotes] = useState('');
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [announcementBody, setAnnouncementBody] = useState('');
  const [addToCalendar, setAddToCalendar] = useState(false);
  // Event calendar detail fields
  const [calendarEventName, setCalendarEventName] = useState('');
  const [calendarEventDate, setCalendarEventDate] = useState('');
  const [calendarEventStartTime, setCalendarEventStartTime] = useState('');
  const [calendarEventEndTime, setCalendarEventEndTime] = useState('');
  const [calendarEventDescription, setCalendarEventDescription] = useState('');
  const [calendarEventLocation, setCalendarEventLocation] = useState('');
  const [calendarEventSignUpLink, setCalendarEventSignUpLink] = useState('');
  const [isExternalEvent, setIsExternalEvent] = useState(false);
  // "Consider for Social Media" flag
  const [socialConsideration, setSocialConsideration] = useState(false);
  const [socialWhatToKnow, setSocialWhatToKnow] = useState('');
  const [socialHasPhotos, setSocialHasPhotos] = useState('');
  const [fileLinks, setFileLinks] = useState<string[]>([]);
  const [signUpLinks, setSignUpLinks] = useState<SignUpLinkEntry[]>([
    { id: '1', label: '', url: '' },
  ]);

  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);
  const [submittingForm, setSubmittingForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  // ID of the record just created, for the "add photos from your phone" link
  const [submittedRecordId, setSubmittedRecordId] = useState('');

  // Generate next 12 upcoming weekends (Saturday-Sunday pairs)
  const getUpcomingWeekends = () => {
    const weekends: { value: string; label: string; emailBlastDate: string }[] = [];
    const today = new Date();
    // Find next Saturday
    const nextSaturday = new Date(today);
    const dayOfWeek = today.getDay();
    const daysUntilSaturday = dayOfWeek === 6 ? 7 : (6 - dayOfWeek);
    nextSaturday.setDate(today.getDate() + daysUntilSaturday);

    for (let i = 0; i < 12; i++) {
      const saturday = new Date(nextSaturday);
      saturday.setDate(nextSaturday.getDate() + (i * 7));
      const sunday = new Date(saturday);
      sunday.setDate(saturday.getDate() + 1);
      // Email blast goes out Wednesday before (3 days before Saturday)
      const wednesday = new Date(saturday);
      wednesday.setDate(saturday.getDate() - 3);

      const satMonth = saturday.toLocaleDateString('en-US', { month: 'long' });
      const sunMonth = sunday.toLocaleDateString('en-US', { month: 'long' });
      const satDay = saturday.getDate();
      const sunDay = sunday.getDate();
      const year = saturday.getFullYear();

      // Handle month boundary (e.g., "Weekend of February 28 - March 1, 2026")
      const label = satMonth === sunMonth
        ? `Weekend of ${satMonth} ${satDay}-${sunDay}, ${year}`
        : `Weekend of ${satMonth} ${satDay} - ${sunMonth} ${sunDay}, ${year}`;

      const emailBlastLabel = wednesday.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });

      // Store Saturday date as the value (YYYY-MM-DD)
      const value = saturday.toISOString().split('T')[0];

      weekends.push({ value, label, emailBlastDate: emailBlastLabel });
    }
    return weekends;
  };

  const upcomingWeekends = getUpcomingWeekends();
  const selectedWeekend = upcomingWeekends.find(w => w.value === promotionStart);

  // Handle ministry selection
  const handleMinistryChange = (value: string, ministryObj?: Ministry) => {
    setMinistry(value);
    setSelectedMinistry(ministryObj);
  };

  const handleApprovalStatusChange = (requiresApproval: boolean, ministryObj?: Ministry) => {
    setRequiresApproval(requiresApproval);
  };

  // Event date rows
  const addEventDate = () => {
    const newId = (parseInt(eventDates[eventDates.length - 1].id) + 1).toString();
    setEventDates([...eventDates, { id: newId, date: '', time: '' }]);
  };

  const removeEventDate = (id: string) => {
    if (eventDates.length > 1) {
      setEventDates(eventDates.filter((entry) => entry.id !== id));
    }
  };

  const updateEventDate = (id: string, field: 'date' | 'time', value: string) => {
    setEventDates(eventDates.map((entry) => (entry.id === id ? { ...entry, [field]: value } : entry)));
  };

  // Sign-up link rows
  const addSignUpLink = () => {
    const newId = (parseInt(signUpLinks[signUpLinks.length - 1].id) + 1).toString();
    setSignUpLinks([...signUpLinks, { id: newId, label: '', url: '' }]);
  };

  const removeSignUpLink = (id: string) => {
    if (signUpLinks.length > 1) {
      setSignUpLinks(signUpLinks.filter((entry) => entry.id !== id));
    }
  };

  const updateSignUpLink = (id: string, field: 'label' | 'url', value: string) => {
    setSignUpLinks(signUpLinks.map((entry) => (entry.id === id ? { ...entry, [field]: value } : entry)));
  };

  // Handle checkboxes for "Platforms"
  const handlePlatformChange = (platform: string) => {
    setPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  // 1) Upload files to Vercel Blob (client-side upload - no 4.5MB limit)
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    setErrorMessage('');
    setSuccessMessage('');
    setUploadingFiles(true);

    try {
      const filesArray = Array.from(e.target.files);
      const results = await uploadFilesWithStatus(filesArray, setUploadStatus);

      // Store them in state
      setFileLinks((prev) => [...prev, ...results.map((r) => r.url)]);
    } catch (err: any) {
      console.error('File upload error:', err);
      setErrorMessage(err.message || 'File upload failed');
    } finally {
      setUploadingFiles(false);
      setUploadStatus(null);
    }
  }

  // 2) Submit the form
  async function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingForm(true);
    setErrorMessage('');
    setSuccessMessage('');
    setSubmittedRecordId('');

    // Basic client-side validation
    if (!name.trim()) {
      setErrorMessage('Name is required');
      setSubmittingForm(false);
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Email is required');
      setSubmittingForm(false);
      return;
    }
    if (!announcementBody.trim()) {
      setErrorMessage('Announcement body is required');
      setSubmittingForm(false);
      return;
    }
    if (addToCalendar) {
      if (!calendarEventName.trim()) {
        setErrorMessage('Event Name is required when adding to the events calendar');
        setSubmittingForm(false);
        return;
      }
      if (!calendarEventDate) {
        setErrorMessage('Event Date is required when adding to the events calendar');
        setSubmittingForm(false);
        return;
      }
      if (!calendarEventStartTime) {
        setErrorMessage('Event Start Time is required when adding to the events calendar');
        setSubmittingForm(false);
        return;
      }
      if (!calendarEventDescription.trim()) {
        setErrorMessage('Short Event Description is required when adding to the events calendar');
        setSubmittingForm(false);
        return;
      }
      if (!calendarEventLocation.trim()) {
        setErrorMessage('Event Location is required when adding to the events calendar');
        setSubmittingForm(false);
        return;
      }
    }

    // Drop empty rows; the first entry also fills the original single fields
    const filledDates = eventDates.filter((entry) => entry.date);
    const filledLinks = signUpLinks
      .filter((entry) => entry.url.trim())
      .map((entry) => ({ label: entry.label.trim(), url: entry.url.trim() }));

    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          ministry,
          eventDate: filledDates[0]?.date || '',
          eventTime: filledDates[0]?.time || '',
          eventDates: filledDates.map((entry) => ({ date: entry.date, time: entry.time })),
          promotionStart,
          platforms,
          announcementBody,
          addToCalendar,
          // Event calendar detail fields (only sent when addToCalendar is true)
          ...(addToCalendar && {
            calendarEventName,
            calendarEventDate,
            calendarEventStartTime,
            calendarEventEndTime,
            calendarEventDescription,
            calendarEventLocation,
            calendarEventSignUpLink,
          }),
          isExternalEvent,
          socialConsideration,
          ...(socialConsideration && {
            socialWhatToKnow,
            socialHasPhotos,
          }),
          fileLinks,
          signUpUrl: filledLinks[0]?.url || '',
          signUpLinks: filledLinks,
          publicationNotes,
        }),
      });

      const result = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        throw new Error(result.error || 'Submission failed');
      }

      // UUID means a Neon record the phone-upload page can attach files to
      if (typeof result.id === 'string' && /^[0-9a-f-]{36}$/i.test(result.id)) {
        setSubmittedRecordId(result.id);
      }

      const successMsg = requiresApproval
        ? 'Announcement submitted successfully! It will require approval from the Coordinator of Adult Discipleship before being published.'
        : 'Announcement submitted successfully!';
      setSuccessMessage(successMsg);
      
      // Reset form (if desired)
      setName('');
      setEmail('');
      setMinistry('');
      setSelectedMinistry(undefined);
      setRequiresApproval(false);
      setEventDates([{ id: '1', date: '', time: '' }]);
      setPromotionStart('');
      setPlatforms([]);
      setAnnouncementBody('');
      setAddToCalendar(false);
      setCalendarEventName('');
      setCalendarEventDate('');
      setCalendarEventStartTime('');
      setCalendarEventEndTime('');
      setCalendarEventDescription('');
      setCalendarEventLocation('');
      setCalendarEventSignUpLink('');
      setIsExternalEvent(false);
      setSocialConsideration(false);
      setSocialWhatToKnow('');
      setSocialHasPhotos('');
      setFileLinks([]);
      setSignUpLinks([{ id: '1', label: '', url: '' }]);
      setPublicationNotes('');
    } catch (err: any) {
      console.error('Form submission error:', err);
      setErrorMessage(err.message || 'Form submission failed');
    } finally {
      setSubmittingForm(false);
    }
  }

  return (
    <FrontLayout title="Submit an Announcement">
      <div className="max-w-4xl mx-auto my-8 px-4 sm:px-6 lg:px-8">
        {/* Editorial Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <FrontCard className="mb-8 border-l-4 border-l-amber-500 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-soft">
            <FrontCardContent className="flex items-start gap-4 p-6">
              <div className="flex-shrink-0">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <InformationCircleIcon className="h-7 w-7 text-amber-500" />
                </motion.div>
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Editorial Notice</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  We may edit your announcement to fit Saint Helen's style and tone. If your
                  message needs a major rewrite, we'll let you know before it's published;
                  minor edits (grammar, length, formatting) may be made without notice. Final
                  decisions on messaging rest with the Director of Communications in
                  collaboration with the Pastor.
                </p>
              </div>
            </FrontCardContent>
          </FrontCard>
        </motion.div>


        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <FrontCard className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-soft-lg border border-white/20 dark:border-gray-700/50">
            <FrontCardHeader className="border-b border-gray-200/50 dark:border-gray-700/50 pb-4">
              <FrontCardTitle className="text-2xl font-bold bg-gradient-to-r from-sh-primary to-sh-sage bg-clip-text text-transparent">
                Announcement Details
              </FrontCardTitle>
            </FrontCardHeader>
            <FrontCardContent className="p-8">
              <form onSubmit={handleSubmitForm} className="space-y-8">
              {/* Name */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Your Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300/50 dark:border-gray-600/50 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-sh-primary/50 focus:border-sh-primary bg-white/80 text-gray-900 dark:bg-gray-700/50 dark:text-white transition-all duration-200 backdrop-blur-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Enter your full name"
                />
              </motion.div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Ministry */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ministry/Organization
                </label>
                <MinistryAutocomplete
                  value={ministry}
                  onChange={handleMinistryChange}
                  onApprovalStatusChange={handleApprovalStatusChange}
                  placeholder="Start typing ministry name..."
                />
              </div>

              {/* External Event Checkbox */}
              <div>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 dark:border-gray-600 text-sh-primary focus:ring-sh-primary dark:bg-gray-700"
                    checked={isExternalEvent}
                    onChange={(e) => setIsExternalEvent(e.target.checked)}
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    This is an external event or ministry outside of Saint Helen
                  </span>
                </label>
              </div>

              {/* External Event Warning */}
              {isExternalEvent && (
                <div className="p-4 bg-amber-50/80 dark:bg-amber-900/30 backdrop-blur-sm border border-amber-200/50 dark:border-amber-800/50 rounded-2xl shadow-soft">
                  <div className="flex items-start gap-3">
                    <InformationCircleIcon className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-amber-800 dark:text-amber-300">
                        External Event Notice
                      </p>
                      <p className="text-amber-700 dark:text-amber-400 mt-1 leading-relaxed">
                        Priority is given to events directly affiliated with Saint Helen and Saint Helen Ministries. 
                        We may not have available space for external events, however we will make every effort to 
                        include where appropriate.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Event Dates / Times */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date(s) and Time(s) of Event
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Happening more than once? Add a row for each date.
                </p>
                <div className="space-y-3">
                  {eventDates.map((entry) => (
                    <div key={entry.id} className="flex flex-col md:flex-row gap-3 md:items-end">
                      <div className="flex-1">
                        <input
                          type="date"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
                          value={entry.date}
                          onChange={(e) => updateEventDate(entry.id, 'date', e.target.value)}
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="time"
                          step="300"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
                          value={entry.time}
                          onChange={(e) => updateEventDate(entry.id, 'time', e.target.value)}
                        />
                      </div>
                      {eventDates.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEventDate(entry.id)}
                          className="px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors self-start md:self-end"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addEventDate}
                  className="mt-2 text-sm text-sh-primary hover:text-blue-600 font-medium inline-flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add another date
                </button>
              </div>

              {/* Requested Publication Weekend */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Requested Publication Weekend
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
                  value={promotionStart}
                  onChange={(e) => setPromotionStart(e.target.value)}
                >
                  <option value="">Select a weekend...</option>
                  {upcomingWeekends.map((weekend) => (
                    <option key={weekend.value} value={weekend.value}>
                      {weekend.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  This is a request and may be adjusted based on scheduling needs and space availability.
                </p>
                {selectedWeekend && (
                  <p className="mt-1 text-xs text-sh-primary dark:text-blue-400 font-medium">
                    The email blast for this weekend would go out on {selectedWeekend.emailBlastDate}.
                  </p>
                )}
              </div>

              {/* Publication Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Publication Notes
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
                  rows={3}
                  value={publicationNotes}
                  onChange={(e) => setPublicationNotes(e.target.value)}
                  placeholder="Any timing details we should know? e.g., 'Sign-up deadline is March 5', 'Materials need to be ordered 2 weeks prior', 'Would like this to run for 3 consecutive weekends'"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Include any deadlines, ordering timelines, or scheduling preferences that would help us plan publication.
                </p>
              </div>

              {/* Platforms */}
              <div>
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Where should this announcement appear?</span>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      id="platform-email"
                      type="checkbox"
                      className="h-4 w-4 text-sh-primary focus:ring-sh-primary border-gray-300 rounded"
                      checked={platforms.includes('Email Blast')}
                      onChange={() => handlePlatformChange('Email Blast')}
                    />
                    <label htmlFor="platform-email" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Email Blast
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="platform-bulletin"
                      type="checkbox"
                      className="h-4 w-4 text-sh-primary focus:ring-sh-primary border-gray-300 rounded"
                      checked={platforms.includes('Bulletin')}
                      onChange={() => handlePlatformChange('Bulletin')}
                    />
                    <label htmlFor="platform-bulletin" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Bulletin
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="platform-screens"
                      type="checkbox"
                      className="h-4 w-4 text-sh-primary focus:ring-sh-primary border-gray-300 rounded"
                      checked={platforms.includes('Church Screens')}
                      onChange={() => handlePlatformChange('Church Screens')}
                    />
                    <label htmlFor="platform-screens" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Church Screens
                    </label>
                  </div>
                </div>
              </div>

              {/* Announcement Body */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Announcement Body <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
                  rows={6}
                  value={announcementBody}
                  onChange={(e) => setAnnouncementBody(e.target.value)}
                  required
                  placeholder="Provide the full text of your announcement. Include all relevant details such as what, when, where, and contact information."
                />
              </div>

              {/* Sign-Up Links */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sign-Up Link(s) (if applicable)
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Where can parishioners sign up or register? If you have separate links for
                  different activities or groups, add each one with a short label.
                </p>
                <div className="space-y-3">
                  {signUpLinks.map((entry) => (
                    <div key={entry.id} className="flex flex-col md:flex-row gap-3">
                      <div className="md:w-1/3">
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
                          value={entry.label}
                          onChange={(e) => updateSignUpLink(entry.id, 'label', e.target.value)}
                          placeholder="Label (e.g., Youth Group)"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="url"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
                          value={entry.url}
                          onChange={(e) => updateSignUpLink(entry.id, 'url', e.target.value)}
                          placeholder="https://example.com/signup"
                        />
                      </div>
                      {signUpLinks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSignUpLink(entry.id)}
                          className="px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors self-start"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addSignUpLink}
                  className="mt-2 text-sm text-sh-primary hover:text-blue-600 font-medium inline-flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add another link
                </button>
              </div>

              {/* Add to Events Calendar */}
              <div className="flex items-center">
                <input
                  id="add-to-calendar"
                  type="checkbox"
                  className="h-4 w-4 text-sh-primary focus:ring-sh-primary border-gray-300 rounded"
                  checked={addToCalendar}
                  onChange={(e) => setAddToCalendar(e.target.checked)}
                />
                <label htmlFor="add-to-calendar" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Add to Saint Helen Events Calendar?
                </label>
              </div>

              {/* Conditional Event Calendar Details */}
              <AnimatePresence>
                {addToCalendar && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-5 bg-blue-50/80 dark:bg-blue-900/20 backdrop-blur-sm border border-blue-200/50 dark:border-blue-800/50 rounded-2xl space-y-4">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-200 text-sm">
                        Events Calendar Details
                      </h4>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        These details will be used to create an event on the Saint Helen Events Calendar.
                      </p>

                      {/* Event Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Event Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
                          value={calendarEventName}
                          onChange={(e) => setCalendarEventName(e.target.value)}
                          placeholder="Name of the event as it should appear on the calendar"
                        />
                      </div>

                      {/* Event Date */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Event Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
                          value={calendarEventDate}
                          onChange={(e) => setCalendarEventDate(e.target.value)}
                        />
                      </div>

                      {/* Start/End Time */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Event Start Time <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="time"
                            step="300"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
                            value={calendarEventStartTime}
                            onChange={(e) => setCalendarEventStartTime(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Event End Time <span className="text-gray-400">(optional)</span>
                          </label>
                          <input
                            type="time"
                            step="300"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
                            value={calendarEventEndTime}
                            onChange={(e) => setCalendarEventEndTime(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Short Event Description */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Short Event Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
                          rows={3}
                          value={calendarEventDescription}
                          onChange={(e) => setCalendarEventDescription(e.target.value)}
                          placeholder="A brief description of the event for the calendar listing"
                        />
                      </div>

                      {/* Event Location */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Event Location <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
                          value={calendarEventLocation}
                          onChange={(e) => setCalendarEventLocation(e.target.value)}
                          placeholder="e.g., Parish Center Room 201, Church, etc."
                        />
                      </div>

                      {/* Event Sign Up Link */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Event Sign Up Link <span className="text-gray-400">(optional)</span>
                        </label>
                        <input
                          type="url"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
                          value={calendarEventSignUpLink}
                          onChange={(e) => setCalendarEventSignUpLink(e.target.value)}
                          placeholder="https://example.com/signup"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Consider for Social Media */}
              <div>
                <div className="flex items-center">
                  <input
                    id="social-consideration"
                    type="checkbox"
                    className="h-4 w-4 text-sh-primary focus:ring-sh-primary border-gray-300 rounded"
                    checked={socialConsideration}
                    onChange={(e) => setSocialConsideration(e.target.checked)}
                  />
                  <label htmlFor="social-consideration" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Consider for Social Media
                  </label>
                </div>
                <p className="mt-1 ml-6 text-xs text-gray-500 dark:text-gray-400">
                  Check this if you think this event or announcement may be a good fit for Saint
                  Helen social media. Submission does not guarantee a post — the communications
                  team decides timing, format, and whether it's a fit.
                </p>
              </div>

              {/* Conditional Social Media Details */}
              <AnimatePresence>
                {socialConsideration && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-5 bg-purple-50/80 dark:bg-purple-900/20 backdrop-blur-sm border border-purple-200/50 dark:border-purple-800/50 rounded-2xl space-y-4">
                      <h4 className="font-semibold text-purple-900 dark:text-purple-200 text-sm">
                        A Little More for Social Media
                      </h4>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          What would you like people to know or do? <span className="text-gray-400">(optional)</span>
                        </label>
                        <textarea
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
                          rows={2}
                          value={socialWhatToKnow}
                          onChange={(e) => setSocialWhatToKnow(e.target.value)}
                          placeholder="One or two sentences is plenty."
                        />
                      </div>

                      <div>
                        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Do you have photos or video?
                        </span>
                        <div className="space-y-2">
                          {[
                            { value: 'yes', label: 'Yes' },
                            { value: 'no', label: 'No' },
                            { value: 'not_yet', label: 'Not yet — I will after the event' },
                          ].map((option) => (
                            <label key={option.value} className="flex items-center">
                              <input
                                type="radio"
                                name="social-has-photos"
                                className="h-4 w-4 text-sh-primary focus:ring-sh-primary border-gray-300"
                                checked={socialHasPhotos === option.value}
                                onChange={() => setSocialHasPhotos(option.value)}
                              />
                              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
                            </label>
                          ))}
                        </div>
                        {socialHasPhotos === 'yes' && (
                          <p className="mt-2 text-xs text-purple-700 dark:text-purple-300">
                            Great — attach them below, or use the &quot;add photos from your phone&quot;
                            link on the confirmation screen after you submit.
                          </p>
                        )}
                        {socialHasPhotos === 'not_yet' && (
                          <p className="mt-2 text-xs text-purple-700 dark:text-purple-300">
                            No problem — after you submit, you&apos;ll get a link you can use later to
                            add photos to this request from your phone.
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Attach Files (optional)
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  You can attach as many files as you need — flyers, photos, PDFs.
                </p>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600 dark:text-gray-400">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-sh-primary dark:text-blue-400 hover:text-blue-600 focus-within:outline-none"
                      >
                        <span className="px-2 py-1">Upload files</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          multiple
                          accept="image/*,.heic,.heif,.pdf,application/pdf"
                          onChange={handleFileUpload}
                          disabled={uploadingFiles}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Photos (iPhone photos welcome) and PDFs
                    </p>
                  </div>
                </div>
                <UploadProgress status={uploadStatus} />
                {fileLinks.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Uploaded Files:</h4>
                    <div className="space-y-2">
                      {fileLinks.map((link, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate flex-1 mr-2">
                            {link.split('/').pop() || `File ${index + 1}`}
                          </a>
                          <button
                            type="button"
                            onClick={() => setFileLinks(prev => prev.filter((_, i) => i !== index))}
                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                            title="Remove file"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => document.getElementById('file-upload')?.click()}
                      className="mt-2 text-sm text-sh-primary hover:text-sh-primary-dark font-medium inline-flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add another file
                    </button>
                  </div>
                )}
              </div>

              {/* Success and Error Messages */}
              <AnimatePresence>
                {successMessage && (
                  <motion.div 
                    className="p-5 mb-4 rounded-xl bg-green-50/90 dark:bg-green-900/40 backdrop-blur-sm border border-green-200/50 dark:border-green-800/50 text-green-800 dark:text-green-300 shadow-soft"
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-start gap-3">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                      >
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </motion.div>
                      <div>
                        <p className="font-medium">{successMessage}</p>
                      </div>
                    </div>
                    {submittedRecordId && (
                      <AddPhotosPanel recordType="announcements" recordId={submittedRecordId} />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {errorMessage && (
                  <motion.div 
                    className="p-5 mb-4 rounded-xl bg-red-50/90 dark:bg-red-900/40 backdrop-blur-sm border border-red-200/50 dark:border-red-800/50 text-red-800 dark:text-red-300 shadow-soft"
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-start gap-3">
                      <ExclamationCircleIcon className="h-6 w-6 flex-shrink-0 mt-0.5 text-red-500" />
                      <div>
                        <p className="font-medium">{errorMessage}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <motion.div 
                className="pt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.6 }}
              >
                <motion.button
                  type="submit"
                  className="w-full bg-gradient-to-r from-sh-primary to-sh-primary-light hover:from-sh-primary-light hover:to-sh-primary text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 shadow-soft hover:shadow-soft-lg transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sh-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  disabled={submittingForm || uploadingFiles}
                  whileHover={{ scale: submittingForm || uploadingFiles ? 1 : 1.02 }}
                  whileTap={{ scale: submittingForm || uploadingFiles ? 1 : 0.98 }}
                >
                  <div className="flex items-center justify-center">
                    {submittingForm && (
                      <motion.div
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    )}
                    {submittingForm ? 'Submitting...' : 'Submit Announcement'}
                  </div>
                </motion.button>
              </motion.div>
            </form>
          </FrontCardContent>
        </FrontCard>
        </motion.div>
      </div>
    </FrontLayout>
  );
}