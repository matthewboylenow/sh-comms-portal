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
  const [newPage, setNewPage] = useState(false);
  const [pageError, setPageError] = useState('');
  // One row per change on this page
  const [changes, setChanges] = useState<Array<{ id: string; text: string }>>([{ id: '1', text: '' }]);
  const description = changes.map((c) => c.text.trim()).filter(Boolean).map((t) => `• ${t}`).join('\n');
  const addChange = () => setChanges((cs) => [...cs, { id: String(Number(cs[cs.length - 1]?.id || '0') + 1), text: '' }]);
  const removeChange = (id: string) => setChanges((cs) => (cs.length > 1 ? cs.filter((c) => c.id !== id) : cs));
  const updateChange = (id: string, text: string) => setChanges((cs) => cs.map((c) => (c.id === id ? { ...c, text } : c)));
  /** A sainthelen.org address, or a page name when a new page is wanted. */
  const pageProblem = (v: string): string => {
    const t = v.trim();
    if (!t) return 'Tell us which page.';
    if (newPage) return '';
    if (/^https?:\/\//i.test(t)) {
      try {
        const u = new URL(t);
        if (!/(^|\.)sainthelen\.org$/i.test(u.hostname)) return 'That link is not on sainthelen.org. If the page does not exist yet, tick "This is a new page".';
        return '';
      } catch {
        return 'That does not look like a web address.';
      }
    }
    if (/^(www\.)?sainthelen\.org/i.test(t)) return '';
    return 'Paste the page\'s address from your browser (it starts with sainthelen.org). If the page does not exist yet, tick "This is a new page".';
  };
  const normalisePage = (v: string) => {
    const t = v.trim();
    if (newPage || /^https?:\/\//i.test(t)) return t;
    if (/^(www\.)?sainthelen\.org/i.test(t)) return `https://${t.replace(/^www\./i, '')}`;
    return t;
  };
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

    const problem = pageProblem(pageToUpdate);
    if (problem) {
      setPageError(problem);
      setErrorMessage(problem);
      setSubmittingForm(false);
      return;
    }
    const cleanChanges = changes.map((c) => c.text.trim()).filter(Boolean);
    if (!cleanChanges.length) {
      setErrorMessage('Describe at least one change.');
      setSubmittingForm(false);
      return;
    }

    try {
      const res = await fetch('/api/website-updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          urgent,
          pageToUpdate: normalisePage(pageToUpdate),
          newPage,
          description,
          changes: cleanChanges,
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
      setChanges([{ id: '1', text: '' }]);
      setNewPage(false);
      setPageError('');
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
        intro="A change to a page on sainthelen.org."
        onSubmit={handleSubmitForm}
        footer={
          <>
            <Button type="submit" size="lg" disabled={submittingForm || uploadingFiles}>
              {submittingForm ? 'Sending…' : 'Submit update'}
            </Button>
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
          <Field label="Email" htmlFor="wu-email" required help="For your confirmation and any questions.">
            <Input id="wu-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="max-w-[360px]" />
          </Field>
        </FormSection>

        <Band>The change</Band>
        <FormSection>
          <Field
            label={newPage ? 'What should the new page be called?' : 'Which page?'}
            htmlFor="wu-page"
            required
            help={newPage ? 'A working title is fine. Say where it should live in the notes if you know.' : 'Paste the page\'s address from your browser. It starts with sainthelen.org.'}
            error={pageError || undefined}
          >
            <Input
              id="wu-page"
              value={pageToUpdate}
              onChange={(e) => {
                setPageToUpdate(e.target.value);
                if (pageError) setPageError('');
              }}
              onBlur={() => setPageError(pageToUpdate.trim() ? pageProblem(pageToUpdate) : '')}
              required
              placeholder={newPage ? 'Youth Ministry retreat 2027' : 'https://sainthelen.org/youth-ministry'}
              inputMode={newPage ? 'text' : 'url'}
            />
            <div className="mt-1.5">
              <Checkbox
                label="This is a new page that does not exist yet"
                checked={newPage}
                onChange={(e) => {
                  setNewPage(e.target.checked);
                  setPageError('');
                }}
              />
            </div>
          </Field>

          <Field label="What should change?" required help="One change per line. Add a row for each separate change so we can tick them off one at a time.">
            <div className="flex flex-col gap-2">
              {changes.map((c, i) => (
                <div key={c.id} className="flex items-start gap-2">
                  <span className="tnum mt-[11px] w-5 flex-none text-right text-xs text-ink-3">{i + 1}.</span>
                  <Textarea
                    rows={2}
                    value={c.text}
                    onChange={(e) => updateChange(c.id, e.target.value)}
                    placeholder={i === 0 ? 'Update the volunteer registration button to point to the new form' : 'Another change on this page'}
                    aria-label={`Change ${i + 1}`}
                    required={i === 0}
                  />
                  {changes.length > 1 && <RemoveRow onClick={() => removeChange(c.id)} />}
                </div>
              ))}
            </div>
            <AddRow onClick={addChange}>Add another change</AddRow>
            {description && (
              <div className="mt-2">
                <CopyAssist kind="website_update" value={description} onChange={(v) => setChanges(v.split(/\n/).map((l) => l.replace(/^[•\-*]\s*/, '').trim()).filter(Boolean).map((text, i) => ({ id: String(i + 1), text })))} />
              </div>
            )}
          </Field>
          <Field label="Links to add" help="Sign-ups, forms, or other pages. Add a row for each with a short label.">
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
          <Checkbox label="This is urgent (for example, a wrong date or a broken link on the live site)" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} />
        </FormSection>
      </FormCard>
    </FrontLayout>
  );
}
