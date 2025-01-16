// app/api/admin/summarizeItems/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';
import Anthropic from '@anthropic-ai/sdk';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { ClientSecretCredential } from '@azure/identity';

/*
  We assume these items live in the Announcements table only.
  If you want multiple tables, you must store table info or have logic 
  to fetch from the correct table. 
*/
const AIRTABLE_PERSONAL_TOKEN = process.env.AIRTABLE_PERSONAL_TOKEN || '';
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || '';
const ANNOUNCEMENTS_TABLE = process.env.ANNOUNCEMENTS_TABLE_NAME || 'Announcements';

const base = new Airtable({ apiKey: AIRTABLE_PERSONAL_TOKEN }).base(AIRTABLE_BASE_ID);

function getGraphClient() {
  const tenantId = process.env.AZURE_AD_TENANT_ID || '';
  const clientId = process.env.AZURE_AD_CLIENT_ID || '';
  const clientSecret = process.env.AZURE_AD_CLIENT_SECRET || '';

  console.log('>>> SummarizeItems Graph Creds:', {
    tenantId,
    clientId,
    hasClientSecret: !!clientSecret,
  });

  const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes: ['https://graph.microsoft.com/.default'],
  });

  return Client.initWithMiddleware({ authProvider });
}

// Use the Anthropic client normally
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Your brand pre-prompt or instructions
const brandPrePrompt = `
You are a communications assistant for Saint Helen Parish...
[Your brand instructions here]
`.trim();

export async function POST(request: NextRequest) {
  console.log('>>> summarizeItems: POST route called');
  try {
    // 1) Parse the body
    const body = await request.json();
    const recordIds = body.recordIds as string[];
    console.log('Received recordIds:', recordIds);

    if (!Array.isArray(recordIds) || !recordIds.length) {
      console.log('No recordIds provided in request body');
      return NextResponse.json(
        { success: false, error: 'No recordIds provided' },
        { status: 400 }
      );
    }

    // 2) For each recordId, fetch from Announcements table
    const fetchedRecords = [];
    for (const id of recordIds) {
      try {
        console.log('Fetching record from Airtable ID:', id);
        const rec = await base(ANNOUNCEMENTS_TABLE).find(id);
        console.log('Found record with fields:', rec.fields);
        fetchedRecords.push(rec);
      } catch (err: any) {
        console.error('Error fetching record', id, err);
      }
    }

    console.log('Total valid records fetched:', fetchedRecords.length);

    if (!fetchedRecords.length) {
      console.log('No valid records found in Airtable for those IDs');
      return NextResponse.json({
        success: true,
        message: 'No valid records found in Airtable for those IDs',
      });
    }

    // 3) Build text for Claude
    let announcementsText = `\nHere are the user-selected announcements:\n\n`;
    fetchedRecords.forEach((r, idx) => {
      const f = r.fields as Record<string, any>;
      announcementsText += `Announcement #${idx + 1}:\n`;
      announcementsText += `Ministry: ${f.Ministry || 'N/A'}\n`;
      announcementsText += `Date: ${f['Date of Event'] || 'N/A'}\n`;
      announcementsText += `Time: ${f['Time of Event'] || 'N/A'}\n`;
      announcementsText += `Announcement Body: ${f['Announcement Body'] || ''}\n`;
      announcementsText += `Files: ${f['File Links'] || 'none'}\n`;
      announcementsText += `---\n`;
    });

    const combinedUserPrompt = `
${brandPrePrompt}

Now, please transform these announcements into the required format:

${announcementsText}
`.trim();

    // 4) Call Anthropic with version=2023-06-01
    console.log('Sending request to Anthropic with model=claude-3-5-sonnet-20241022...');
    const response = await anthropic.messages.create(
      {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: combinedUserPrompt,
          },
        ],
      },
      {
        headers: {
          // The version recommended by Anthropic if 2023-10-01 is invalid
          'anthropic-version': '2023-06-01',
        },
      }
    );
    console.log('Anthropic response object keys:', Object.keys(response));

    let summaryText: string;
    if (typeof response.content === 'string') {
      summaryText = response.content;
    } else {
      summaryText = JSON.stringify(response.content, null, 2);
    }
    console.log('Claude summary (first 200 chars):', summaryText.slice(0, 200));

    // 5) Send Email via Microsoft Graph
    console.log('Initializing MS Graph client...');
    const client = getGraphClient();
    const fromAddress = process.env.MAILBOX_TO_SEND_FROM || '';
    const toAddress = 'mboyle@sainthelen.org';

    console.log('Sending email from:', fromAddress, 'to:', toAddress);
    const subject = 'Manual Summarize - Selected Items';
    const htmlContent = `
      <p>Hello,</p>
      <p>Here is your manual summary from Claude:</p>
      <div style="white-space:pre-wrap; font-family:Arial, sans-serif;">
        ${summaryText}
      </div>
      <p>Thank you!</p>
    `;

    const sendMailResponse = await client.api(`/users/${fromAddress}/sendMail`).post({
      message: {
        subject,
        body: { contentType: 'html', content: htmlContent },
        from: { emailAddress: { address: fromAddress } },
        toRecipients: [{ emailAddress: { address: toAddress } }],
      },
      saveToSentItems: true,
    });
    console.log('Graph sendMail response:', JSON.stringify(sendMailResponse, null, 2));

    return NextResponse.json({
      success: true,
      summaryText,
      message: 'Manual Summarize Completed',
    });
  } catch (error: any) {
    console.error('Error in summarizeItems route:', error);
    return new NextResponse(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500 }
    );
  }
}
