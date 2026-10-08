// app/sms-requests/page.tsx
'use client';

import { useState } from 'react';
import FrontLayout from '../components/FrontLayout';
import { Button } from '../components/ui/Button';
import { FormCard, FormSection, FooterNote } from '../components/ui/FormCard';
import { Field, Input, Textarea, Select, Checkbox, Band, Notice } from '../components/ui/Field';
import { FileDrop, AddRow, RemoveRow } from '../components/ui/FileDrop';
import UploadProgress from '@/app/components/ui/UploadProgress';
import { uploadFilesWithStatus, type UploadStatus } from '@/app/lib/upload';

export default function SMSRequestsFormPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [ministry, setMinistry] = useState('');
  const [smsMessage, setSmsMessage] = useState('');
  const [requestedDate, setRequestedDate] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
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

  // Submit form to /api/sms-requests
  async function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingForm(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/sms-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          ministry,
          smsMessage,
          requestedDate,
          additionalInfo,
          fileLinks,
        }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Submission failed');
      }

      setSuccessMessage('SMS request submitted successfully!');
      // Reset
      setName('');
      setEmail('');
      setMinistry('');
      setSmsMessage('');
      setRequestedDate('');
      setAdditionalInfo('');
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
        title="Text message"
        intro="A short parish text for something time-sensitive. About two minutes."
        onSubmit={handleSubmitForm}
        footer={
          <>
            <Button type="submit" size="lg" disabled={submittingForm || uploadingFiles}>
              {submittingForm ? 'Sending…' : 'Submit text request'}
            </Button>
            <FooterNote>Ask a week ahead where you can</FooterNote>
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
          <Field label="Your name" htmlFor="sms-name" required>
            <Input id="sms-name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" className="max-w-[360px]" />
          </Field>
          <Field label="Email" htmlFor="sms-email" required>
            <Input id="sms-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="max-w-[360px]" />
          </Field>
          <Field label="Ministry" htmlFor="sms-ministry">
            <Input id="sms-ministry" value={ministry} onChange={(e) => setMinistry(e.target.value)} className="max-w-[360px]" />
          </Field>
        </FormSection>

        <Band>The text</Band>
        <FormSection>
          <Field label="Message" htmlFor="sms-body" required help="Up to 160 characters. Say what, when, and where to go. We trim for length if we have to.">
            <Textarea id="sms-body" rows={3} maxLength={160} value={smsMessage} onChange={(e) => setSmsMessage(e.target.value)} required />
            <p className={`tnum mt-1.5 text-xs ${smsMessage.length > 140 ? 'text-status-review-t' : 'text-ink-3'}`}>{smsMessage.length} of 160 characters</p>
          </Field>
          <Field label="Send on" htmlFor="sms-date" required help="The day you'd like it to go out.">
            <Input id="sms-date" type="date" value={requestedDate} onChange={(e) => setRequestedDate(e.target.value)} required className="max-w-[220px]" />
          </Field>
        </FormSection>

        <Band note="not sent">For the office</Band>
        <FormSection>
          <Field label="Anything else" htmlFor="sms-notes">
            <Textarea id="sms-notes" rows={3} value={additionalInfo} onChange={(e) => setAdditionalInfo(e.target.value)} />
          </Field>
          <Field label="Files">
            <FileDrop files={fileLinks} disabled={uploadingFiles} onFiles={(f) => handleFileUpload(asEvent(f))} onRemove={(i) => setFileLinks((prev) => prev.filter((_, k) => k !== i))} />
            <UploadProgress status={uploadStatus} />
          </Field>
        </FormSection>
      </FormCard>
    </FrontLayout>
  );
}
