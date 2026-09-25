// app/api/social/generate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import Anthropic from '@anthropic-ai/sdk';
import * as socialService from '../../../lib/db/services/social-media-content';
import { HOUSE_STYLE, PARISH } from '../../../lib/house-style';

export const dynamic = 'force-dynamic';

const anthropic = new Anthropic();

// Per-platform limits from the Saint Helen Writing Guide. TikTok and Google
// Business aren't in the guide; they follow the same spirit.
const platformConfigs: Record<string, { length: string; hashtags: string; register: string }> = {
  facebook: {
    length: '80 words maximum',
    hashtags: '2 to 4 hashtags, always including #SaintHelenCommunity',
    register: 'The fullest version, with the contact email for ministry events',
  },
  instagram: {
    length: '60 words maximum',
    hashtags: 'Sparing: #SaintHelenCommunity plus at most one or two more, only if they genuinely fit',
    register: 'Conversational. The first line does the work, since it is all most people see',
  },
  threads: {
    length: '60 words maximum',
    hashtags: 'No hashtags',
    register: 'Casual, written to get replies',
  },
  x: {
    length: 'Under 280 characters',
    hashtags: 'No hashtags',
    register: 'Plain: one fact, one link',
  },
  linkedin: {
    length: '100 words maximum',
    hashtags: 'None, or one at most',
    register: 'Community-institution voice: service, accessibility, milestones, big events',
  },
  tiktok: {
    length: 'Under 50 words',
    hashtags: 'Sparing: #SaintHelenCommunity plus at most two more',
    register: 'Casual, with the hook in the first line',
  },
  gmb: {
    length: '100 words maximum',
    hashtags: 'No hashtags',
    register: 'Plain and informative: the facts someone searching nearby would need',
  },
};

// What each kind of post is for, in plain terms. The voice comes from HOUSE_STYLE.
const contentTypePrompts: Record<string, string> = {
  event_promo: 'A post about an upcoming parish event. Put the event, day, date, time, and place in the first line, then cost, what to bring, and the contact.',
  event_recap: 'A post after a parish event. Lead with a number or a concrete detail from the event and thank a specific group. No uplift close.',
  inspirational: 'A faith post built on a line from Sunday\'s readings, the homily, or a saint. Quote only what is given in the source material, never from memory, and never invent a quote.',
  sermon_clip: 'A caption for a clip from Sunday Mass. Say plainly what the homily is about in one or two sentences.',
  homily_clip: 'A caption for a daily Mass homily clip. Say plainly what it is about. Short.',
  ministry_spotlight: 'A post about one parish ministry: what it does in one sentence, who it is for, when and where it meets, and how to join. Name the people involved when the source material does.',
};

const SOCIAL_RULES = `# This piece: a social media post

Social is the one channel where a little personality and emoji are expected. It is also the one most likely to drift into generic church content, so the rules above apply harder here, not softer.
- The first line is the post. Put the fact there, never a question.
- Full logistics go in the caption, because most people never click through. Ministry events get a contact email.
- Emoji: three at most, used as punctuation. Never one per line, never as bullets, never several in a row.
- No "link in bio" unless the link really is in the bio. On Instagram, say where to find it ("sainthelen.org/pasta").
- Missing details: nothing publishes automatically, so put a visible blank like [TIME NEEDED] where a needed detail is missing.
- Write only the post text and its hashtags. No preamble, no options, no notes.`;

/**
 * POST /api/social/generate
 * Generates AI-powered social media content using Claude
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;
    const body = await request.json();

    const {
      contentType = 'inspirational',
      platform = 'instagram',
      sourceContent,
      eventDetails,
    } = body;

    const platformConfig = platformConfigs[platform] || platformConfigs.instagram;
    const typePrompt = contentTypePrompts[contentType] || contentTypePrompts.inspirational;

    // Build the prompt
    const systemPrompt = `You write social media posts for ${PARISH}.

${HOUSE_STYLE}

${SOCIAL_RULES}

Platform: ${platform}
- Length: ${platformConfig.length}, not counting hashtags
- Hashtags: ${platformConfig.hashtags}
- Register: ${platformConfig.register}

Post type: ${contentType.replace('_', ' ')}
${typePrompt}`;

    const userPrompt = sourceContent
      ? `Based on this source material, create a ${platform} post:\n\n${sourceContent}${
          eventDetails ? `\n\nEvent Details:\n${eventDetails}` : ''
        }`
      : `Create an original ${contentType.replace('_', ' ')} post for ${platform}.${
          eventDetails ? `\n\nEvent Details:\n${eventDetails}` : ''
        }`;

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    // Extract the text content
    const textContent = message.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content generated');
    }

    const generatedText = textContent.text;

    // Parse out hashtags if present
    const hashtagMatch = generatedText.match(/#\w+/g);
    const hashtags = hashtagMatch ? hashtagMatch.join(' ') : '';
    const mainContent = generatedText.replace(/#\w+/g, '').trim();

    // Save to database
    const savedContent = await socialService.createContent({
      userEmail,
      platform,
      contentType,
      content: mainContent,
      hashtags: hashtags || undefined,
    });

    return NextResponse.json({
      success: true,
      content: savedContent,
    });
  } catch (error: any) {
    console.error('Error generating social content:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate content' },
      { status: 500 }
    );
  }
}
