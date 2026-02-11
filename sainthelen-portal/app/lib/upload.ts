// app/lib/upload.ts
// Client-side file upload utilities - bypasses 4.5MB serverless limit

import { upload } from '@vercel/blob/client';

export interface UploadResult {
  url: string;
  pathname: string;
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
    // Generate a safe filename
    const safeFileName = file.name.replace(/\s+/g, '_');
    const pathname = `uploads/${Date.now()}-${safeFileName}`;

    const blob = await upload(pathname, file, {
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
