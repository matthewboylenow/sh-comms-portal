// app/website-updates/page.tsx
'use client';

import { useState } from 'react';
import FrontLayout from '../components/FrontLayout';
import { Button } from '../components/ui/Button';
import { FormCard, FormSection, FooterNote } from '../components/ui/FormCard';
import { Field, Input, Textarea, Select, Checkbox, Band, Notice } from '../components/ui/Field';
import { FileDrop, AddRow, RemoveRow } from '../components/ui/FileDrop';
import CopyAssist from '../components/CopyAssist';
import AddPhotosPanel from '../components/AddPhotosPanel';
import UploadProgress from '../components/ui/UploadProgress';
import { uploadFilesWithStatus, type UploadStatus } from '../lib/upload';

// A labeled sign-up link (e.g. separate SignUpGenius links per activity)
type SignUpLinkEntry = {
  id: string;
  label: string;
  url: string;
};

export default function WebsiteUpdatesFormPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [pageToUpdate, setPageToUpdate] = useState('');
  const [description, setDescription] = useState('');
  const [signUpLinks, setSignUpLinks] = useState<SignUpLinkEntry[]>([
    { id: '1', label: '', url: '' },
  ]);
  const [fileLinks, setFileLinks] = useState<string[]>([]);

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

  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);
  const [submittingForm, setSubmittingForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  // ID of the record just created, for the "add photos from your phone" link
  const [submittedRecordId, setSubmittedRecordId] = useState('');

  // Upload files to Vercel Blob (client-side upload - no 4.5MB limit)
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

  // Form submit to /api/website-updates
  async function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingForm(true);
    setErrorMessage('');
    setSuccessMessage('');
    setSubmittedRecordId('');

    // Drop empty rows; the first link also fills the original single field
    const filledLinks = signUpLinks
      .filter((entry) => entry.url.trim())
      .map((entry) => ({ label: entry.label.trim(), url: entry.url.trim() }));

    try {
      const res = await fetch('/api/website-updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          urgent,
          pageToUpdate,
          description,
          signUpUrl: filledLinks[0]?.url || '',
          signUpLinks: filledLinks,
          fileLinks,
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

      setSuccessMessage('Website update request submitted successfully!');
      // Reset
      setName('');
      setEmail('');
      setUrgent(false);
      setPageToUpdate('');
      setDescription('');
      setSignUpLinks([{ id: '1', label: '', url: '' }]);
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
        title="Website update"
        intro="A change to a page on sainthelen.org. About three minutes."
        onSubmit={handleSubmitForm}
        footer={
          <>
            <Button type="submit" size="lg" disabled={submittingForm || uploadingFiles}>
              {submittingForm ? 'Sending…' : 'Submit update'}
            </Button>
            <FooterNote>Most updates go live in 2–3 business days</FooterNote>
          </>
        }
      >
        {successMessage && (
          <div className="px-5 pt-4 sm:px-6">
            <Notice tone="success">{successMessage}</Notice>
            {submittedRecordId && <AddPhotosPanel recordType="websiteUpdates" recordId={submittedRecordId} />}
          </div>
        )}
        {errorMessage && (
          <div className="px-5 pt-4 sm:px-6">
            <Notice tone="error">{errorMessage}</Notice>
          </div>
        )}

        <Band>About you</Band>
        <FormSection>
          <Field label="Your name" htmlFor="wu-name" required>
            <Input id="wu-name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" className="max-w-[360px]" />
          </Field>
          <Field label="Email" htmlFor="wu-email" required help="We'll send a confirmation and any questions here.">
            <Input id="wu-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="max-w-[360px]" />
          </Field>
        </FormSection>

        <Band>The change</Band>
        <FormSection>
          <Field label="Which page?" htmlFor="wu-page" required help="A link is best. A page name works too.">
            <Input id="wu-page" value={pageToUpdate} onChange={(e) => setPageToUpdate(e.target.value)} required placeholder="sainthelen.org/…" />
          </Field>
          <Field label="What should change?" htmlFor="wu-desc" required help="What to add, remove, or fix. Paste the exact text you want where you can.">
            <Textarea id="wu-desc" rows={7} value={description} onChange={(e) => setDescription(e.target.value)} required />
            <CopyAssist kind="website_update" value={description} onChange={setDescription} />
          </Field>
          <Field label="Links to add" help="Sign-ups, forms, or outside pages. Add a row for each with a short label.">
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
          <Field label="Files" help="Photos, PDFs, or a Word document with the new text.">
            <FileDrop files={fileLinks} disabled={uploadingFiles} onFiles={(f) => handleFileUpload(asEvent(f))} onRemove={(i) => setFileLinks((prev) => prev.filter((_, k) => k !== i))} />
            <UploadProgress status={uploadStatus} />
          </Field>
          <Checkbox label="This is urgent (a wrong date, a broken link, something live that is incorrect)" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} />
        </FormSection>
      </FormCard>
    </FrontLayout>
  );
}
