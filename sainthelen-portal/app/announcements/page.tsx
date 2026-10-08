// app/announcements/page.tsx
'use client';

import { useState } from 'react';
import FrontLayout from '../components/FrontLayout';
import CopyAssist from '../components/CopyAssist';
import { Button } from '../components/ui/Button';
import { FormCard, FormSection, FooterNote } from '../components/ui/FormCard';
import { Field, Input, Textarea, Select, Checkbox, Band, Notice } from '../components/ui/Field';
import { FileDrop, AddRow, RemoveRow } from '../components/ui/FileDrop';
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
  const words = announcementBody.trim() ? announcementBody.trim().split(/\s+/).length : 0;
  const deadline = (() => {
    const sat = new Date(`${(selectedWeekend || upcomingWeekends[0]).value}T12:00:00`);
    const mon = new Date(sat);
    mon.setDate(sat.getDate() - 5);
    return mon.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  })();
  const weekendShort = (w: { label: string }) => w.label.replace(/^Weekend of /, '').replace(/, \d{4}$/, '');

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
    <FrontLayout>
      <FormCard
        title="Announcement"
        intro="For the bulletin, the Wednesday email, and the church screens. About five minutes."
        onSubmit={handleSubmitForm}
        footer={
          <>
            <Button type="submit" size="lg" disabled={submittingForm || uploadingFiles}>
              {submittingForm ? 'Sending…' : 'Submit announcement'}
            </Button>
            <FooterNote>
              Bulletin for {weekendShort(selectedWeekend || upcomingWeekends[0])} closes {deadline} at noon
            </FooterNote>
          </>
        }
      >
        {successMessage && (
          <div className="px-5 pt-4 sm:px-6">
            <Notice tone="success">
              <p className="font-medium">{successMessage}</p>
              <p className="mt-1">We will email you if we have a question. Minor edits for length and voice are made without notice.</p>
            </Notice>
            {submittedRecordId && <AddPhotosPanel recordType="announcements" recordId={submittedRecordId} />}
          </div>
        )}
        {errorMessage && (
          <div className="px-5 pt-4 sm:px-6">
            <Notice tone="error">{errorMessage}</Notice>
          </div>
        )}

        <Band>About you</Band>
        <FormSection>
          <Field label="Your name" htmlFor="ann-name" required>
            <Input id="ann-name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" className="max-w-[360px]" />
          </Field>
          <Field label="Email" htmlFor="ann-email" required help="We'll send a confirmation and any questions here.">
            <Input id="ann-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="max-w-[360px]" />
          </Field>
          <Field label="Ministry" htmlFor="ann-ministry">
            <div className="max-w-[360px]">
              <MinistryAutocomplete
                value={ministry}
                onChange={handleMinistryChange}
                onApprovalStatusChange={handleApprovalStatusChange}
                placeholder="Start typing…"
              />
            </div>
          </Field>
          <Checkbox
            label="This is for a group or event outside Saint Helen"
            checked={isExternalEvent}
            onChange={(e) => setIsExternalEvent(e.target.checked)}
          />
          {isExternalEvent && (
            <div className="mb-2">
              <Notice tone="warn">
                Saint Helen events and ministries come first. We fit outside events in where there is room.
              </Notice>
            </div>
          )}
        </FormSection>

        <Band note="skip if it isn't one">The event</Band>
        <FormSection>
          <Field label="When does it happen?" help="Add a row for each date.">
            <div className="flex max-w-[460px] flex-col gap-2">
              {eventDates.map((entry) => (
                <div key={entry.id} className="flex items-center gap-2">
                  <Input type="date" value={entry.date} onChange={(e) => updateEventDate(entry.id, 'date', e.target.value)} aria-label="Date" />
                  <Input type="time" step="300" value={entry.time} onChange={(e) => updateEventDate(entry.id, 'time', e.target.value)} aria-label="Time" />
                  {eventDates.length > 1 && <RemoveRow onClick={() => removeEventDate(entry.id)} />}
                </div>
              ))}
            </div>
            <AddRow onClick={addEventDate}>Add another date</AddRow>
          </Field>

          <Checkbox
            label="Put it on the parish calendar at sainthelen.org"
            checked={addToCalendar}
            onChange={(e) => setAddToCalendar(e.target.checked)}
          />

          {addToCalendar && (
            <div className="mb-2 mt-1 rounded-md border border-line bg-surface-2 px-4 pb-2 pt-1">
              <p className="pt-2 text-xs text-ink-3">We clean this up into a calendar listing and send you a preview before it goes live.</p>
              <Field label="Event name" htmlFor="cal-name" required>
                <Input id="cal-name" value={calendarEventName} onChange={(e) => setCalendarEventName(e.target.value)} placeholder="As it should read on the calendar" />
              </Field>
              <div className="grid gap-x-3 sm:grid-cols-3">
                <Field label="Date" htmlFor="cal-date" required>
                  <Input id="cal-date" type="date" value={calendarEventDate} onChange={(e) => setCalendarEventDate(e.target.value)} />
                </Field>
                <Field label="Starts" htmlFor="cal-start" required>
                  <Input id="cal-start" type="time" step="300" value={calendarEventStartTime} onChange={(e) => setCalendarEventStartTime(e.target.value)} />
                </Field>
                <Field label="Ends" htmlFor="cal-end">
                  <Input id="cal-end" type="time" step="300" value={calendarEventEndTime} onChange={(e) => setCalendarEventEndTime(e.target.value)} />
                </Field>
              </div>
              <Field label="Where" htmlFor="cal-where" required help="The gym, Meaney Hall, the Gathering Space, the church.">
                <Input id="cal-where" value={calendarEventLocation} onChange={(e) => setCalendarEventLocation(e.target.value)} />
              </Field>
              <Field label="Short description" htmlFor="cal-desc" required>
                <Textarea id="cal-desc" rows={3} value={calendarEventDescription} onChange={(e) => setCalendarEventDescription(e.target.value)} />
              </Field>
              <Field label="Sign-up link for the calendar" htmlFor="cal-link">
                <Input id="cal-link" type="url" value={calendarEventSignUpLink} onChange={(e) => setCalendarEventSignUpLink(e.target.value)} placeholder="https://" />
              </Field>
            </div>
          )}
        </FormSection>

        <Band>The announcement</Band>
        <FormSection>
          <Field label="Where should it run?" required>
            <Checkbox label="Bulletin" checked={platforms.includes('Bulletin')} onChange={() => handlePlatformChange('Bulletin')} />
            <Checkbox label="Wednesday email" checked={platforms.includes('Email Blast')} onChange={() => handlePlatformChange('Email Blast')} />
            <Checkbox label="Church screens" checked={platforms.includes('Church Screens')} onChange={() => handlePlatformChange('Church Screens')} />
          </Field>

          <Field
            label="Which weekend should it start?"
            htmlFor="ann-weekend"
            help={selectedWeekend ? `The Wednesday email for that weekend goes out ${selectedWeekend.emailBlastDate}.` : 'A request; we may shift it a week if space is tight.'}
          >
            <Select id="ann-weekend" value={promotionStart} onChange={(e) => setPromotionStart(e.target.value)} className="max-w-[300px]">
              <option value="">Choose a weekend…</option>
              {upcomingWeekends.map((w) => (
                <option key={w.value} value={w.value}>
                  {weekendShort(w)}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Announcement text"
            htmlFor="ann-body"
            required
            help="Write it the way you'd tell a neighbor. Day, date, time, place, cost, and who to contact. The bulletin limit is 90 words."
          >
            <Textarea id="ann-body" rows={7} value={announcementBody} onChange={(e) => setAnnouncementBody(e.target.value)} required />
            <div className="mt-1.5 flex items-start justify-between gap-3">
              <span className={`tnum text-xs ${words > 90 ? 'text-status-approval-t' : 'text-ink-3'}`}>
                {words} {words === 1 ? 'word' : 'words'}
                {words > 90 ? ' · over the bulletin limit' : ''}
              </span>
            </div>
            <CopyAssist kind="announcement" value={announcementBody} onChange={setAnnouncementBody} />
          </Field>

          <Field label="Sign-up links" help="If different groups sign up in different places, add a row for each with a short label.">
            <div className="flex flex-col gap-2">
              {signUpLinks.map((entry) => (
                <div key={entry.id} className="flex items-center gap-2">
                  <Input value={entry.label} onChange={(e) => updateSignUpLink(entry.id, 'label', e.target.value)} placeholder="Label (optional)" className="max-w-[180px]" aria-label="Link label" />
                  <Input type="url" value={entry.url} onChange={(e) => updateSignUpLink(entry.id, 'url', e.target.value)} placeholder="https://" aria-label="Link" />
                  {signUpLinks.length > 1 && <RemoveRow onClick={() => removeSignUpLink(entry.id)} />}
                </div>
              ))}
            </div>
            <AddRow onClick={addSignUpLink}>Add another link</AddRow>
          </Field>

          <Field label="Fliers or files" help="PDF, Word, or images. We read them for details the form leaves out.">
            <FileDrop
              files={fileLinks}
              disabled={uploadingFiles}
              onFiles={(files) => handleFileUpload({ target: { files } } as unknown as React.ChangeEvent<HTMLInputElement>)}
              onRemove={(i) => setFileLinks((prev) => prev.filter((_, k) => k !== i))}
            />
            <UploadProgress status={uploadStatus} />
          </Field>
        </FormSection>

        <Band note="not published">For the office</Band>
        <FormSection>
          <Field label="Notes" htmlFor="ann-notes" help="Deadlines, ordering timelines, or how many weekends you'd like it to run.">
            <Textarea id="ann-notes" rows={3} value={publicationNotes} onChange={(e) => setPublicationNotes(e.target.value)} />
          </Field>

          <Checkbox
            label="Worth a social media post?"
            checked={socialConsideration}
            onChange={(e) => setSocialConsideration(e.target.checked)}
          />
          {socialConsideration && (
            <div className="mb-2 mt-1 rounded-md border border-line bg-surface-2 px-4 pb-2 pt-1">
              <p className="pt-2 text-xs text-ink-3">The office decides timing and format; checking this is a nudge, not a booking.</p>
              <Field label="What should people know or do?" htmlFor="soc-know">
                <Textarea id="soc-know" rows={2} value={socialWhatToKnow} onChange={(e) => setSocialWhatToKnow(e.target.value)} placeholder="One or two sentences is plenty." />
              </Field>
              <Field label="Do you have photos or video?">
                {[
                  { value: 'yes', label: 'Yes' },
                  { value: 'no', label: 'No' },
                  { value: 'not_yet', label: 'Not yet. I will after the event.' },
                ].map((o) => (
                  <label key={o.value} className="flex items-center gap-2.5 py-1.5 text-md">
                    <input type="radio" name="social-has-photos" className="m-0 h-[17px] w-[17px]" checked={socialHasPhotos === o.value} onChange={() => setSocialHasPhotos(o.value)} />
                    {o.label}
                  </label>
                ))}
                {socialHasPhotos === 'yes' && <p className="mt-1 text-xs text-ink-3">Attach them above, or use the phone link on the confirmation screen.</p>}
                {socialHasPhotos === 'not_yet' && <p className="mt-1 text-xs text-ink-3">After you submit you get a link to add photos from your phone later.</p>}
              </Field>
            </div>
          )}
        </FormSection>
      </FormCard>
    </FrontLayout>
  );
}
