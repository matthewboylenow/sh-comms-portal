// app/flyer-review/page.tsx
'use client';

import { useState } from 'react';
import FrontLayout from '../components/FrontLayout';
import { Button } from '../components/ui/Button';
import { FormCard, FormSection, FooterNote } from '../components/ui/FormCard';
import { Field, Input, Textarea, Select, Checkbox, Band, Notice } from '../components/ui/Field';
import { FileDrop, AddRow, RemoveRow } from '../components/ui/FileDrop';
import UploadProgress from '@/app/components/ui/UploadProgress';
import { uploadFilesWithStatus, type UploadStatus } from '@/app/lib/upload';

export default function FlyerReviewFormPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [ministry, setMinistry] = useState('');
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [audience, setAudience] = useState('');
  const [purpose, setPurpose] = useState('');
  const [feedbackNeeded, setFeedbackNeeded] = useState('');
  const [urgency, setUrgency] = useState('standard');
  const [fileLinks, setFileLinks] = useState<string[]>([]);

  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);
  const [submittingForm, setSubmittingForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

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
      const res = await fetch('/api/flyer-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          ministry,
          eventName,
          eventDate,
          audience,
          purpose,
          feedbackNeeded,
          urgency,
          fileLinks,
        }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Submission failed');
      }

      setSuccessMessage('Flyer review request submitted successfully!');
      
      // Reset form
      setName('');
      setEmail('');
      setMinistry('');
      setEventName('');
      setEventDate('');
      setAudience('');
      setPurpose('');
      setFeedbackNeeded('');
      setUrgency('standard');
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
        title="Flier review"
        intro="Feedback on a flier you made before it goes out."
        onSubmit={handleSubmitForm}
        footer={
          <>
            <Button type="submit" size="lg" disabled={submittingForm || uploadingFiles}>
              {submittingForm ? 'Sending…' : 'Send for review'}
            </Button>
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
          <Field label="Your name" htmlFor="fr-name" required>
            <Input id="fr-name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" className="max-w-[360px]" />
          </Field>
          <Field label="Email" htmlFor="fr-email" required>
            <Input id="fr-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="max-w-[360px]" />
          </Field>
          <Field label="Ministry" htmlFor="fr-ministry">
            <Input id="fr-ministry" value={ministry} onChange={(e) => setMinistry(e.target.value)} className="max-w-[360px]" />
          </Field>
        </FormSection>

        <Band>The flier</Band>
        <FormSection>
          <Field label="Your flier" required help="PDF or an image.">
            <FileDrop files={fileLinks} disabled={uploadingFiles} onFiles={(f) => handleFileUpload(asEvent(f))} onRemove={(i) => setFileLinks((prev) => prev.filter((_, k) => k !== i))} hint="PDF or image" />
            <UploadProgress status={uploadStatus} />
          </Field>
          <div className="grid gap-x-3 sm:grid-cols-2">
            <Field label="Event or subject" htmlFor="fr-event" required>
              <Input id="fr-event" value={eventName} onChange={(e) => setEventName(e.target.value)} required />
            </Field>
            <Field label="Event date" htmlFor="fr-date">
              <Input id="fr-date" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
            </Field>
          </div>
          <Field label="Who is it for?" htmlFor="fr-aud" help="For example: families with young children, seniors, the whole parish.">
            <Input id="fr-aud" value={audience} onChange={(e) => setAudience(e.target.value)} />
          </Field>
          <Field label="What is it meant to do?" htmlFor="fr-purpose">
            <Select id="fr-purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} className="max-w-[300px]">
              <option value="">Choose one…</option>
              <option value="Event Promotion">Get people to an event</option>
              <option value="Ministry Recruitment">Bring people into a ministry</option>
              <option value="Information/Education">Explain or teach something</option>
              <option value="Fundraising">Raise money</option>
              <option value="Announcement">Announce something</option>
              <option value="Other">Something else</option>
            </Select>
          </Field>
          <Field label="What would help most?" htmlFor="fr-feedback" help="For example: the layout, the wording, or whether it fits the Saint Helen style.">
            <Textarea id="fr-feedback" rows={4} value={feedbackNeeded} onChange={(e) => setFeedbackNeeded(e.target.value)} />
          </Field>
          <Field label="Timing">
            <label className="flex items-center gap-2.5 py-1.5 text-md">
              <input type="radio" name="urgency" className="m-0 h-[17px] w-[17px]" checked={urgency === 'standard'} onChange={() => setUrgency('standard')} />
              No rush
            </label>
            <label className="flex items-center gap-2.5 py-1.5 text-md">
              <input type="radio" name="urgency" className="m-0 h-[17px] w-[17px]" checked={urgency === 'urgent'} onChange={() => setUrgency('urgent')} />
              Soon. It prints or posts in the next few days.
            </label>
          </Field>
        </FormSection>
      </FormCard>
    </FrontLayout>
  );
}
