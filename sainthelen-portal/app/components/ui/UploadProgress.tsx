// app/components/ui/UploadProgress.tsx
// Progress display shown while files convert/upload, so nobody thinks the
// page froze. Shows which file we're on, a real progress bar, and a
// "keep this page open" hint.
'use client';

import { type UploadStatus } from '../../lib/upload';

type UploadProgressProps = {
  status: UploadStatus | null;
};

export default function UploadProgress({ status }: UploadProgressProps) {
  if (!status) return null;

  // Overall progress across all files: finished files + current file's percent
  const overallPercent = Math.min(
    100,
    Math.round(((status.current - 1 + status.percent / 100) / status.total) * 100)
  );

  const label =
    status.phase === 'converting'
      ? `Preparing ${shortName(status.fileName)} (converting iPhone photo)...`
      : status.total === 1
        ? `Uploading ${shortName(status.fileName)}... ${status.percent}%`
        : `Uploading file ${status.current} of ${status.total}... ${status.percent}%`;

  return (
    <div className="mt-2 rounded border border-line bg-surface-2 px-3 py-2.5">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-3.5 w-3.5 flex-shrink-0 animate-spin rounded-full border-2 border-navy border-t-transparent"></div>
        <span className="text-sm font-medium text-ink">{label}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-navy transition-all duration-300"
          style={{ width: `${Math.max(overallPercent, 4)}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-ink-3">
        Please keep this page open until the upload finishes.
      </p>
    </div>
  );
}

function shortName(fileName: string): string {
  return fileName.length > 30 ? `${fileName.slice(0, 27)}...` : fileName;
}
