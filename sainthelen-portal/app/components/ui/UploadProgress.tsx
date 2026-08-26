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
    <div className="mt-3 p-4 bg-sh-navy-50/60 dark:bg-slate-700/60 border border-sh-navy-100 dark:border-slate-600 rounded-xl">
      <div className="flex items-center gap-3 mb-2">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-sh-navy dark:border-blue-400 border-t-transparent flex-shrink-0"></div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</span>
      </div>
      <div className="w-full h-2 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
        <div
          className="h-full bg-sh-navy dark:bg-blue-500 rounded-full transition-all duration-300"
          style={{ width: `${Math.max(overallPercent, 4)}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Please keep this page open until the upload finishes.
      </p>
    </div>
  );
}

function shortName(fileName: string): string {
  return fileName.length > 30 ? `${fileName.slice(0, 27)}...` : fileName;
}
