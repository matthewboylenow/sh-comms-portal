// app/api/admin/summarizeItems/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';

import Anthropic from '@anthropic-ai/sdk';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { ClientSecretCredential } from '@azure/identity';

/**
 * We assume all items are in the same table "Announcements" or maybe we fetch from 3 tables?
 * For simplicity, let's assume they're all in "Announcements" for now.
 * If you want to handle 3 different tables, you'd need logic to see which table each ID belongs to
 * or store table info in local state.
 */
const AIRTABLE_PERSONAL_TOKEN = process.env.AIRTABLE_PERSONAL_TOKEN || '';
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || '';
const ANNOUNCEMENTS_TABLE = process.env.ANNOUNCEMENTS_TABLE_NAME || 'Announcements';

const base = new Airtable({ apiKey: AIRTABLE_PERSONAL_TOKEN }).base(AIRTABLE_BASE_ID);

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

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Your brand pre-prompt
const brandPrePrompt = `
You are a communications assistant for Saint Helen Parish...
[Etc.]
`.trim();

export async function POST(request: NextRequest) {
  try {
    const { recordIds } = await request.json();
    if (!Array.isArray(recordIds) || !recordIds.length) {
      return NextResponse.json({ success: false, error: 'No recordIds provided' }, { status: 400 });
    }

    // 1) Fetch each record from Airtable (Announcements table).
    //    If you need to handle multiple tables, you'd store tableName in the body or do advanced logic.
    const fetchedRecords = [];
    for (const id of recordIds) {
      try {
        const rec = await base(ANNOUNCEMENTS_TABLE).find(id);
        fetchedRecords.push(rec);
      } catch (err) {
        console.error('Error fetching record with id:', id, err);
      }
    }

    if (!fetchedRecords.length) {
      return NextResponse.json({
        success: true,
        message: 'No valid records found in Airtable for those IDs',
      });
    }

    // 2) Build the text to send to Claude
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

    // 3) Call Anthropic
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
          'anthropic-version': '2023-10-01',
        },
      }
    );

    let summaryText: string;
    if (typeof response.content === 'string') {
      summaryText = response.content;
    } else {
      summaryText = JSON.stringify(response.content, null, 2);
    }

    // 4) Email via Microsoft Graph
    const client = getGraphClient();
    const fromAddress = process.env.MAILBOX_TO_SEND_FROM || '';
    const toAddress = 'mboyle@sainthelen.org'; // or from env

    const subject = 'Manual Summarize - Selected Items';
    const htmlContent = `
      <p>Hello,</p>
      <p>Here is your manual summary from Claude:</p>
      <div style="white-space:pre-wrap; font-family:Arial, sans-serif;">
        ${summaryText}
      </div>
      <p>Thank you!</p>
    `;

    await client.api(`/users/${fromAddress}/sendMail`).post({
      message: {
        subject,
        body: { contentType: 'html', content: htmlContent },
        from: { emailAddress: { address: fromAddress } },
        toRecipients: [{ emailAddress: { address: toAddress } }],
      },
      saveToSentItems: true,
    });

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
