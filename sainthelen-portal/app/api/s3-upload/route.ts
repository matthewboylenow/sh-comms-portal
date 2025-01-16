// app/api/s3-upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  S3Client,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export async function POST(request: NextRequest) {
  try {
    const { fileName, fileType } = await request.json();

    // Optional: You could sanitize or transform fileName here
    const key = `uploads/${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      ContentType: fileType,
    });

    // Generate a signed URL valid for e.g. 5 minutes
    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 300,
    });

    return NextResponse.json({
      uploadUrl: signedUrl,
      objectUrl: `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${key}`,
    });
  } catch (error: any) {
    console.error('Error creating S3 presigned URL:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Error generating S3 upload URL' }),
      { status: 500 }
    );
  }
}