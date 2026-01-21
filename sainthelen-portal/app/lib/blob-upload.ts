/**
 * Vercel Blob upload utilities
 * Drop-in replacement for S3 presigned URL pattern
 */

interface UploadResult {
  url: string;
  pathname: string;
}

/**
 * Upload a file to Vercel Blob
 * This is a drop-in replacement for the S3 presigned URL pattern
 *
 * @param file - The file to upload
 * @returns The uploaded file URL and pathname
 */
export async function uploadToBlob(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/blob-upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload file');
  }

  const result = await response.json();
  return {
    url: result.objectUrl || result.url,
    pathname: result.pathname,
  };
}

/**
 * Upload multiple files to Vercel Blob
 *
 * @param files - Array of files to upload
 * @returns Array of uploaded file URLs
 */
export async function uploadMultipleToBlob(files: File[]): Promise<string[]> {
  const uploadedUrls: string[] = [];

  for (const file of files) {
    const result = await uploadToBlob(file);
    uploadedUrls.push(result.url);
  }

  return uploadedUrls;
}

/**
 * Check if Vercel Blob storage is configured
 */
export function isBlobConfigured(): boolean {
  // This check happens server-side via the API
  // Client-side we assume it's configured if the endpoint exists
  return true;
}

/**
 * Feature flag: whether to use Vercel Blob instead of S3
 */
export function useBlobStorage(): boolean {
  // Check for feature flag in environment
  // This will be controlled by USE_BLOB_STORAGE env var
  if (typeof window !== 'undefined') {
    // Client-side: check for global flag set by server
    return (window as any).__USE_BLOB_STORAGE__ === true;
  }
  return process.env.USE_BLOB_STORAGE === 'true';
}
