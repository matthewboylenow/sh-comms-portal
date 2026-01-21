// app/api/graphic-design/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { ClientSecretCredential } from '@azure/identity';

// New Neon database imports
import { useNeonDatabase } from '../../lib/db';
import * as graphicDesignService from '../../lib/db/services/graphic-design';

type GraphicDesignFormData = {
  name: string;
  email: string;
  ministry?: string;
  projectType: string;
  projectDescription: string;
  projectRequirements?: string;
  deadline: string;
  deadlineTime?: string;
  dimensions?: string;
  priority: 'Standard' | 'Urgent';
  fileLinks: string[];
};

// Configure Airtable
const personalToken = process.env.AIRTABLE_PERSONAL_TOKEN || '';
const baseId = process.env.AIRTABLE_BASE_ID || '';
const graphicDesignTable = process.env.GRAPHIC_DESIGN_TABLE_NAME || 'Graphic Design Requests';

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
    const data = (await request.json()) as GraphicDesignFormData;
    console.log('Graphic design request submission:', data);

    // Format file links for Airtable
    const fileLinksString = data.fileLinks.join('\n');

    // Prepare the fields object to match exactly what's in Airtable based on the screenshot
    // ONLY include fields we can confirm exist
    const fields = {
      "Name": data.name,
      "Email": data.email,
      "Ministry": data.ministry || '',
      "Project Type": data.projectType,
      "Project Description": data.projectDescription,
      // removed "Project Requirements" as it's not in the screenshot
      "Deadline": data.deadline || '',
      // Store both deadline and time in the same field if needed
      "Priority": data.priority,
      "Required Size/Dimensions": data.dimensions || '',
      "File Links": fileLinksString,
      "Status": "New"
    };

    console.log('Creating record with fields:', fields);

    const useNeon = useNeonDatabase();

    if (useNeon) {
      // ===== NEON DATABASE PATH =====
      await graphicDesignService.createGraphicDesignRequest({
        name: data.name,
        email: data.email,
        ministry: data.ministry || null,
        projectType: data.projectType,
        projectDescription: data.projectDescription,
        deadline: data.deadline || null,
        priority: data.priority,
        requiredDimensions: data.dimensions || null,
        fileLinks: data.fileLinks.length > 0 ? data.fileLinks : null,
        status: 'New',
      });
      console.log('Neon record created successfully');
    } else {
      // ===== AIRTABLE DATABASE PATH (Legacy) =====
      // Create record in Airtable
      try {
        const records = await base(graphicDesignTable).create([{ fields }]);
        console.log('Airtable record created successfully:', records);
      } catch (airtableError: any) {
        console.error('Airtable error details:', airtableError);
        throw new Error(`Airtable error: ${airtableError.message || 'Unknown error'}`);
      }
    }

    // Send confirmation email via Microsoft Graph
    try {
      const client = getGraphClient();
      const fromAddress = process.env.MAILBOX_TO_SEND_FROM || '';
      const subject = 'Saint Helen Graphic Design Request Received';
      
      const htmlContent = `
        <p>Hello ${data.name},</p>
        <p>We received your graphic design request for <strong>${data.projectType}</strong>.</p>
        <p><strong>Design details:</strong></p>
        <ul>
          <li><strong>Ministry:</strong> ${data.ministry || 'N/A'}</li>
          <li><strong>Project Type:</strong> ${data.projectType}</li>
          <li><strong>Deadline:</strong> ${data.deadline}${data.deadlineTime ? ' at ' + data.deadlineTime : ''}</li>
          <li><strong>Priority:</strong> ${data.priority}</li>
          <li><strong>Dimensions:</strong> ${data.dimensions || 'N/A'}</li>
        </ul>
        
        <p>Our graphic design team will review your request and begin working on it soon. You can expect the first draft according to the following timeline:</p>
        <p><strong>${data.priority === 'Urgent' ? '3-5 business days' : '7-10 business days'}</strong></p>
        
        <p>If you need to make changes to your request or have questions, please contact us at communications@sainthelen.org.</p>
        
        <p>Thank you for using our graphic design services!</p>
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
    } catch (emailErr) {
      console.error('Failed to send confirmation email:', emailErr);
      // Continue even if email fails - the record was created
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Graphic design submission error:', err);
    return new NextResponse(
      JSON.stringify({ error: err.message || 'Submission failed' }),
      { status: 500 }
    );
  }
}