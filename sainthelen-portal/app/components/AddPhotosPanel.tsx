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
    <div className="mt-4 p-5 bg-sh-navy-50/60 dark:bg-sh-navy-900/20 border border-sh-navy-100 dark:border-sh-navy-800/50 rounded-2xl">
      <h3 className="font-bold text-gray-900 dark:text-white mb-1">
        Have photos or videos on your phone?
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
        Scan this code with your phone&apos;s camera to add them to this request — no need to
        fill anything out again. The link works for 30 days.
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-5">
        <div className="bg-white p-3 rounded-xl border border-gray-200">
          <QRCodeSVG value={uploadUrl} size={132} />
        </div>
        <div className="flex-1 w-full text-center sm:text-left">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            On your phone already? Use the link instead:
          </p>
          <a
            href={uploadUrl}
            className="block text-sm text-sh-rust hover:text-sh-rust-600 font-medium break-all underline"
          >
            {uploadUrl}
          </a>
          <button
            type="button"
            onClick={handleCopy}
            className="mt-3 px-4 py-2 text-sm font-medium bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
          >
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>
      </div>
    </div>
  );
}
