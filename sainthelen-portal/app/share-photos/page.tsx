// app/share-photos/page.tsx
// Share parish-life photos with Communications - deliberately minimal.
// No captions, no strategy, no writing assignment. Just photos with context.
'use client';

import { useState } from 'react';
import FrontLayout from '../components/FrontLayout';
import { Button } from '../components/ui/Button';
import { FormCard, FormSection, FooterNote } from '../components/ui/FormCard';
import { Field, Input, Textarea, Select, Checkbox, Band, Notice } from '../components/ui/Field';
import { FileDrop, AddRow, RemoveRow } from '../components/ui/FileDrop';
import MinistryAutocomplete from '../components/ui/MinistryAutocomplete';
import UploadProgress from '../components/ui/UploadProgress';
import { uploadFilesWithStatus, type UploadStatus } from '../lib/upload';

export default function SharePhotosPage() {
  const [description, setDescription] = useState('');
  const [ministry, setMinistry] = useState('');
  const [photoDate, setPhotoDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [submitterName, setSubmitterName] = useState('');
  const [privacyConcern, setPrivacyConcern] = useState(false);
  const [privacyNotes, setPrivacyNotes] = useState('');
  const [fileLinks, setFileLinks] = useState<string[]>([]);

  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    setUploading(true);
    setErrorMessage('');

    try {
      const results = await uploadFilesWithStatus(files, setUploadStatus);
      setFileLinks((prev) => [...prev, ...results.map((r) => r.url)]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setUploadStatus(null);
      e.target.value = '';
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/photo-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          ministry,
          photoDate,
          submitterName,
          privacyConcern,
          privacyNotes: privacyConcern ? privacyNotes : '',
          fileLinks,
        }),
      });
      const result = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(result.error || 'Something went wrong');

      setSuccessMessage('Thank you! Your photos are on their way to the communications team.');
      setDescription('');
      setMinistry('');
      setPhotoDate(new Date().toISOString().split('T')[0]);
      setSubmitterName('');
      setPrivacyConcern(false);
      setPrivacyNotes('');
      setFileLinks([]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const asEvent = (files: File[]) => ({ target: { files } } as unknown as React.ChangeEvent<HTMLInputElement>);

  return (
    <FrontLayout>
      <FormCard
        title="Share photos"
        intro="Photos from a parish event or ministry, for the website, email, and social media."
        onSubmit={handleSubmit}
        footer={
          <>
            <Button type="submit" size="lg" disabled={submitting || uploading || fileLinks.length === 0}>
              {submitting ? 'Sending…' : 'Send photos'}
            </Button>
            {fileLinks.length === 0 && <FooterNote>Add at least one photo to send</FooterNote>}
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

        <Band>The photos</Band>
        <FormSection>
          <Field label="Photos or video" required help="Photos from your phone are fine. Add as many as you like.">
            <FileDrop files={fileLinks} disabled={uploading} accept="image/*,video/*" onFiles={(f) => handleFiles(asEvent(f))} onRemove={(i) => setFileLinks((prev) => prev.filter((_, k) => k !== i))} hint="photos or video" label="Add photos or drop them here" />
            <UploadProgress status={uploadStatus} />
          </Field>
          <Field label="What is happening in the photos?" htmlFor="ph-desc" required help="A short description is enough. For example: Food Pantry volunteers packing bags.">
            <Input id="ph-desc" value={description} onChange={(e) => setDescription(e.target.value)} required />
          </Field>
          <div className="grid gap-x-3 sm:grid-cols-2">
            <Field label="Ministry or event" htmlFor="ph-ministry">
              <MinistryAutocomplete value={ministry} onChange={(v) => setMinistry(v)} placeholder="Start typing…" />
            </Field>
            <Field label="Taken on" htmlFor="ph-date">
              <Input id="ph-date" type="date" value={photoDate} onChange={(e) => setPhotoDate(e.target.value)} />
            </Field>
          </div>
        </FormSection>

        <Band>Before we post</Band>
        <FormSection>
          <Field label="Is anyone pictured who should not be shown publicly?">
            <label className="flex items-center gap-2.5 py-1.5 text-md">
              <input type="radio" name="privacy" className="m-0 h-[17px] w-[17px]" checked={!privacyConcern} onChange={() => setPrivacyConcern(false)} />
              No
            </label>
            <label className="flex items-center gap-2.5 py-1.5 text-md">
              <input type="radio" name="privacy" className="m-0 h-[17px] w-[17px]" checked={privacyConcern} onChange={() => setPrivacyConcern(true)} />
              Yes
            </label>
            {privacyConcern && (
              <Input className="mt-2" value={privacyNotes} onChange={(e) => setPrivacyNotes(e.target.value)} placeholder="For example: the family on the left asked not to be posted." aria-label="Privacy note" />
            )}
          </Field>
          <Field label="Your name" htmlFor="ph-name" help="So we can thank you.">
            <Input id="ph-name" value={submitterName} onChange={(e) => setSubmitterName(e.target.value)} autoComplete="name" className="max-w-[360px]" />
          </Field>
        </FormSection>
      </FormCard>
    </FrontLayout>
  );
}
