// app/lib/event-cleanup.ts
//
// Turns a calendar request as submitted into a listing fit for the public
// calendar at sainthelen.org. Light editing only: fix what's wrong, strip the
// filler, keep the submitter's content. Anything Claude isn't sure about goes
// back as a concern for a person to check, never as a guess in the listing.

import Anthropic from '@anthropic-ai/sdk';
import mammoth from 'mammoth';
import type { CalendarEventFields } from './db/schema';
import { HOUSE_STYLE, PARISH } from './house-style';

const MODEL = 'claude-opus-5';

// Keep the whole cleanup inside the submit route's time budget. On failure the
// review email still goes out, with the event as submitted.
const client = new Anthropic({ timeout: 80_000, maxRetries: 0 });

const MAX_ATTACHMENTS = 4;
const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // API limit per image

const SYSTEM_PROMPT = `You edit event listings for the public events calendar on sainthelen.org, the website of ${PARISH}. Parishioners and ministry leaders submit events through a form. You turn each submission into a clean calendar listing that a communications staff member approves before it goes live.

${HOUSE_STYLE}

Also, because this is a calendar listing:
- Replace relative dates such as "next weekend" or "this Sunday". A calendar listing is read on different days, so name the date or drop the phrase.
- Drop repetition of the date, time, or location in the description when it adds nothing. The calendar shows those fields on their own.

Never invent anything: no times, places, prices, contacts, or details that aren't in the submission or its attachments. If attachments (flyers, bulletin copy, documents) are included, use them to fill in or confirm details the form fields leave out, and say in changes that you did.

Field rules:
- title: the event's name, in title case, without dates or times. Shorten a sentence-length name to its name.
- description: plain text paragraphs separated by a blank line. No markdown, no HTML, no bullet symbols.
- dates: every date the event happens, as YYYY-MM-DD. Resolve them from the form fields, the text, and attachments together.
- start_time and end_time: 24-hour HH:MM, or an empty string when unknown. Do not guess an end time.
- location: a room or place name as a parishioner would recognize it, or an empty string.
- signup_url: a registration link if one was given, or an empty string.
- contact: who the public should contact about the event (a name, email, or phone number), only when the announcement text, calendar description, or an attachment explicitly says to contact them. Otherwise an empty string. The person who submitted the form is not a contact unless the copy itself names them as one.

changes: one short line per edit worth mentioning to the reviewer, e.g. "Removed 'next weekend' since the calendar shows the dates" or "Took the end time from the attached flyer". Skip trivial punctuation fixes. Empty if you changed nothing.

concerns: anything the reviewer should check before publishing, e.g. the form's date and the text disagree, the event happens on several dates at different times (the calendar holds one start time), a link looks broken, or information seems missing. Say which value you chose and why. Empty if nothing needs checking.`;

// Every field required and nothing extra, so the parsed output is always complete
const OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'title',
    'description',
    'dates',
    'start_time',
    'end_time',
    'location',
    'signup_url',
    'contact',
    'changes',
    'concerns',
  ],
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
    dates: { type: 'array', items: { type: 'string' } },
    start_time: { type: 'string' },
    end_time: { type: 'string' },
    location: { type: 'string' },
    signup_url: { type: 'string' },
    contact: { type: 'string' },
    changes: { type: 'array', items: { type: 'string' } },
    concerns: { type: 'array', items: { type: 'string' } },
  },
};

export type SubmissionContext = {
  event: CalendarEventFields;
  submitterName: string;
  ministry: string;
  announcementBody: string;
  eventDates: Array<{ date: string; time?: string }>;
  publicationNotes: string;
  fileLinks: string[];
};

export type CleanupResult = {
  cleaned: CalendarEventFields;
  changes: string[];
  concerns: string[];
};

type ContentBlock = Anthropic.Beta.BetaContentBlockParam;

const IMAGE_TYPES: Record<string, 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp'> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
};

function fileName(url: string): string {
  const last = decodeURIComponent(new URL(url).pathname.split('/').pop() || url);
  // Uploads are stored as <timestamp>-<original name>
  return last.replace(/^\d{10,}-/, '');
}

/**
 * Turn one uploaded file into something Claude can read. Returns a note
 * instead when the file can't be used, so the reviewer knows it was skipped.
 */
async function attachmentBlocks(url: string): Promise<{ blocks: ContentBlock[]; skipped?: string }> {
  const name = fileName(url);
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const readable = ext === 'pdf' || ext === 'docx' || ext === 'txt' || ext in IMAGE_TYPES;
  if (!readable) {
    return { blocks: [], skipped: `${name} (.${ext} files can't be read)` };
  }

  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) return { blocks: [], skipped: `${name} (download failed: HTTP ${res.status})` };
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_ATTACHMENT_BYTES) return { blocks: [], skipped: `${name} (too large)` };

  const label: ContentBlock = { type: 'text', text: `Attachment: ${name}` };

  if (ext === 'pdf') {
    return {
      blocks: [
        label,
        {
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: buf.toString('base64') },
        },
      ],
    };
  }
  if (ext in IMAGE_TYPES) {
    if (buf.length > MAX_IMAGE_BYTES) return { blocks: [], skipped: `${name} (image over 5 MB)` };
    return {
      blocks: [
        label,
        {
          type: 'image',
          source: { type: 'base64', media_type: IMAGE_TYPES[ext], data: buf.toString('base64') },
        },
      ],
    };
  }

  const text =
    ext === 'docx' ? (await mammoth.extractRawText({ buffer: buf })).value : buf.toString('utf8');
  if (!text.trim()) return { blocks: [], skipped: `${name} (no text found)` };
  return { blocks: [{ type: 'text', text: `Attachment: ${name}\n\n${text.trim()}` }] };
}

function submissionText(ctx: SubmissionContext, today: string): string {
  const e = ctx.event;
  const extraDates = ctx.eventDates
    .map((d) => `${d.date}${d.time ? ` at ${d.time}` : ''}`)
    .join('; ');

  return [
    `Today's date: ${today}`,
    '',
    'Calendar request as submitted:',
    `Event name: ${e.title || '(blank)'}`,
    `Date(s): ${e.dates.join(', ') || '(blank)'}`,
    `Start time: ${e.startTime || '(blank)'}`,
    `End time: ${e.endTime || '(blank)'}`,
    `Location: ${e.location || '(blank)'}`,
    `Sign-up link: ${e.signUpUrl || '(blank)'}`,
    `Contact: ${e.contact || '(blank)'}`,
    `Calendar description:\n${e.description || '(blank)'}`,
    '',
    'Context from the same announcement request (not for publishing as-is):',
    `Submitted by (not a public contact): ${ctx.submitterName}${ctx.ministry ? ` (${ctx.ministry})` : ''}`,
    `All event dates entered on the form: ${extraDates || '(none)'}`,
    `Announcement text:\n${ctx.announcementBody || '(blank)'}`,
    ctx.publicationNotes ? `Note to the communications office:\n${ctx.publicationNotes}` : '',
  ]
    .filter((line) => line !== '')
    .join('\n');
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Keep Claude's value only when it's well formed; otherwise fall back to what was submitted. */
function validated(raw: any, original: CalendarEventFields, concerns: string[]): CalendarEventFields {
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  const time = (v: unknown, fallback: string) => {
    const t = str(v);
    return t === '' || TIME_RE.test(t) ? t : fallback;
  };

  let dates = Array.isArray(raw.dates)
    ? Array.from(new Set(raw.dates.map(str).filter((d: string) => DATE_RE.test(d)))).sort() as string[]
    : [];
  if (!dates.length) {
    dates = original.dates;
    concerns.push('Could not work out the dates, so these are the dates from the form.');
  }

  const signUpUrl = str(raw.signup_url);
  return {
    title: str(raw.title) || original.title,
    description: str(raw.description) || original.description,
    dates,
    startTime: time(raw.start_time, original.startTime),
    endTime: time(raw.end_time, original.endTime),
    location: str(raw.location) || original.location,
    signUpUrl: /^https?:\/\//i.test(signUpUrl) ? signUpUrl : original.signUpUrl,
    contact: str(raw.contact),
  };
}

export async function cleanUpEvent(ctx: SubmissionContext): Promise<CleanupResult> {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());

  const attachments = await Promise.all(
    ctx.fileLinks.slice(0, MAX_ATTACHMENTS).map((url) =>
      attachmentBlocks(url).catch((err) => ({
        blocks: [] as ContentBlock[],
        skipped: `${fileName(url)} (${err?.message || 'could not be read'})`,
      }))
    )
  );
  const skipped = attachments.flatMap((a) => (a.skipped ? [a.skipped] : []));
  if (ctx.fileLinks.length > MAX_ATTACHMENTS) {
    skipped.push(`${ctx.fileLinks.length - MAX_ATTACHMENTS} more attachment(s) not read`);
  }

  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    thinking: { type: 'adaptive' },
    output_config: {
      effort: 'medium',
      format: { type: 'json_schema', schema: OUTPUT_SCHEMA },
    },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          ...attachments.flatMap((a) => a.blocks),
          { type: 'text', text: submissionText(ctx, today) },
        ],
      },
    ],
  });

  if (response.stop_reason === 'refusal') {
    throw new Error('Claude declined to edit this submission');
  }
  if (response.stop_reason === 'max_tokens') {
    throw new Error('Claude ran out of room before finishing');
  }

  const text = response.content
    .flatMap((b) => (b.type === 'text' ? [b.text] : []))
    .join('');
  const raw = JSON.parse(text);

  const concerns: string[] = Array.isArray(raw.concerns) ? raw.concerns.map(String) : [];
  const cleaned = validated(raw, ctx.event, concerns);
  if (skipped.length) {
    concerns.push(`Attachments not read: ${skipped.join('; ')}`);
  }

  return {
    cleaned,
    changes: Array.isArray(raw.changes) ? raw.changes.map(String) : [],
    concerns,
  };
}
