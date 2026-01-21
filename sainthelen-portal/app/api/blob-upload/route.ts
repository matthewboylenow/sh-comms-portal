import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

// Direct server-side upload
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    // Handle multipart form data (direct file upload)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const pathname = formData.get('pathname') as string | null;

      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 }
        );
      }

      // Generate safe filename with timestamp
      const safeFileName = file.name.replace(/\s+/g, '_');
      const finalPathname = pathname || `uploads/${Date.now()}-${safeFileName}`;

      // Upload to Vercel Blob
      const blob = await put(finalPathname, file, {
        access: 'public',
        addRandomSuffix: false,
      });

      return NextResponse.json({
        url: blob.url,
        pathname: blob.pathname,
        // Match S3 response format for backwards compatibility
        uploadUrl: null,
        objectUrl: blob.url,
      });
    }

    // Handle JSON request (prepare for upload)
    if (contentType.includes('application/json')) {
      const body = await request.json();
      const { fileName, fileType } = body;

      if (!fileName) {
        return NextResponse.json(
          { error: 'fileName is required' },
          { status: 400 }
        );
      }

      // Generate safe filename with timestamp (matching S3 pattern)
      const safeFileName = fileName.replace(/\s+/g, '_');
      const pathname = `uploads/${Date.now()}-${safeFileName}`;

      // Return instructions for direct upload via POST with FormData
      // Client should use /api/blob-upload with multipart/form-data
      return NextResponse.json({
        pathname,
        contentType: fileType,
        uploadMethod: 'POST',
        uploadEndpoint: '/api/blob-upload',
        message: 'Use POST request to /api/blob-upload with FormData containing the file',
      });
    }

    return NextResponse.json(
      { error: 'Unsupported content type' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Error uploading to Vercel Blob:', error);
    return NextResponse.json(
      { error: error.message || 'Error uploading file' },
      { status: 500 }
    );
  }
}
