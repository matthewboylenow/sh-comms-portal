import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';

import Anthropic from '@anthropic-ai/sdk';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { ClientSecretCredential } from '@azure/identity';

//
// 1) Environment Variables
//
const AIRTABLE_PERSONAL_TOKEN = process.env.AIRTABLE_PERSONAL_TOKEN || '';
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || '';
const ANNOUNCEMENTS_TABLE = process.env.ANNOUNCEMENTS_TABLE_NAME || 'Announcements';

//
// 2) Configure Airtable
//
const base = new Airtable({ apiKey: AIRTABLE_PERSONAL_TOKEN }).base(AIRTABLE_BASE_ID);

//
// 3) Configure MS Graph
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
// 4) Configure Anthropic WITHOUT 'version' in constructor
//    We'll pass the 'anthropic-version' header in each request instead.
//
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

//
// 5) The brand pre-prompt
//
const brandPrePrompt = `
You are a communications assistant for Saint Helen Parish, a modern Catholic church known for its warm, inclusive, authentic, and uplifting brand style.

Here’s how you must craft announcements:

1. Brand Tone & Style:
   - Warm, inviting, inclusive
   - Authentic and human
   - Encouraging, uplifting
   - Clear and detailed

2. Output Requirements:
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

3. Additional:
   - Do not exceed word limits.
   - Skip extraneous disclaimers or text.
   - Always maintain a warm, inclusive, encouraging tone.
`.trim();

//
// 6) Helper to parse "MM/DD/YY"
//
function parseMmDdYy(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const [mm, dd, yy] = parts.map((p) => p.trim());
  let fullYear = parseInt(yy, 10);
  if (fullYear < 100) {
    fullYear = 2000 + fullYear;
  }
  const month = parseInt(mm, 10) - 1; 
  const day = parseInt(dd, 10);

  const dateObj = new Date(fullYear, month, day);
  if (isNaN(dateObj.getTime())) {
    return null;
  }
  return dateObj;
}

//
// 7) Determine this week's Tuesday + Sunday
//
function getThisTuesdayAndSunday(): { tuesday: Date; sunday: Date } {
  const now = new Date();
  let day = now.getDay(); // 0=Sun,1=Mon,2=Tue,...

  // find next Tuesday
  let nextTuesdayOffset = 0;
  if (day < 2) {
    nextTuesdayOffset = 2 - day;
  } else if (day > 2) {
    nextTuesdayOffset = 7 - day + 2;
  }
  const tuesday = new Date(now.getTime() + nextTuesdayOffset * 86400000);
  tuesday.setHours(0, 0, 0, 0);

  // find upcoming Sunday
  // if day=2 => Sunday is 5 days away, etc.
  let nextSundayOffset = 0;
  if (day === 0) {
    // if it's Sunday, next Sunday is +7
    nextSundayOffset = 7;
  } else {
    nextSundayOffset = 7 - day;
  }
  const sunday = new Date(now.getTime() + nextSundayOffset * 86400000);
  sunday.setHours(23, 59, 59, 999);

  return { tuesday, sunday };
}

export async function POST(request: NextRequest) {
  try {
    //
    // A) Fetch Announcements from Airtable
    //
    const records = await base(ANNOUNCEMENTS_TABLE).select().all();
    if (!records.length) {
      return NextResponse.json({
        success: true,
        message: 'No announcements found in Airtable',
      });
    }

    // Filter by "Promotion Start Date" in [Tuesday, Sunday]
    const { tuesday, sunday } = getThisTuesdayAndSunday();
    const relevantRecords = records.filter((r) => {
      const f = r.fields as Record<string, any>;
      const dateStr = f['Promotion Start Date'] || '';
      const parsed = parseMmDdYy(dateStr);
      if (!parsed) return false;
      return parsed >= tuesday && parsed <= sunday;
    });

    if (!relevantRecords.length) {
      return NextResponse.json({
        success: true,
        message: 'No announcements matched the date filter',
      });
    }

    // Build announcements text
    let announcementsText = `\nHere are the announcements:\n\n`;
    relevantRecords.forEach((r, idx) => {
      const f = r.fields;
      announcementsText += `Announcement #${idx + 1}:\n`;
      announcementsText += `Ministry: ${f.Ministry || 'N/A'}\n`;
      announcementsText += `Date: ${f['Date of Event'] || 'N/A'}\n`;
      announcementsText += `Time: ${f['Time of Event'] || 'N/A'}\n`;
      announcementsText += `Announcement Body: ${f['Announcement Body'] || ''}\n`;
      announcementsText += `Files: ${f['File Links'] || 'none'}\n`;
      announcementsText += `---\n`;
    });

    // Combine brand pre-prompt + user data
    const combinedUserPrompt = `
${brandPrePrompt}

Now, please transform these announcements into the required format:

${announcementsText}
`.trim();

    //
    // B) Call Anthropic Claude
    //    We'll pass the anthopic-version in request options
    //
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
          'anthropic-version': '2023-10-01', // ensures we use the newest stable version
        },
      }
    );

    let summaryText: string;
    if (typeof response.content === 'string') {
      summaryText = response.content;
    } else {
      summaryText = JSON.stringify(response.content, null, 2);
    }

    //
    // C) Send Email via Microsoft Graph
    //
    const client = getGraphClient();
    const fromAddress = process.env.MAILBOX_TO_SEND_FROM || '';
    const toAddress = 'mboyle@sainthelen.org'; // or from env

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
