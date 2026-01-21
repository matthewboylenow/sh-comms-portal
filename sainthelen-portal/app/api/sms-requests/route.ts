// app/api/sms-requests/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { ClientSecretCredential } from '@azure/identity';

// New Neon database imports
import { useNeonDatabase } from '../../lib/db';
import * as smsRequestsService from '../../lib/db/services/sms-requests';

type SMSRequestFormData = {
  name: string;
  email: string;
  ministry?: string;
  smsMessage: string; // up to 160 chars
  requestedDate?: string;
  additionalInfo?: string;
  fileLinks?: string[];
};

const personalToken = process.env.AIRTABLE_PERSONAL_TOKEN || '';
const baseId = process.env.AIRTABLE_BASE_ID || '';
const smsRequestsTable = process.env.SMS_REQUESTS_TABLE_NAME || 'SMS Requests';

const base = new Airtable({ apiKey: personalToken }).base(baseId);

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

export async function POST(request: NextRequest) {
  try {
    const data = (await request.json()) as SMSRequestFormData;
    console.log('SMS Requests form submission:', data);

    const fileLinksString = data.fileLinks?.length ? data.fileLinks.join('\n') : '';

    const useNeon = useNeonDatabase();

    if (useNeon) {
      // ===== NEON DATABASE PATH =====
      await smsRequestsService.createSMSRequest({
        name: data.name,
        email: data.email,
        ministry: data.ministry || null,
        smsMessage: data.smsMessage,
        requestedDate: data.requestedDate || null,
        additionalInfo: data.additionalInfo || null,
        fileLinks: data.fileLinks?.length ? data.fileLinks : null,
      });
    } else {
      // ===== AIRTABLE DATABASE PATH (Legacy) =====
      // Create record in Airtable
      await base(smsRequestsTable).create([
        {
          fields: {
            Name: data.name,
            Email: data.email,
            Ministry: data.ministry || '',
            'SMS Message': data.smsMessage,
            'Requested Date': data.requestedDate || '',
            'Additional Info': data.additionalInfo || '',
            'File Links': fileLinksString,
          },
        },
      ]);
    }

    // Send confirmation email via Microsoft Graph
    const client = getGraphClient();
    const fromAddress = process.env.MAILBOX_TO_SEND_FROM || '';
    const subject = 'Saint Helen SMS Request Received';
    const htmlContent = `
      <p>Hello ${data.name},</p>
      <p>We received your SMS request:</p>
      <ul>
        <li><strong>Ministry:</strong> ${data.ministry || 'N/A'}</li>
        <li><strong>SMS Message:</strong> ${data.smsMessage}</li>
        <li><strong>Requested Date:</strong> ${data.requestedDate || 'N/A'}</li>
        <li><strong>Additional Info:</strong> ${data.additionalInfo || 'N/A'}</li>
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
    console.error('SMS Requests submission error:', error);
    return new NextResponse(
      JSON.stringify({ error: error.message || 'Submission failed' }),
      { status: 500 }
    );
  }
}