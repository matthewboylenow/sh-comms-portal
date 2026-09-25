// app/lib/copy-cleanup.ts
//
// Light editing for submitted copy: announcements (bulletin, email blast,
// church screens) and website update requests. Used two ways:
//   - review: after submission, for the communications office, with notes on
//     what changed and what to check
//   - assist: the "Tighten this up" button on the forms, for the submitter,
//     which only returns the suggested text

import Anthropic from '@anthropic-ai/sdk';
import { HOUSE_STYLE, PARISH } from './house-style';

const MODEL = 'claude-opus-5';

const client = new Anthropic({ timeout: 60_000, maxRetries: 1 });

export type CopyKind = 'announcement' | 'website_update';

const KIND_CONTEXT: Record<CopyKind, string> = {
  announcement: `The text is an announcement submitted by a parish ministry. It runs in the weekly bulletin, the parish email blast, and on the screens in church, often for several weeks in a row.`,
  website_update: `The text is a request to change a page on sainthelen.org, the parish website. It usually mixes instructions to the communications office ("please replace the second paragraph with...", "add this under Upcoming") with the copy meant for the page. Edit only the copy meant for the page. Leave the instructions exactly as written, in the same places, so the office can still follow them.`,
};

function systemPrompt(kind: CopyKind): string {
  return `You edit copy submitted to the communications office of ${PARISH}.

${KIND_CONTEXT[kind]}

${HOUSE_STYLE}

Never invent anything: no dates, times, places, prices, contacts, links, or details that aren't in the text. Keep every link, email address, and phone number exactly as given.

Return plain text with paragraphs separated by a blank line. No markdown, no HTML. Keep line breaks the submitter used for lists or schedules.

text: the edited copy. If nothing needs changing, return the original text unchanged.

changes: one short line per edit worth mentioning, e.g. "Cut 'join us for an unforgettable evening'" or "Fixed the spelling of Bethlehem". Skip trivial punctuation fixes. Empty if you changed nothing.

concerns: anything the communications office should check, e.g. a relative date like "next weekend" in copy that may run for several weeks, a date and weekday that don't match, a link that looks broken, or information that seems missing. Empty if nothing needs checking.`;
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
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());

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
          `Today's date: ${today}`,
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
