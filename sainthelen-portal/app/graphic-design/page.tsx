// app/graphic-design/page.tsx
'use client';

import { useState } from 'react';
import FrontLayout from '../components/FrontLayout';
import { Button } from '../components/ui/Button';
import { FormCard, FormSection, FooterNote } from '../components/ui/FormCard';
import { Field, Input, Textarea, Select, Checkbox, Band, Notice } from '../components/ui/Field';
import { FileDrop, AddRow, RemoveRow } from '../components/ui/FileDrop';
import UploadProgress from '@/app/components/ui/UploadProgress';
import { uploadFilesWithStatus, type UploadStatus } from '@/app/lib/upload';

export default function GraphicDesignFormPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [ministry, setMinistry] = useState('');
  const [projectType, setProjectType] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectRequirements, setProjectRequirements] = useState('');
  const [deadline, setDeadline] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [priority, setPriority] = useState('Standard');
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
      const res = await fetch('/api/graphic-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          ministry,
          projectType,
          projectDescription,
          projectRequirements,
          deadline,
          deadlineTime,
          dimensions,
          priority,
          fileLinks,
        }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Submission failed');
      }

      setSuccessMessage('Graphic design request submitted successfully!');
      
      // Reset form
      setName('');
      setEmail('');
      setMinistry('');
      setProjectType('');
      setProjectDescription('');
      setProjectRequirements('');
      setDeadline('');
      setDeadlineTime('');
      setDimensions('');
      setPriority('Standard');
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
        title="Design request"
        intro="A flier, graphic, or social media post designed by the Communications Office."
        onSubmit={handleSubmitForm}
        footer={
          <>
            <Button type="submit" size="lg" disabled={submittingForm || uploadingFiles}>
              {submittingForm ? 'Sending…' : 'Submit design request'}
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
          <Field label="Your name" htmlFor="gd-name" required>
            <Input id="gd-name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" className="max-w-[360px]" />
          </Field>
          <Field label="Email" htmlFor="gd-email" required>
            <Input id="gd-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="max-w-[360px]" />
          </Field>
          <Field label="Ministry" htmlFor="gd-ministry">
            <Input id="gd-ministry" value={ministry} onChange={(e) => setMinistry(e.target.value)} className="max-w-[360px]" />
          </Field>
        </FormSection>

        <Band>The piece</Band>
        <FormSection>
          <Field label="What kind of piece?" htmlFor="gd-type" required>
            <Select id="gd-type" value={projectType} onChange={(e) => setProjectType(e.target.value)} required className="max-w-[300px]">
              <option value="">Choose one…</option>
              <option value="Flyer">Flier</option>
              <option value="Poster">Poster</option>
              <option value="Social Media">Social media post</option>
              <option value="Digital Screens">Church screens slide</option>
              <option value="Email Graphic">Email graphic</option>
              <option value="Logo">Logo or ministry mark</option>
              <option value="Other">Something else</option>
            </Select>
          </Field>
          <Field label="What is it for?" htmlFor="gd-desc" required help="The event or purpose, who it is for, and the details to include: day, date, time, place, cost, contact.">
            <Textarea id="gd-desc" rows={6} value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)} required />
          </Field>
          <Field label="Must-haves" htmlFor="gd-req" help="Exact wording, a logo, a photo, a QR code, or colors that must be used.">
            <Textarea id="gd-req" rows={3} value={projectRequirements} onChange={(e) => setProjectRequirements(e.target.value)} />
          </Field>
          <Field label="Size" htmlFor="gd-size" help="For example: letter-size flier, 11×17 poster, Instagram square. Leave blank if you are not sure.">
            <Input id="gd-size" value={dimensions} onChange={(e) => setDimensions(e.target.value)} className="max-w-[360px]" />
          </Field>
          <div className="grid gap-x-3 sm:grid-cols-2">
            <Field label="Needed by" htmlFor="gd-deadline" required>
              <Input id="gd-deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} required />
            </Field>
            <Field label="Time of day" htmlFor="gd-deadline-time">
              <Input id="gd-deadline-time" type="time" value={deadlineTime} onChange={(e) => setDeadlineTime(e.target.value)} />
            </Field>
          </div>
          <Field label="How urgent?">
            <label className="flex items-center gap-2.5 py-1.5 text-md">
              <input type="radio" name="priority" className="m-0 h-[17px] w-[17px]" checked={priority === 'Standard'} onChange={() => setPriority('Standard')} />
              Standard
            </label>
            <label className="flex items-center gap-2.5 py-1.5 text-md">
              <input type="radio" name="priority" className="m-0 h-[17px] w-[17px]" checked={priority === 'Urgent'} onChange={() => setPriority('Urgent')} />
              Urgent
            </label>
          </Field>
          <Field label="Files" help="Photos, logos, a previous version, or examples of what you have in mind.">
            <FileDrop files={fileLinks} disabled={uploadingFiles} onFiles={(f) => handleFileUpload(asEvent(f))} onRemove={(i) => setFileLinks((prev) => prev.filter((_, k) => k !== i))} />
            <UploadProgress status={uploadStatus} />
          </Field>
        </FormSection>
      </FormCard>
    </FrontLayout>
  );
}
