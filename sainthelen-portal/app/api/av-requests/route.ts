// app/api/av-requests/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { ClientSecretCredential } from '@azure/identity';

type DateTimeEntry = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
};

type AVRequestFormData = {
  name: string;
  email: string;
  ministry?: string;
  eventName: string;
  dateTimeEntries: DateTimeEntry[];
  description: string;
  location: string;
  needsLivestream: boolean;
  avNeeds: string;
  expectedAttendees?: string;
  additionalNotes?: string;
  fileLinks?: string[];
};

// Configure Airtable
const personalToken = process.env.AIRTABLE_PERSONAL_TOKEN || '';
const baseId = process.env.AIRTABLE_BASE_ID || '';
const avRequestsTable = process.env.AV_REQUESTS_TABLE_NAME || 'AV Requests';

if (!personalToken) {
  console.error('No AIRTABLE_PERSONAL_TOKEN found in environment!');
}
if (!baseId) {
  console.error('No AIRTABLE_BASE_ID found in environment!');
}

const base = new Airtable({ apiKey: personalToken }).base(baseId);

// Setup Microsoft Graph for email notifications
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
    const data = (await request.json()) as AVRequestFormData;
    console.log('A/V request submission:', data);

    // Format date/time entries for Airtable
    const dateTimeEntriesFormatted = data.dateTimeEntries.map((entry, index) => {
      return `Date ${index + 1}: ${entry.date}, ${entry.startTime} - ${entry.endTime}`;
    }).join('\n');

    const fileLinksString = data.fileLinks?.length ? data.fileLinks.join('\n') : '';

    // Create record in Airtable
    const record = await base(avRequestsTable).create([
      {
        fields: {
          Name: data.name,
          Email: data.email,
          Ministry: data.ministry || '',
          'Event Name': data.eventName,
          'Event Dates and Times': dateTimeEntriesFormatted,
          'Description': data.description,
          'Location': data.location,
          'Needs Livestream': data.needsLivestream ? 'Yes' : 'No',
          'A/V Needs': data.avNeeds,
          'Expected Attendees': data.expectedAttendees || '',
          'Additional Notes': data.additionalNotes || '',
          'File Links': fileLinksString,
        },
      },
    ]);

    console.log('Airtable record created:', record);

    // Send confirmation email via Microsoft Graph
    const client = getGraphClient();
    const fromAddress = process.env.MAILBOX_TO_SEND_FROM || '';
    const subject = 'Saint Helen A/V Request Received';
    
    // Create HTML for dates/times
    const datesTimesHtml = data.dateTimeEntries.map((entry, index) => {
      return `<li><strong>Date/Time ${index + 1}:</strong> ${entry.date}, ${entry.startTime} - ${entry.endTime}</li>`;
    }).join('');

    const htmlContent = `
      <p>Hello ${data.name},</p>
      <p>We received your A/V request for the following event:</p>
      <ul>
        <li><strong>Event Name:</strong> ${data.eventName}</li>
        <li><strong>Ministry:</strong> ${data.ministry || 'N/A'}</li>
        <li><strong>Location:</strong> ${data.location}</li>
        <li><strong>Event Dates/Times:</strong></li>
        <ul>
          ${datesTimesHtml}
        </ul>
        <li><strong>Livestream Requested:</strong> ${data.needsLivestream ? 'Yes' : 'No'}</li>
        <li><strong>Expected Attendees:</strong> ${data.expectedAttendees || 'N/A'}</li>
        <li><strong>File Links:</strong><br/>${fileLinksString.replace(/\n/g, '<br/>')}</li>
      </ul>
      <p>Our A/V team will review your request and contact you within 2-3 business days to confirm the details and discuss any additional requirements.</p>
      <p>Thank you!</p>
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
  } catch (err: any) {
    console.error('A/V request submission error:', err);
    return new NextResponse(
      JSON.stringify({ error: err.message || 'Submission failed' }),
      { status: 500 }
    );
  }
}