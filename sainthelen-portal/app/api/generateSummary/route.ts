import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';

import Anthropic from '@anthropic-ai/sdk';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { ClientSecretCredential } from '@azure/identity';

//
// 1) Configure Airtable
//
const AIRTABLE_PERSONAL_TOKEN = process.env.AIRTABLE_PERSONAL_TOKEN || '';
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || '';
const ANNOUNCEMENTS_TABLE_NAME = process.env.ANNOUNCEMENTS_TABLE_NAME || 'Announcements';

const base = new Airtable({ apiKey: AIRTABLE_PERSONAL_TOKEN }).base(AIRTABLE_BASE_ID);

//
// 2) Configure MS Graph
//
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

//
// 3) The brand pre-prompt (will be merged into one 'user' message for the chat API).
//
const brandPrePrompt = `
You are a communications assistant for Saint Helen Parish, a modern Catholic church known for its warm, inclusive, authentic, and uplifting brand style.

Here’s how you must craft announcements:

1) Brand Tone & Style:
   - Warm, inviting, inclusive
   - Authentic and human
   - Encouraging, uplifting
   - Clear and detailed

2) Output Requirements:
   For each announcement, provide this structure exactly:

   [Ministry]
   [Date] [Time]
   Email Blast Copy:
   Bulletin Copy:
   Screens Copy:
   [Attached Files]

   - Email Blast (max ~65-70 words): date/time/venue + CTA link if any
   - Bulletin Copy (max ~50 words): same essential info, more concise
   - Screens Copy (very concise): 12-14s on screen, minimal text
   - If attached files exist, list them under [Attached Files]

3) Additional:
   - Do not exceed word limits.
   - Skip extraneous disclaimers or text.
   - Always maintain warm, inclusive, encouraging tone.
`.trim();

export async function POST(request: NextRequest) {
  try {
    // (A) Fetch Announcements from Airtable
    const records = await base(ANNOUNCEMENTS_TABLE_NAME)
      .select({ maxRecords: 10 })  // example limit
      .all();

    if (!records.length) {
      return NextResponse.json({ success: true, message: 'No announcements found' });
    }

    // Build the announcements text
    let announcementsText = `\nHere are the announcements:\n\n`;
    records.forEach((r, idx) => {
      const fields = r.fields as Record<string, any>;
      announcementsText += `Announcement #${idx + 1}:\n`;
      announcementsText += `Ministry: ${fields.Ministry || 'N/A'}\n`;
      announcementsText += `Date: ${fields['Date of Event'] || 'N/A'}\n`;
      announcementsText += `Time: ${fields['Time of Event'] || 'N/A'}\n`;
      announcementsText += `Announcement Body: ${fields['Announcement Body'] || ''}\n`;
      announcementsText += `Files: ${fields['File Links'] || 'none'}\n`;
      announcementsText += `---\n`;
    });

    // Combine brand pre-prompt + announcements text
    const combinedUserPrompt = `
${brandPrePrompt}

Now, please transform these announcements into the required format:

${announcementsText}
`.trim();

    // (B) Call Anthropic's Claude 3.5 Sonnet
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });

    // Use messages.create with "max_tokens" (NOT max_tokens_to_sample)
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-v2@20241022',
      // We use max_tokens, which the chat-based messages API expects
      max_tokens: 1024,
      // We'll do a single "user" role message that includes both your pre-prompt
      // instructions and the announcements data
      messages: [
        {
          role: 'user',
          content: combinedUserPrompt,
        },
      ],
    });

    // The result is in 'response.content'
    const summaryText = response.content;

    // (C) Send an email via Microsoft Graph
    const client = getGraphClient();
    const fromAddress = process.env.MAILBOX_TO_SEND_FROM || '';
    const toAddress = 'mboyle@sainthelen.org'; // or from an env var

    const subject = 'Weekly Saint Helen Announcements Summary';
    const htmlContent = `
      <p>Hello,</p>
      <p>Here is the weekly summary from Claude:</p>
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

    // Return success
    return NextResponse.json({
      success: true,
      summaryText,
      message: 'Email sent with Claude summary!',
    });
  } catch (error: any) {
    console.error('Error in generateSummary route:', error);
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to generate summary',
      }),
      { status: 500 }
    );
  }
}
