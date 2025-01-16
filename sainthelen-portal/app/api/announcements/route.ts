// app/api/announcements/route.ts

import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable'; // npm install airtable
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { ClientSecretCredential } from '@azure/identity';

type AnnouncementFormData = {
  name: string;
  email: string;
  ministry?: string;
  eventDate?: string;
  eventTime?: string;
  promotionStart?: string;
  platforms?: string[]; // e.g. ["Email Blast", "Bulletin", "Church Screens"]
  announcementBody: string;
  addToCalendar?: boolean;
  fileLinks?: string[];
};

// 1) Configure Airtable using personal token
const personalToken = process.env.AIRTABLE_PERSONAL_TOKEN || '';
const baseId = process.env.AIRTABLE_BASE_ID || '';
const announcementsTable = process.env.ANNOUNCEMENTS_TABLE_NAME || 'Announcements';

if (!personalToken) {
  console.error('No AIRTABLE_PERSONAL_TOKEN found in environment!');
}
if (!baseId) {
  console.error('No AIRTABLE_BASE_ID found in environment!');
}

const base = new Airtable({ apiKey: personalToken }).base(baseId);

// 2) Setup Microsoft Graph
function getGraphClient() {
  const tenantId = process.env.AZURE_AD_TENANT_ID || '';
  const clientId = process.env.AZURE_AD_CLIENT_ID || '';
  const clientSecret = process.env.AZURE_AD_CLIENT_SECRET || '';

  const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes: ['https://graph.microsoft.com/.default'],
  });

  return Client.initWithMiddleware({
    debugLogging: false,
    authProvider,
  });
}

export async function POST(request: NextRequest) {
  try {
    const data = (await request.json()) as AnnouncementFormData;
    console.log('Announcements form submission:', data);

    // 1) Write to Airtable
    const fileLinksString = data.fileLinks?.length ? data.fileLinks.join('\n') : '';
    const addToCalendarValue = data.addToCalendar ? 'Yes' : 'No';

    // Double-check the base and table variables are not empty
    if (!personalToken || !baseId) {
      throw new Error('Airtable token or base ID is missing/invalid.');
    }

    const record = await base(announcementsTable).create([
      {
        fields: {
          Name: data.name,
          Email: data.email,
          Ministry: data.ministry || '',
          'Date of Event': data.eventDate || '',
          'Time of Event': data.eventTime || '',
          'Promotion Start Date': data.promotionStart || '',
          Platforms: data.platforms || [],
          'Announcement Body': data.announcementBody,
          'Add to Events Calendar': addToCalendarValue,
          'File Links': fileLinksString,
        },
      },
    ]);

    console.log('Airtable record created:', record);

    // 2) Send confirmation email via Microsoft Graph
    const client = getGraphClient();
    const fromAddress = process.env.MAILBOX_TO_SEND_FROM || '';
    const subject = 'Saint Helen Announcement Received';
    const htmlContent = `
      <p>Hello ${data.name},</p>
      <p>We received your announcement request:</p>
      <ul>
        <li><strong>Ministry:</strong> ${data.ministry || 'N/A'}</li>
        <li><strong>Event Date:</strong> ${data.eventDate || 'N/A'} ${data.eventTime || ''}</li>
        <li><strong>Promotion Start:</strong> ${data.promotionStart || 'N/A'}</li>
        <li><strong>Add to Calendar:</strong> ${addToCalendarValue}</li>
        <li><strong>File Links:</strong><br/>${fileLinksString.replace(/\n/g, '<br/>')}</li>
      </ul>
      <p>We will review it soon. Thank you!</p>
      <p>Saint Helen Communications</p>
    `;

    const sendMailResponse = await client.api(`/users/${fromAddress}/sendMail`).post({
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

    console.log('Email sent via MS Graph:', sendMailResponse);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Announcements submission error:', error);
    return new NextResponse(
      JSON.stringify({ error: error.message || 'Submission failed' }),
      { status: 500 }
    );
  }
}