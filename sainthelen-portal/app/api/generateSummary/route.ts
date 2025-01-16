// app/api/generateSummary/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { ClientSecretCredential } from '@azure/identity';

const personalToken = process.env.AIRTABLE_PERSONAL_TOKEN || '';
const baseId = process.env.AIRTABLE_BASE_ID || '';
const announcementsTable = process.env.ANNOUNCEMENTS_TABLE_NAME || 'Announcements';

const base = new Airtable({ apiKey: personalToken }).base(baseId);

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

// Minimal Claude call
async function callClaudeForSummary(announcements: any[]) {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY || '';
  if (!anthropicApiKey) {
    console.warn('No ANTHROPIC_API_KEY set, returning a mock summary...');
    return 'Mock summary from Claude. (Set ANTHROPIC_API_KEY to call real Claude API.)';
  }

  // Construct a prompt
  const prompt = `You are a marketing assistant. Summarize these announcements in a concise format for an email blast:
${JSON.stringify(announcements, null, 2)}

Produce a short paragraph for each announcement.`;

  // Call the Claude API (v1 or v2)
  const res = await fetch('https://api.anthropic.com/v1/complete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': anthropicApiKey,
    },
    body: JSON.stringify({
      prompt: `\n\nHuman: ${prompt}\n\nAssistant:`,
      model: 'claude-2',
      max_tokens_to_sample: 1024,
      temperature: 0.2,
      stop_sequences: ['\n\nHuman:'],
    }),
  });

  const json = await res.json();
  return json.completion || '[No response from Claude]';
}

export async function POST(request: NextRequest) {
  try {
    // 1) Fetch relevant announcements
    const allRecs = await base(announcementsTable).select().all();
    // Filter or date-range logic
    const relevant = allRecs.filter((r) => {
      const override = r.fields.overrideStatus || 'none';
      if (override === 'forceExclude') return false;
      if (override === 'defer') return false; // skip this week
      // if forceInclude => always in
      // otherwise you might check if promotionStart <= now <= eventDate, etc.

      return true; 
    });

    // 2) Summarize via Claude
    const summaryText = await callClaudeForSummary(relevant.map(r => r.fields));

    // 3) Send email to mboyle@sainthelen.org
    const client = getGraphClient();
    const fromAddress = process.env.MAILBOX_TO_SEND_FROM || '';

    await client.api(`/users/${fromAddress}/sendMail`).post({
      message: {
        subject: 'Weekly Saint Helen Announcements Summary',
        body: {
          contentType: 'html',
          content: `<p>Here is this week's summary:</p><div>${summaryText}</div>`,
        },
        from: { emailAddress: { address: fromAddress } },
        toRecipients: [
          { emailAddress: { address: 'mboyle@sainthelen.org' } },
        ],
      },
      saveToSentItems: true,
    });

    return NextResponse.json({ success: true, summary: summaryText });
  } catch (error: any) {
    console.error('Error generating summary:', error);
    return new NextResponse(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
}
