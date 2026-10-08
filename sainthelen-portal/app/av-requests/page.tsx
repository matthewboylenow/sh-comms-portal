// app/av-requests/page.tsx
'use client';

import { useState } from 'react';
import FrontLayout from '../components/FrontLayout';
import { Button } from '../components/ui/Button';
import { FormCard, FormSection, FooterNote } from '../components/ui/FormCard';
import { Field, Input, Textarea, Select, Checkbox, Band, Notice } from '../components/ui/Field';
import { FileDrop, AddRow, RemoveRow } from '../components/ui/FileDrop';
import UploadProgress from '@/app/components/ui/UploadProgress';
import { uploadFilesWithStatus, type UploadStatus } from '@/app/lib/upload';

// Type for multiple date/time entries
type DateTimeEntry = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
};

export default function AVRequestsFormPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [ministry, setMinistry] = useState('');
  const [eventName, setEventName] = useState('');
  const [dateTimeEntries, setDateTimeEntries] = useState<DateTimeEntry[]>([
    { id: '1', date: '', startTime: '', endTime: '' },
  ]);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [needsLivestream, setNeedsLivestream] = useState(false);
  const [avNeeds, setAvNeeds] = useState('');
  const [expectedAttendees, setExpectedAttendees] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [fileLinks, setFileLinks] = useState<string[]>([]);

  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);
  const [submittingForm, setSubmittingForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Generate time options in 5-minute increments
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 5) {
        const hourStr = hour.toString().padStart(2, '0');
        const minuteStr = minute.toString().padStart(2, '0');
        const time = `${hourStr}:${minuteStr}`;
        options.push(
          <option key={time} value={time}>
            {hour > 12 ? `${hour - 12}:${minuteStr} PM` : (hour === 0 ? `12:${minuteStr} AM` : `${hour}:${minuteStr} ${hour === 12 ? 'PM' : 'AM'}`)}
          </option>
        );
      }
    }
    return options;
  };

  // Add a new date/time entry
  const addDateTimeEntry = () => {
    const newId = (parseInt(dateTimeEntries[dateTimeEntries.length - 1].id) + 1).toString();
    setDateTimeEntries([...dateTimeEntries, { id: newId, date: '', startTime: '', endTime: '' }]);
  };

  // Remove a date/time entry
  const removeDateTimeEntry = (id: string) => {
    if (dateTimeEntries.length > 1) {
      setDateTimeEntries(dateTimeEntries.filter(entry => entry.id !== id));
    }
  };

  // Update a specific date/time entry
  const updateDateTimeEntry = (id: string, field: 'date' | 'startTime' | 'endTime', value: string) => {
    setDateTimeEntries(
      dateTimeEntries.map(entry => 
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    );
  };

  // Handle file uploads using client-side Vercel Blob upload (bypasses 4.5MB serverless limit)
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    setErrorMessage('');
    setSuccessMessage('');
    setUploadingFiles(true);

    try {
      const filesArray = Array.from(e.target.files);
      const results = await uploadFilesWithStatus(filesArray, setUploadStatus);

      setFileLinks((prev) => [...prev, ...results.map((r) => r.url)]);
    } catch (err: any) {
      console.error('File upload error:', err);
      setErrorMessage(err.message || 'File upload failed');
    } finally {
      setUploadingFiles(false);
      setUploadStatus(null);
    }
  }

  // Submit form
  async function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingForm(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/av-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          ministry,
          eventName,
          dateTimeEntries,
          description,
          location,
          needsLivestream,
          avNeeds,
          expectedAttendees,
          additionalNotes,
          fileLinks,
        }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Submission failed');
      }

      setSuccessMessage('A/V request submitted successfully!');
      
      // Reset form
      setName('');
      setEmail('');
      setMinistry('');
      setEventName('');
      setDateTimeEntries([{ id: '1', date: '', startTime: '', endTime: '' }]);
      setDescription('');
      setLocation('');
      setNeedsLivestream(false);
      setAvNeeds('');
      setExpectedAttendees('');
      setAdditionalNotes('');
      setFileLinks([]);
    } catch (err: any) {
      console.error('Form submission error:', err);
      setErrorMessage(err.message || 'Form submission failed');
    } finally {
      setSubmittingForm(false);
    }
  }

  const asEvent = (files: File[]) => ({ target: { files } } as unknown as React.ChangeEvent<HTMLInputElement>);

  return (
    <FrontLayout>
      <FormCard
        title="A/V or livestream"
        intro="Sound, projection, or streaming for an event or meeting. About four minutes."
        onSubmit={handleSubmitForm}
        footer={
          <>
            <Button type="submit" size="lg" disabled={submittingForm || uploadingFiles}>
              {submittingForm ? 'Sending…' : 'Submit A/V request'}
            </Button>
            <FooterNote>1–2 weeks ahead; livestreams need the full two</FooterNote>
          </>
        }
      >
        {successMessage && (
          <div className="px-5 pt-4 sm:px-6">
            <Notice tone="success">{successMessage}</Notice>
            
          </div>
        )}
        {errorMessage && (
          <div className="px-5 pt-4 sm:px-6">
            <Notice tone="error">{errorMessage}</Notice>
          </div>
        )}

        <Band>About you</Band>
        <FormSection>
          <Field label="Your name" htmlFor="av-name" required>
            <Input id="av-name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" className="max-w-[360px]" />
          </Field>
          <Field label="Email" htmlFor="av-email" required>
            <Input id="av-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="max-w-[360px]" />
          </Field>
          <Field label="Ministry" htmlFor="av-ministry">
            <Input id="av-ministry" value={ministry} onChange={(e) => setMinistry(e.target.value)} className="max-w-[360px]" />
          </Field>
        </FormSection>

        <Band>The event</Band>
        <FormSection>
          <Field label="Event name" htmlFor="av-event" required>
            <Input id="av-event" value={eventName} onChange={(e) => setEventName(e.target.value)} required />
          </Field>
          <Field label="When" required help="Add a row for each date. Times are when you need the room ready.">
            <div className="flex flex-col gap-2">
              {dateTimeEntries.map((entry) => (
                <div key={entry.id} className="flex flex-wrap items-center gap-2">
                  <Input type="date" value={entry.date} onChange={(e) => updateDateTimeEntry(entry.id, 'date', e.target.value)} required aria-label="Date" className="w-auto min-w-[160px] flex-1" />
                  <Select value={entry.startTime} onChange={(e) => updateDateTimeEntry(entry.id, 'startTime', e.target.value)} required aria-label="Start time" className="w-auto min-w-[130px] flex-1">
                    <option value="">Starts</option>
                    {generateTimeOptions()}
                  </Select>
                  <Select value={entry.endTime} onChange={(e) => updateDateTimeEntry(entry.id, 'endTime', e.target.value)} aria-label="End time" className="w-auto min-w-[130px] flex-1">
                    <option value="">Ends</option>
                    {generateTimeOptions()}
                  </Select>
                  {dateTimeEntries.length > 1 && <RemoveRow onClick={() => removeDateTimeEntry(entry.id)} />}
                </div>
              ))}
            </div>
            <AddRow onClick={addDateTimeEntry}>Add another date</AddRow>
          </Field>
          <div className="grid gap-x-3 sm:grid-cols-2">
            <Field label="Where" htmlFor="av-where" required help="The church, Meaney Hall, the gym, a parish center room.">
              <Input id="av-where" value={location} onChange={(e) => setLocation(e.target.value)} required />
            </Field>
            <Field label="How many people" htmlFor="av-attend">
              <Input id="av-attend" value={expectedAttendees} onChange={(e) => setExpectedAttendees(e.target.value)} placeholder="About 80" />
            </Field>
          </div>
          <Field label="What's happening" htmlFor="av-desc" required help="A line or two so we know what the room needs to do.">
            <Textarea id="av-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} required />
          </Field>
        </FormSection>

        <Band>What you need</Band>
        <FormSection>
          <Checkbox label="Livestream it" checked={needsLivestream} onChange={(e) => setNeedsLivestream(e.target.checked)} />
          {needsLivestream && (
            <div className="mb-2">
              <Notice tone="info">Livestreams take extra setup and a volunteer. We confirm by email whether the date works.</Notice>
            </div>
          )}
          <Field label="Equipment" htmlFor="av-needs" required help="Microphones, projector and screen, music playback, a slideshow, a laptop connection.">
            <Textarea id="av-needs" rows={3} value={avNeeds} onChange={(e) => setAvNeeds(e.target.value)} required />
          </Field>
          <Field label="Anything else" htmlFor="av-notes">
            <Textarea id="av-notes" rows={3} value={additionalNotes} onChange={(e) => setAdditionalNotes(e.target.value)} />
          </Field>
          <Field label="Files" help="A run of show, slides, or a music list.">
            <FileDrop files={fileLinks} disabled={uploadingFiles} onFiles={(f) => handleFileUpload(asEvent(f))} onRemove={(i) => setFileLinks((prev) => prev.filter((_, k) => k !== i))} />
            <UploadProgress status={uploadStatus} />
          </Field>
        </FormSection>
      </FormCard>
    </FrontLayout>
  );
}
