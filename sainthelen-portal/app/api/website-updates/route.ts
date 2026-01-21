// app/api/website-updates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { ClientSecretCredential } from '@azure/identity';

// New Neon database imports
import { useNeonDatabase } from '../../lib/db';
import * as websiteUpdatesService from '../../lib/db/services/website-updates';

type WebsiteUpdatesFormData = {
  name: string;
  email: string;
  urgent: boolean;
  pageToUpdate: string;
  description: string;
  signUpUrl?: string;
  fileLinks?: string[];
};

const personalToken = process.env.AIRTABLE_PERSONAL_TOKEN || '';
const baseId = process.env.AIRTABLE_BASE_ID || '';
const websiteUpdatesTable = process.env.WEBSITE_UPDATES_TABLE_NAME || 'Website Updates';

const base = new Airtable({ apiKey: personalToken }).base(baseId);

// WordPress API credentials
const WP_API_URL = process.env.WP_API_URL || 'https://sainthelen.org/wp-json';
const WP_AUTH_USERNAME = process.env.WP_AUTH_USERNAME || '';
const WP_AUTH_PASSWORD = process.env.WP_AUTH_PASSWORD || '';

// Microsoft Graph client
function getGraphClient() {
  const tenantId = process.env.AZURE_AD_TENANT_ID || '';
  const clientId = process.env.AZURE_AD_CLIENT_ID || '';
  const clientSecret = process.env.AZURE_AD_CLIENT_SECRET || '';

  const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes: ['https://graph.microsoft.com/.default'],
  });

  return Client.initWithMiddleware({ authProvider });
}

// Function to extract clean filename from S3 URL
function extractCleanFilename(s3Url: string): string {
  const filename = s3Url.split('/').pop() || '';
  // Remove timestamp prefix (format: 1234567890-filename.ext)
  const cleanFilename = filename.replace(/^\d+-/, '');
  return cleanFilename;
}

// Function to upload file to WordPress media library
async function uploadToWordPress(s3Url: string): Promise<{ id: number; url: string } | null> {
  try {
    // Download file from S3
    const response = await fetch(s3Url);
    if (!response.ok) {
      throw new Error(`Failed to download file from S3: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const cleanFilename = extractCleanFilename(s3Url);
    
    // Create FormData for WordPress upload
    const formData = new FormData();
    const blob = new Blob([buffer]);
    formData.append('file', blob, cleanFilename);
    
    // WordPress authentication
    const authString = Buffer.from(`${WP_AUTH_USERNAME}:${WP_AUTH_PASSWORD}`).toString('base64');
    
    // Upload to WordPress
    const wpResponse = await fetch(`${WP_API_URL}/wp/v2/media`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
      },
      body: formData,
    });

    if (!wpResponse.ok) {
      const errorText = await wpResponse.text();
      throw new Error(`WordPress upload failed: ${wpResponse.status} ${errorText}`);
    }

    const wpResult = await wpResponse.json();
    return {
      id: wpResult.id,
      url: wpResult.source_url,
    };
  } catch (error) {
    console.error('Error uploading to WordPress:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = (await request.json()) as WebsiteUpdatesFormData;
    console.log('Website Updates form submission:', data);

    // Upload files to WordPress and build file links
    let wordpressFileLinks: string[] = [];
    let fileLinksString = '';
    
    if (data.fileLinks?.length) {
      console.log('Uploading files to WordPress...');
      
      for (const s3Url of data.fileLinks) {
        const wpResult = await uploadToWordPress(s3Url);
        if (wpResult) {
          wordpressFileLinks.push(wpResult.url);
          console.log(`Successfully uploaded ${extractCleanFilename(s3Url)} to WordPress`);
        } else {
          // Fallback to S3 URL if WordPress upload fails
          wordpressFileLinks.push(s3Url);
          console.log(`Failed to upload ${extractCleanFilename(s3Url)} to WordPress, using S3 URL`);
        }
      }
      
      fileLinksString = wordpressFileLinks.join('\n');
    }

    // Fix: Convert the urgent boolean to a proper Yes/No string for Airtable
    const urgentValue = data.urgent ? 'Yes' : 'No';

    const useNeon = useNeonDatabase();

    if (useNeon) {
      // ===== NEON DATABASE PATH =====
      await websiteUpdatesService.createWebsiteUpdate({
        name: data.name,
        email: data.email,
        urgent: data.urgent,
        pageToUpdate: data.pageToUpdate,
        description: data.description,
        signUpUrl: data.signUpUrl || null,
        fileLinks: wordpressFileLinks.length > 0 ? wordpressFileLinks : null,
      });
    } else {
      // ===== AIRTABLE DATABASE PATH (Legacy) =====
      // Create a record in Airtable
      await base(websiteUpdatesTable).create([
        {
          fields: {
            Name: data.name,
            Email: data.email,
            Urgent: urgentValue, // Fixed: Pass string instead of boolean
            'Page to Update': data.pageToUpdate,
            Description: data.description,
            'Sign-Up URL': data.signUpUrl || '',
            'File Links': fileLinksString,
          },
        },
      ]);
    }

    // Send confirmation email via Microsoft Graph
    const client = getGraphClient();
    const fromAddress = process.env.MAILBOX_TO_SEND_FROM || '';
    const subject = 'Saint Helen Website Update Request Received';
    const htmlContent = `
      <p>Hello ${data.name},</p>
      <p>We received your website update request:</p>
      <ul>
        <li><strong>Urgent:</strong> ${data.urgent ? 'Yes' : 'No'}</li>
        <li><strong>Page to Update:</strong> ${data.pageToUpdate}</li>
        <li><strong>Description:</strong> ${data.description}</li>
        <li><strong>Sign-Up URL:</strong> ${data.signUpUrl || 'N/A'}</li>
        <li><strong>File Links:</strong><br/>${fileLinksString.replace(/\n/g, '<br/>')}</li>
      </ul>
      <p>We will review it soon. Thank you!</p>
      <p>Saint Helen Communications</p>
    `;

    await client.api(`/users/${fromAddress}/sendMail`).post({
      message: {
        subject,
        body: { contentType: 'html', content: htmlContent },
        from: { emailAddress: { address: fromAddress } },
        toRecipients: [
          { emailAddress: { address: data.email } },
        ],
      },
      saveToSentItems: true,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Website Updates submission error:', error);
    return new NextResponse(
      JSON.stringify({ error: error.message || 'Submission failed' }),
      { status: 500 }
    );
  }
}