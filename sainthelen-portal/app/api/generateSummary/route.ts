// app/api/generateSummary/route.ts

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Example: If you also use Airtable or Microsoft Graph, import them here:
// import Airtable from 'airtable';
// import { Client } from '@microsoft/microsoft-graph-client';
// etc.

export async function POST(request: NextRequest) {
  try {
    // 1) Parse the request body to get any announcements data
    //    (You might fetch them from Airtable, or pass them in the body.)
    const { announcements } = await request.json(); 
    // Or if you need to fetch from Airtable, do so here.

    // 2) Construct a user message summarizing the announcements
    //    For example, you might create a short JSON or bullet list:
    let announcementsText = `Here are the announcements:\n\n`;
    if (announcements && announcements.length) {
      announcements.forEach((ann: any, idx: number) => {
        announcementsText += `Announcement #${idx + 1}:\n`;
        announcementsText += `Ministry: ${ann.ministry}\n`;
        announcementsText += `Event Date: ${ann.eventDate}\n`;
        announcementsText += `Event Time: ${ann.eventTime}\n`;
        announcementsText += `Body: ${ann.announcementBody}\n`;
        announcementsText += `---\n`;
      });
    } else {
      announcementsText += `No announcements found.\n`;
    }

    // 3) Here’s the pre-prompt to guide Claude
    const prePrompt = `
You are a communications assistant for Saint Helen Parish, a modern Catholic church known for its warm, inclusive, authentic, and uplifting brand style. Here’s how you must craft announcements:

1. Brand Tone & Style:
   - Warm, inviting, and inclusive
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

   - Email Blast Copy (max ~65-70 words):
       Include event date, time, venue, CTA link if available.
   - Bulletin Copy (max ~50 words):
       Same essential info, more concise.
   - Screens Copy (very concise ~12-14s on screen):
       Minimal text, date/time, short CTA or link.

3. Additional Notes:
   - If attached files exist, put them under [Attached Files].
   - Do not exceed word limits.
   - Stay consistent, warm, inclusive, encouraging.
   - Skip extraneous text or disclaimers.

When you receive announcements data, transform each into the format above.
    `.trim();

    // 4) Initialize the Anthropic client
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });

    // 5) Call Claude with a "system" (prePrompt) + "user" (announcementsText)
    //    NOTE: The user snippet uses anthropic.messages.create(...)
    //    We must specify 'model', 'max_tokens_to_sample', 'messages'.
    //    For Claude 3.5 Sonnet, do: model: "claude-3-5-sonnet-v2@20241022"
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-v2@20241022',
      max_tokens_to_sample: 1024,
      messages: [
        {
          role: 'system',
          content: prePrompt,
        },
        {
          role: 'user',
          content: announcementsText,
        },
      ],
    });

    // "response" is an object with a "completion" property 
    // that holds Claude's generated text.
    // If you want only the text, do something like:
    const summaryText = response.completion;

    // 6) (Optional) Send this summary via Microsoft Graph to your inbox
    //    Or do whatever post-processing you want:
    // e.g. emailSummary(summaryText);

    // 7) Return the generated summary back to the client
    return NextResponse.json({
      success: true,
      modelUsed: 'claude-3-5-sonnet-v2@20241022',
      summaryText,
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
