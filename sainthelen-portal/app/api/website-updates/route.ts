// app/api/website-updates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { ClientSecretCredential } from '@azure/identity';

// New Neon database imports
import { useNeonDatabase } from '../../lib/db';
import * as websiteUpdatesService from '../../lib/db/services/website-updates';
import { sendEmailViaGraph, getAdminNotificationEmail } from '../../lib/email';

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

    // Urgent requests: alert the admin right away with a flagged,
    // high-importance email so it doesn't sit unseen in the queue.
    if (data.urgent) {
      try {
        await sendEmailViaGraph({
          to: getAdminNotificationEmail(),
          subject: `🚨 URGENT website update: ${data.pageToUpdate} (from ${data.name})`,
          importance: 'high',
          flag: true,
          htmlContent: `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"></head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: #b91c1c; padding: 20px 24px; border-radius: 12px 12px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 20px;">Urgent Website Update Request</h1>
              </div>
              <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
                <p style="margin-top: 0;">A website update was just submitted and marked <strong>urgent (needed within 24 hours)</strong>.</p>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <tr><td style="padding: 6px 8px 6px 0; color: #6b7280; white-space: nowrap;">Submitted by</td><td style="padding: 6px 0;"><strong>${data.name}</strong> (${data.email})</td></tr>
                  <tr><td style="padding: 6px 8px 6px 0; color: #6b7280; white-space: nowrap;">Page</td><td style="padding: 6px 0;"><strong>${data.pageToUpdate}</strong></td></tr>
                  <tr><td style="padding: 6px 8px 6px 0; color: #6b7280; vertical-align: top;">Description</td><td style="padding: 6px 0; white-space: pre-wrap;">${data.description}</td></tr>
                  ${data.signUpUrl ? `<tr><td style="padding: 6px 8px 6px 0; color: #6b7280;">Sign-up URL</td><td style="padding: 6px 0;">${data.signUpUrl}</td></tr>` : ''}
                  ${wordpressFileLinks.length ? `<tr><td style="padding: 6px 8px 6px 0; color: #6b7280;">Files</td><td style="padding: 6px 0;">${wordpressFileLinks.map((l) => `<a href="${l}">${l.split('/').pop()}</a>`).join('<br/>')}</td></tr>` : ''}
                </table>
                <div style="margin-top: 20px;">
                  <a href="${process.env.NEXTAUTH_URL || 'https://comms.sainthelen.org'}/admin" style="display: inline-block; padding: 10px 20px; background-color: #1f346d; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Open Admin Dashboard</a>
                </div>
              </div>
            </body>
            </html>
          `,
        });
      } catch (alertErr) {
        // Never fail the submission because the admin alert didn't send
        console.error('Failed to send urgent website update alert:', alertErr);
      }
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