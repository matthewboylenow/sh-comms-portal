// app/lib/upload.ts
// Client-side file upload utilities - bypasses 4.5MB serverless limit

import { upload } from '@vercel/blob/client';

export interface UploadResult {
  url: string;
  pathname: string;
}

// Structured status for upload UI (progress bars, "converting" notices)
export interface UploadStatus {
  current: number; // 1-based index of the file being processed
  total: number;
  percent: number; // 0-100 for the current file's upload
  phase: 'converting' | 'uploading';
  fileName: string;
}

function isHeicFile(file: File): boolean {
  return (
    /\.hei[cf]$/i.test(file.name) ||
    file.type === 'image/heic' ||
    file.type === 'image/heif'
  );
}

/**
 * Convert iPhone HEIC/HEIF photos to JPEG in the browser so they display
 * everywhere (admin thumbnails, website, email). The converter is loaded
 * lazily - visitors who never pick a HEIC file never download it. If
 * conversion fails for any reason, the original file is uploaded instead
 * so nobody gets stuck.
 */
async function convertHeicIfNeeded(file: File): Promise<File> {
  if (!isHeicFile(file)) return file;

  try {
    const heic2any = (await import('heic2any')).default;
    const converted = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.85,
    });
    const blob = Array.isArray(converted) ? converted[0] : converted;
    const newName = file.name.replace(/\.hei[cf]$/i, '') + '.jpg';
    return new File([blob], newName, { type: 'image/jpeg' });
  } catch (error) {
    console.warn('HEIC conversion failed, uploading original file:', error);
    return file;
  }
}

/**
 * Upload a file using Vercel Blob's client-side upload
 * This bypasses the 4.5MB serverless function limit by uploading directly to blob storage
 *
 * @param file - The file to upload
 * @param onProgress - Optional callback for upload progress (0-100)
 * @returns Promise with the uploaded file URL and pathname
 */
export async function uploadFile(
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  try {
    const uploadable = await convertHeicIfNeeded(file);

    // Generate a safe filename
    const safeFileName = uploadable.name.replace(/\s+/g, '_');
    const pathname = `uploads/${Date.now()}-${safeFileName}`;

    const blob = await upload(pathname, uploadable, {
      access: 'public',
      handleUploadUrl: '/api/blob-upload/client-token',
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          onProgress(percent);
        }
      },
    });

    return {
      url: blob.url,
      pathname: blob.pathname,
    };
  } catch (error: any) {
    console.error('Upload error:', error);
    throw new Error(error.message || 'Failed to upload file');
  }
}

/**
 * Upload multiple files with structured status reporting for the UI:
 * which file is being worked on, whether it's converting or uploading,
 * and the current file's upload percentage.
 */
export async function uploadFilesWithStatus(
  files: File[],
  onStatus?: (status: UploadStatus) => void
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const base = { current: i + 1, total: files.length, fileName: file.name };

    if (isHeicFile(file)) {
      onStatus?.({ ...base, phase: 'converting', percent: 0 });
    }
    const uploadable = await convertHeicIfNeeded(file);

    onStatus?.({ ...base, phase: 'uploading', percent: 0 });

    const safeFileName = uploadable.name.replace(/\s+/g, '_');
    const pathname = `uploads/${Date.now()}-${safeFileName}`;

    const blob = await upload(pathname, uploadable, {
      access: 'public',
      handleUploadUrl: '/api/blob-upload/client-token',
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          onStatus?.({ ...base, phase: 'uploading', percent });
        }
      },
    });

    results.push({ url: blob.url, pathname: blob.pathname });
  }

  return results;
}

/**
 * Upload multiple files
 *
 * @param files - Array of files to upload
 * @param onFileProgress - Optional callback for per-file progress
 * @returns Promise with array of upload results
 */
export async function uploadFiles(
  files: File[],
  onFileProgress?: (fileIndex: number, progress: number) => void
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const result = await uploadFile(files[i], (progress) => {
      onFileProgress?.(i, progress);
    });
    results.push(result);
  }

  return results;
}

/**
 * Legacy upload function for backwards compatibility
 * Uses the old server-side upload (limited to 4.5MB)
 * @deprecated Use uploadFile() instead for larger files
 */
export async function uploadFileLegacy(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/blob-upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(error.error || 'Upload failed');
  }

  const data = await res.json();
  return {
    url: data.url || data.objectUrl,
    pathname: data.pathname,
  };
}
