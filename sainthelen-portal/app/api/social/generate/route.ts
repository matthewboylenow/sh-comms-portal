// app/api/social/generate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import Anthropic from '@anthropic-ai/sdk';
import * as socialService from '../../../lib/db/services/social-media-content';

export const dynamic = 'force-dynamic';

const anthropic = new Anthropic();

// Platform-specific configurations
const platformConfigs: Record<string, { maxLength: number; hashtagCount: number; tone: string }> = {
  facebook: { maxLength: 500, hashtagCount: 3, tone: 'warm and community-focused' },
  instagram: { maxLength: 2000, hashtagCount: 15, tone: 'visual and engaging with emojis' },
  x: { maxLength: 250, hashtagCount: 3, tone: 'concise and punchy' },
  linkedin: { maxLength: 700, hashtagCount: 5, tone: 'professional yet warm' },
  threads: { maxLength: 450, hashtagCount: 5, tone: 'conversational and authentic' },
  tiktok: { maxLength: 300, hashtagCount: 5, tone: 'trendy with a hook' },
  gmb: { maxLength: 750, hashtagCount: 0, tone: 'informative and local SEO focused' },
};

// Content type prompts
const contentTypePrompts: Record<string, string> = {
  event_promo: 'Create a promotional post for an upcoming parish event. Make it exciting and encourage participation.',
  event_recap: 'Create a post celebrating a recent parish event. Highlight community togetherness and memorable moments.',
  inspirational: 'Create an inspirational faith-based post. Can include scripture, saint quotes, or encouragement for daily life.',
  sermon_clip: 'Create a post to accompany a video clip from Sunday Mass. Include a teaser of the message.',
  homily_clip: 'Create a post to accompany a daily Mass homily clip. Keep it reflective and accessible.',
  ministry_spotlight: 'Create a post highlighting a parish ministry or volunteer group. Celebrate their service.',
};

// Saint Helen brand voice guidelines
const brandVoiceGuidelines = `
SAINT HELEN BRAND VOICE GUIDELINES:
- Warm, personal, conversational - like a friendly neighbor, not a corporate announcement
- Encouraging without being preachy
- Clear without being dry
- Inclusive without feeling forced

WRITING RULES:
- NO em dashes (use commas or periods instead)
- NO formal/stiff language ("All parishioners are cordially invited...")
- NO churchy jargon that sounds institutional
- NO AI-sounding phrases ("It's not this, it's that" patterns)
- Write the way you'd actually talk to someone

THE THROUGHLINE:
- Make people feel like they belong
- Give them the info they need without a wall of text
- Keep it grounded in real community life
`;

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
    const systemPrompt = `You are a social media content creator for Saint Helen Catholic Church. You create engaging, authentic content that connects with the parish community.

${brandVoiceGuidelines}

Platform: ${platform.toUpperCase()}
- Maximum length: ${platformConfig.maxLength} characters (for main content, not including hashtags)
- Hashtags: Include ${platformConfig.hashtagCount} relevant hashtags
- Tone: ${platformConfig.tone}

Content Type: ${contentType.replace('_', ' ')}
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
