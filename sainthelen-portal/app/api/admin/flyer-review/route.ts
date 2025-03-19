// app/api/flyer-review/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { ClientSecretCredential } from '@azure/identity';

type FlyerReviewFormData = {
  name: string;
  email: string;
  ministry?: string;
  eventName: string;
  eventDate?: string;
  audience: string;
  purpose: string;
  feedbackNeeded: string;
  urgency: string;
  fileLinks: string[];
};

// Configure Airtable
const personalToken = process.env.AIRTABLE_PERSONAL_TOKEN || '';
const baseId = process.env.AIRTABLE_BASE_ID || '';
const flyerReviewTable = process.env.FLYER_REVIEW_TABLE_NAME || 'Flyer Reviews';

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
    const data = (await request.json()) as FlyerReviewFormData;
    console.log('Flyer review submission:', data);

    // Format file links for Airtable
    const fileLinksString = data.fileLinks.join('\n');

    // Create record in Airtable
    const record = await base(flyerReviewTable).create([
      {
        fields: {
          Name: data.name,
          Email: data.email,
          Ministry: data.ministry || '',
          'Event Name': data.eventName,
          'Event Date': data.eventDate || '',
          'Target Audience': data.audience,
          'Purpose': data.purpose,
          'Feedback Needed': data.feedbackNeeded,
          'Urgency': data.urgency,
          'File Links': fileLinksString,
          'Status': 'Pending',
        },
      },
    ]);

    console.log('Airtable record created:', record);

    // Send confirmation email via Microsoft Graph
    const client = getGraphClient();
    const fromAddress = process.env.MAILBOX_TO_SEND_FROM || '';
    const subject = 'Saint Helen Flyer Review Request Received';
    
    const htmlContent = `
      <p>Hello ${data.name},</p>
      <p>We received your flyer review request for <strong>${data.eventName}</strong>.</p>
      <p><strong>Review details:</strong></p>
      <ul>
        <li><strong>Ministry:</strong> ${data.ministry || 'N/A'}</li>
        <li><strong>Event Date:</strong> ${data.eventDate || 'N/A'}</li>
        <li><strong>Target Audience:</strong> ${data.audience}</li>
        <li><strong>Purpose:</strong> ${data.purpose}</li>
        <li><strong>Review Urgency:</strong> ${data.urgency === 'urgent' ? 'Urgent (1-2 business days)' : 'Standard (3-5 business days)'}</li>
      </ul>
      
      <p>Our team will review your flyer and provide feedback based on the following needs:</p>
      <p style="background-color: #f3f4f6; padding: 12px; border-radius: 4px; font-style: italic;">${data.feedbackNeeded}</p>
      
      <p>You can expect to hear back from us within ${data.urgency === 'urgent' ? '1-2' : '3-5'} business days. If you need to make changes to your request or have questions, please contact us at communications@sainthelen.org.</p>
      
      <p>Thank you for allowing us to assist with your communications needs!</p>
      <p>Saint Helen Communications Team</p>
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
    console.error('Flyer review submission error:', err);
    return new NextResponse(
      JSON.stringify({ error: err.message || 'Submission failed' }),
      { status: 500 }
    );
  }
}