// app/api/website-updates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { ClientSecretCredential } from '@azure/identity';

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
    const data = (await request.json()) as WebsiteUpdatesFormData;
    console.log('Website Updates form submission:', data);

    // Build the fileLinks string for Airtable
    const fileLinksString = data.fileLinks?.length ? data.fileLinks.join('\n') : '';

    // Fix: Convert the urgent boolean to a proper Yes/No string for Airtable
    const urgentValue = data.urgent ? 'Yes' : 'No';

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