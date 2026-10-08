// app/components/AddPhotosPanel.tsx
// Shown on form confirmation screens: a QR code + link so the submitter can
// add photos/video to the request they just made, straight from their phone.
'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

type AddPhotosPanelProps = {
  recordType: string; // e.g. 'announcements', 'websiteUpdates'
  recordId: string;
};

export default function AddPhotosPanel({ recordType, recordId }: AddPhotosPanelProps) {
  const [copied, setCopied] = useState(false);

  const uploadUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/add-photos/${recordType}/${recordId}`
      : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(uploadUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable; the visible link still works
    }
  };

  return (
    <div className="mt-4 rounded-lg border border-line bg-surface p-4">
      <h3 className="mb-1 text-md font-semibold text-ink">
        Have photos or videos on your phone?
      </h3>
      <p className="mb-3 text-sm text-ink-2">
        Scan this code with your phone&apos;s camera to add them to this request — no need to
        fill anything out again. The link works for 30 days.
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-5">
        <div className="rounded border border-line bg-white p-2">
          <QRCodeSVG value={uploadUrl} size={132} />
        </div>
        <div className="flex-1 w-full text-center sm:text-left">
          <p className="mb-1.5 text-xs text-ink-3">
            On your phone already? Use the link instead:
          </p>
          <a
            href={uploadUrl}
            className="block break-all text-sm font-medium text-navy underline"
          >
            {uploadUrl}
          </a>
          <button
            type="button"
            onClick={handleCopy}
            className="mt-2 inline-flex h-8 items-center rounded border border-line-2 bg-surface px-3 text-sm font-medium text-ink hover:bg-surface-2"
          >
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>
      </div>
    </div>
  );
}
