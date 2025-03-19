// app/api/graphic-design/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { ClientSecretCredential } from '@azure/identity';

type GraphicDesignFormData = {
  name: string;
  email: string;
  ministry?: string;
  projectType: string;
  projectDescription: string;
  deadline?: string;
  priority: string;
  sizeDimensions?: string;
  brandColors?: string[];
  fileLinks?: string[];
  dependencies?: string[];
};

const personalToken = process.env.AIRTABLE_PERSONAL_TOKEN || '';
const baseId = process.env.AIRTABLE_BASE_ID || '';
const graphicDesignTable = process.env.GRAPHIC_DESIGN_TABLE_NAME || 'Graphic Design Requests';

const base = new Airtable({ apiKey: personalToken }).base(baseId);

// Microsoft Graph client for emails
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
    const data = (await request.json()) as GraphicDesignFormData;
    console.log('Graphic Design Request submission:', data);

    // Format file links and other arrays for Airtable
    const fileLinksString = data.fileLinks?.length ? data.fileLinks.join('\n') : '';
    
    // Create record in Airtable
    const record = await base(graphicDesignTable).create([
      {
        fields: {
          Name: data.name,
          Email: data.email,
          Ministry: data.ministry || '',
          'Project Type': data.projectType,
          'Project Description': data.projectDescription,
          Deadline: data.deadline || '',
          Priority: data.priority,
          'Required Size/Dimensions': data.sizeDimensions || '',
          'Brand Colors Required': data.brandColors || [],
          'File Links': fileLinksString,
          Status: 'Pending', // Default status for new requests
          Completed: false,
        },
      },
    ]);

    console.log('Airtable record created:', record);

    // Send confirmation email via Microsoft Graph
    const client = getGraphClient();
    const fromAddress = process.env.MAILBOX_TO_SEND_FROM || '';
    const subject = 'Saint Helen Graphic Design Request Received';
    const htmlContent = `
      <p>Hello ${data.name},</p>
      <p>We received your graphic design request with the following details:</p>
      <ul>
        <li><strong>Project Type:</strong> ${data.projectType}</li>
        <li><strong>Priority:</strong> ${data.priority}</li>
        <li><strong>Deadline:</strong> ${data.deadline || 'Not specified'}</li>
        <li><strong>Description:</strong> ${data.projectDescription}</li>
        <li><strong>Ministry:</strong> ${data.ministry || 'N/A'}</li>
      </ul>
      <p>Our communications team will review your request and begin working on it soon. Current status: <strong>Pending</strong></p>
      <p>Thank you!</p>
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
    console.error('Graphic Design Request submission error:', err);
    return NextResponse.json(
      { error: err.message || 'Submission failed' },
      { status: 500 }
    );
  }
}