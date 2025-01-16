// app/api/generateSummary/route.ts

import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';

import Anthropic from '@anthropic-ai/sdk';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { ClientSecretCredential } from '@azure/identity';

export const dynamic = 'force-dynamic'; // ensures no static generation

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

  console.log('Graph Credentials:', { tenantId, clientId, clientSecretExists: !!clientSecret });

  const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes: ['https://graph.microsoft.com/.default'],
  });

  return Client.initWithMiddleware({ authProvider });
}

//
// 4) Configure Anthropic
//
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

//
// 5) The brand pre-prompt
//
const brandPrePrompt = `
You are a communications assistant for Saint Helen Parish...
[Etc. your brand instructions here.]
`.trim();

//
// 6) Helper to parse "MM/DD/YY"
//
function parseMmDdYy(dateStr: string): Date | null {
  if (!dateStr) {
    return null;
  }
  const parts = dateStr.split('/');
  if (parts.length !== 3) {
    return null;
  }

  const [mm, dd, yy] = parts.map((p) => p.trim());
  let fullYear = parseInt(yy, 10);
  if (fullYear < 100) {
    // If only two digits, assume 20xx
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
  let nextSundayOffset = 0;
  if (day === 0) {
    nextSundayOffset = 7;
  } else {
    nextSundayOffset = 7 - day;
  }
  const sunday = new Date(now.getTime() + nextSundayOffset * 86400000);
  sunday.setHours(23, 59, 59, 999);

  return { tuesday, sunday };
}

export async function POST(request: NextRequest) {
  console.log('>>> generateSummary: POST route called');

  try {
    //
    // A) Fetch Announcements
    //
    console.log('Fetching all records from table:', ANNOUNCEMENTS_TABLE);
    const records = await base(ANNOUNCEMENTS_TABLE).select().all();
    console.log('Found total records:', records.length);

    if (!records.length) {
      console.log('No announcements found in Airtable');
      return NextResponse.json({
        success: true,
        message: 'No announcements found in Airtable',
      });
    }

    const { tuesday, sunday } = getThisTuesdayAndSunday();
    console.log('Filtering by Promotion Start Date between', tuesday, 'and', sunday);

    // Filter records
    const relevantRecords = records.filter((r) => {
      const f = r.fields as Record<string, any>;
      const dateStr = f['Promotion Start Date'] || '';
      const parsed = parseMmDdYy(dateStr);
      return parsed && parsed >= tuesday && parsed <= sunday;
    });
    console.log('Announcements matching date filter:', relevantRecords.length);

    if (!relevantRecords.length) {
      console.log('No announcements matched the date filter');
      return NextResponse.json({
        success: true,
        message: 'No announcements matched the date filter',
      });
    }

    // Build text
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

    const combinedUserPrompt = `
${brandPrePrompt}

Now, please transform these announcements into the required format:

${announcementsText}
`.trim();

    //
    // B) Call Anthropic
    //
    console.log('Sending request to Anthropic...');
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
    console.log('Anthropic response object keys:', Object.keys(response));

    let summaryText: string;
    if (typeof response.content === 'string') {
      summaryText = response.content;
    } else {
      summaryText = JSON.stringify(response.content, null, 2);
    }
    console.log('Claude summary text (first 200 chars):', summaryText.slice(0, 200));

    //
    // C) Send Email via Microsoft Graph
    //
    console.log('Initializing MS Graph client...');
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

    console.log('Attempting to send email FROM:', fromAddress, 'TO:', toAddress);
    const sendMailResponse = await client.api(`/users/${fromAddress}/sendMail`).post({
      message: {
        subject,
        body: { contentType: 'html', content: htmlContent },
        from: { emailAddress: { address: fromAddress } },
        toRecipients: [{ emailAddress: { address: toAddress } }],
      },
      saveToSentItems: true,
    });

    console.log('Microsoft Graph sendMail response:', JSON.stringify(sendMailResponse, null, 2));

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
