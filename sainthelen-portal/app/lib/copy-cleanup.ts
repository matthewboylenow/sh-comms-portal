// app/lib/copy-cleanup.ts
//
// Light editing for submitted copy: announcements (bulletin, email blast,
// church screens) and website update requests. Used two ways:
//   - review: after submission, for the communications office, with notes on
//     what changed and what to check
//   - assist: the "Tighten this up" button on the forms, for the submitter,
//     which only returns the suggested text

import Anthropic from '@anthropic-ai/sdk';
import { HOUSE_STYLE, PARISH, todayLabel } from './house-style';

const MODEL = 'claude-opus-5';

const client = new Anthropic({ timeout: 60_000, maxRetries: 1 });

export type CopyKind = 'announcement' | 'website_update';

const KIND_CONTEXT: Record<CopyKind, string> = {
  announcement: `# This piece: an announcement

A ministry or staff member submitted this for the bulletin, the Wednesday email, and the screens in church. Edit it as a bulletin blurb:
- 90 words maximum, aim for 55 to 70. If it doesn't fit, cut adjectives first, then the what-to-expect sentence, and the logistics never.
- Shape: what it is and who it's for, then the logistics (day, date, time, place, cost, what to bring), then who to contact.
- One paragraph, no headings, no bullets unless listing what to bring or a price breakdown.
- It may run for several weeks, so replace relative dates ("next weekend," "this Sunday") with the actual date when the text makes it clear, and flag them in concerns when it doesn't.`,
  website_update: `# This piece: a website update request

Someone is asking the communications office to change a page on sainthelen.org. The request usually mixes instructions to the office ("replace the second paragraph with...", "add this under Upcoming") with the copy meant for the page. Edit only the copy meant for the page. Leave the instructions exactly as written, in the same places, so the office can still follow them.

For the page copy:
- The first paragraph answers the page's question (when, what's required, what to do first) in under 40 words. No welcome paragraph, no history.
- Short paragraphs of two or three sentences. Headings in sentence case, phrased as the reader's question or a plain label ("How to register").
- Facts as plain declarative sentences a search can match: "Confessions are Saturdays at 3:30 PM in the church."
- Sweep dated language ("new for 2025," "this fall," "starting next month") and flag it in concerns when you can't tell whether it's still true.
- Link text says where the link goes, never "click here."`,
};

const MISSING_DETAILS = `# Missing details

Where the piece needs a detail the text doesn't give (a time, a place, a cost, a contact email), put a visible blank in the text, like [TIME NEEDED], [PLACE NEEDED], or [EMAIL NEEDED], and list what's missing in concerns. Only for details this kind of piece genuinely needs; don't pad a thank-you note with blanks. If no contact is named anywhere, add "No contact named" to concerns rather than inventing one.`;

function systemPrompt(kind: CopyKind): string {
  return `You edit copy submitted to the communications office of ${PARISH}.

${HOUSE_STYLE}

${KIND_CONTEXT[kind]}

${MISSING_DETAILS}

# Output
Return plain text with paragraphs separated by a blank line. No markdown, no HTML. Keep line breaks the submitter used for lists or schedules.

text: the edited copy. If nothing needs changing, return the original text unchanged.

changes: one short line per edit worth mentioning, e.g. "Cut 'join us for an unforgettable evening'" or "Moved the time and place into the first two sentences". Skip trivial punctuation fixes. Empty if you changed nothing.

concerns: anything the communications office should check, e.g. a date that doesn't fall on the weekday named, a missing detail, a relative date in copy that may run for several weeks, a quote to verify, or a link that looks broken. Empty if nothing needs checking.`;
}

const OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['text', 'changes', 'concerns'],
  properties: {
    text: { type: 'string' },
    changes: { type: 'array', items: { type: 'string' } },
    concerns: { type: 'array', items: { type: 'string' } },
  },
};

export type CopyCleanupResult = {
  text: string;
  changes: string[];
  concerns: string[];
  /** True when the edit is identical to what was submitted (ignoring whitespace) */
  unchanged: boolean;
};

function normalise(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

export async function cleanUpCopy(
  kind: CopyKind,
  text: string,
  { effort = 'medium', context = '' }: { effort?: 'low' | 'medium'; context?: string } = {}
): Promise<CopyCleanupResult> {
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    thinking: { type: 'adaptive' },
    output_config: {
      effort,
      format: { type: 'json_schema', schema: OUTPUT_SCHEMA },
    },
    system: systemPrompt(kind),
    messages: [
      {
        role: 'user',
        content: [
          `Today is ${todayLabel()}.`,
          context,
          `Text to edit:\n${text}`,
        ]
          .filter(Boolean)
          .join('\n\n'),
      },
    ],
  });

  if (response.stop_reason === 'refusal') {
    throw new Error('Claude declined to edit this text');
  }
  if (response.stop_reason === 'max_tokens') {
    throw new Error('Claude ran out of room before finishing');
  }

  const raw = JSON.parse(
    response.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('')
  );
  const edited = typeof raw.text === 'string' && raw.text.trim() ? raw.text.trim() : text;

  return {
    text: edited,
    changes: Array.isArray(raw.changes) ? raw.changes.map(String) : [],
    concerns: Array.isArray(raw.concerns) ? raw.concerns.map(String) : [],
    unchanged: normalise(edited) === normalise(text),
  };
}
