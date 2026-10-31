// app/lib/inbox-scan.ts
//
// Reads the Communications Director's Outlook inbox and sent mail (and Teams
// chats where the tenant allows it), asks Claude which messages need a task,
// which are follow-ups on an existing one, and which are the Director's own
// commitments, progress or claims of completion. Writes the result to the
// Tasks tab with an audit event for every decision.
//
// Rules the model is held to:
//   - an acknowledgement ("I'll get to that") is a commitment, never completion
//   - "I've updated the page" is a claim; it is verified against the live page
//     where a page URL is known, and only a verified change closes the task
//   - follow-ups update the existing task and raise its visibility
import { createHash } from 'crypto';
import Anthropic from '@anthropic-ai/sdk';
import { sql } from 'drizzle-orm';
import { db } from './db';
import { graphList, graphGet, GraphError, htmlToText, stripQuotedReply, isGraphConfigured } from './graph';
import {
  openTasksForMatching,
  upsertTask,
  recordFollowUp,
  recordCommitment,
  recordInProgress,
  recordClaimedDone,
  recordVerifiedDone,
  setPageHash,
  getPageHash,
  logEvent,
  TASKS_OWNER,
  type TaskRow,
  type TaskCategory,
} from './db/services/portal-tasks';

const MODEL = 'claude-opus-5';
const client = new Anthropic({ timeout: 120_000, maxRetries: 1 });

const MAILBOX = (process.env.SCAN_MAILBOX || process.env.MAILBOX_TO_SEND_FROM || 'mboyle@sainthelen.org').toLowerCase();
const DIRECTOR_NAME = process.env.SCAN_DIRECTOR_NAME || 'Matthew Boyle';
const PASTOR_EMAILS = (process.env.PASTOR_EMAILS || '').toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);
const TEAMS_ENABLED = process.env.TEAMS_SCAN_ENABLED === 'true';
const PORTAL_URL = process.env.NEXTAUTH_URL || 'https://comms.sainthelen.org';
const NY = 'America/New_York';

/* ------------------------------------------------------------- cursors */

let cursorsReady: Promise<void> | null = null;
function ensureCursors() {
  if (!cursorsReady) {
    cursorsReady = db
      .execute(sql.raw(`CREATE TABLE IF NOT EXISTS "scan_cursors" ("key" varchar(50) PRIMARY KEY, "value" text NOT NULL, "updated_at" timestamptz DEFAULT now() NOT NULL)`))
      .then(() => undefined)
      .catch((e) => {
        cursorsReady = null;
        throw e;
      });
  }
  return cursorsReady;
}
async function getCursor(key: string): Promise<string | null> {
  await ensureCursors();
  const r = (await db.execute(sql`SELECT value FROM scan_cursors WHERE key = ${key}`)) as unknown as { rows: Array<{ value: string }> };
  return r.rows?.[0]?.value ?? null;
}
async function setCursor(key: string, value: string): Promise<void> {
  await ensureCursors();
  await db.execute(sql`INSERT INTO scan_cursors (key, value, updated_at) VALUES (${key}, ${value}, now()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`);
}

/* ------------------------------------------------------------ messages */

export type ScanMessage = {
  channel: 'email' | 'teams';
  id: string; // internetMessageId for email, message id for Teams
  conversationId: string | null;
  link: string | null;
  at: string; // ISO
  fromName: string;
  fromEmail: string;
  fromDirector: boolean;
  to: string[];
  subject: string;
  text: string;
  flagged: boolean; // sender marked urgent / high importance
};

const AUTOMATED = /(^|[.@-])(no-?reply|donotreply|notifications?|mailer-daemon|postmaster|eventbrite|sharepointonline|read\.ai|calendar-notification|bounce|alerts?)([.@-]|$)/i;

function isAutomated(m: ScanMessage): boolean {
  if (AUTOMATED.test(m.fromEmail)) return true;
  if (/\b(unsubscribe|view (this|in) browser|manage preferences)\b/i.test(m.text.slice(-600))) return true;
  if (/^(your order|order confirmation|receipt|invoice|meeting (recap|notes|summary)|accepted:|declined:|tentative:)/i.test(m.subject)) return true;
  return false;
}

async function fetchOutlook(sinceIso: string): Promise<ScanMessage[]> {
  const select = '$select=id,internetMessageId,conversationId,subject,from,toRecipients,receivedDateTime,sentDateTime,body,webLink,importance,flag,isDraft';
  const inbox = await graphList<any>(
    `/users/${encodeURIComponent(MAILBOX)}/mailFolders/inbox/messages?$filter=receivedDateTime ge ${sinceIso}&$orderby=receivedDateTime asc&$top=50&${select}`,
    150
  );
  const sent = await graphList<any>(
    `/users/${encodeURIComponent(MAILBOX)}/mailFolders/sentitems/messages?$filter=sentDateTime ge ${sinceIso}&$orderby=sentDateTime asc&$top=50&${select}`,
    100
  );
  const shape = (m: any, outbound: boolean): ScanMessage => {
    const fromEmail = (m.from?.emailAddress?.address || '').toLowerCase();
    const body = stripQuotedReply(htmlToText(m.body?.contentType === 'html' ? m.body?.content : (m.body?.content || '').replace(/\n/g, '<br>')));
    return {
      channel: 'email',
      id: m.internetMessageId || m.id,
      conversationId: m.conversationId || null,
      link: m.webLink || null,
      at: m.receivedDateTime || m.sentDateTime,
      fromName: m.from?.emailAddress?.name || fromEmail,
      fromEmail,
      fromDirector: outbound || fromEmail === MAILBOX,
      to: (m.toRecipients || []).map((r: any) => (r.emailAddress?.address || '').toLowerCase()).filter(Boolean),
      subject: m.subject || '(no subject)',
      text: body.slice(0, 4000),
      flagged: m.importance === 'high' || m.flag?.flagStatus === 'flagged' || /\burgent\b|\basap\b/i.test(m.subject),
    };
  };
  return [...inbox.filter((m) => !m.isDraft).map((m) => shape(m, false)), ...sent.filter((m) => !m.isDraft).map((m) => shape(m, true))].sort((a, b) => a.at.localeCompare(b.at));
}

/** Teams chats need Chat.Read.All (application) and Microsoft's protected-API approval. Off unless TEAMS_SCAN_ENABLED=true. */
async function fetchTeams(sinceIso: string): Promise<{ messages: ScanMessage[]; error?: string }> {
  if (!TEAMS_ENABLED) return { messages: [] };
  try {
    const chats = await graphList<any>(`/users/${encodeURIComponent(MAILBOX)}/chats?$filter=lastUpdatedDateTime gt ${sinceIso}&$top=50&$select=id,topic,chatType,webUrl`, 50);
    const out: ScanMessage[] = [];
    for (const chat of chats) {
      const msgs = await graphList<any>(`/chats/${chat.id}/messages?$top=50`, 50).catch(() => []);
      for (const m of msgs) {
        if (!m.createdDateTime || m.createdDateTime <= sinceIso || m.messageType !== 'message' || m.deletedDateTime) continue;
        const user = m.from?.user;
        if (!user) continue; // bots, system events
        const fromEmail = (user.email || user.userPrincipalName || '').toLowerCase();
        out.push({
          channel: 'teams',
          id: `teams:${chat.id}:${m.id}`,
          conversationId: `teams:${chat.id}`,
          link: m.webUrl || chat.webUrl || null,
          at: m.createdDateTime,
          fromName: user.displayName || fromEmail,
          fromEmail,
          fromDirector: fromEmail === MAILBOX || user.displayName === DIRECTOR_NAME,
          to: [],
          subject: chat.topic || (chat.chatType === 'oneOnOne' ? 'Direct message' : 'Group chat'),
          text: htmlToText(m.body?.content || '').slice(0, 3000),
          flagged: m.importance === 'high' || m.importance === 'urgent',
        });
      }
    }
    return { messages: out.sort((a, b) => a.at.localeCompare(b.at)) };
  } catch (err: any) {
    if (err instanceof GraphError && (err.status === 403 || err.status === 401)) {
      return { messages: [], error: `Teams: ${err.message}. The app needs Chat.Read.All and Microsoft's protected-API approval.` };
    }
    return { messages: [], error: `Teams: ${err.message || err}` };
  }
}

/* -------------------------------------------------------- page checks */

async function hashPage(url: string): Promise<string | null> {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 12_000);
    const res = await fetch(url, { signal: ctl.signal, headers: { 'User-Agent': 'SaintHelenPortal/1.0 (+comms.sainthelen.org)' }, cache: 'no-store' });
    clearTimeout(t);
    if (!res.ok) return null;
    const html = await res.text();
    // Main content only where the theme marks it; otherwise the whole page text
    const main = html.match(/<main[\s\S]*?<\/main>/i)?.[0] || html.match(/<article[\s\S]*?<\/article>/i)?.[0] || html;
    const text = htmlToText(main).replace(/\s+/g, ' ').trim();
    if (text.length < 40) return null;
    return createHash('sha256').update(text).digest('hex');
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------- Claude */

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['decisions'],
  properties: {
    decisions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['message', 'action', 'confidence', 'reason'],
        properties: {
          message: { type: 'integer', description: 'index of the message this decision is about' },
          action: { type: 'string', enum: ['none', 'create', 'follow_up', 'commitment', 'in_progress', 'claimed_done'] },
          task_id: { type: ['string', 'null'], description: 'id of the existing task for follow_up / commitment / in_progress / claimed_done' },
          confidence: { type: 'integer', minimum: 0, maximum: 100 },
          reason: { type: 'string', description: 'one short sentence' },
          committed_for: { type: ['string', 'null'], description: 'ISO date-time the Director committed to, when action is commitment' },
          task: {
            type: ['object', 'null'],
            additionalProperties: false,
            required: ['title', 'category', 'importance'],
            properties: {
              title: { type: 'string', description: 'the action, then the requester in parentheses' },
              notes: { type: ['string', 'null'], description: '1 to 3 sentences of context, including any page, link or date mentioned' },
              category: { type: 'string', enum: ['reply', 'bulletin', 'website', 'calendar', 'av', 'admin', 'other'] },
              importance: { type: 'string', enum: ['normal', 'high'] },
              due_at: { type: ['string', 'null'], description: 'ISO date-time when a deadline is stated or clearly implied, else null' },
              page_url: { type: ['string', 'null'], description: 'full sainthelen.org URL of the page to change, when known' },
              requester_name: { type: ['string', 'null'] },
              requester_email: { type: ['string', 'null'] },
            },
          },
        },
      },
    },
  },
} as const;

function systemPrompt(now: Date): string {
  const today = now.toLocaleDateString('en-US', { timeZone: NY, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  return `You triage the inbox of ${DIRECTOR_NAME}, Director of Communications at Saint Helen, a Catholic parish in Westfield, New Jersey. Today is ${today} (Eastern). You decide which messages need a task on the Director's to-do list, which are follow-ups on an existing task, and which are the Director's own words about a task.

Create a task when a message needs the Director to do something: a website change, an announcement, email, text or social request, a flier or design, an A/V or livestream request, a calendar item, a question that needs an answer, a meeting that needs a reply, a commitment the Director made to someone, or an acknowledged request that is still not done. One task per distinct ask; a message with three separate asks gets three tasks.

Do not create a task for: thanks and pleasantries, FYIs that need nothing, newsletters, receipts, order confirmations, automated notifications, calendar accept/decline notices, meeting recap bots, out-of-office replies, or funeral paperwork when a livestream notice for the same funeral is already there. When in doubt about a borderline message, prefer "none" with a low confidence and say why.

Existing open tasks are listed. If a message is about one of them (same thread, same page, same ask), do not create another:
- From someone other than the Director chasing it: "follow_up".
- From the Director saying they will do it ("I'll get to that today", "will do", "on it this afternoon"): "commitment", with committed_for as the date-time they named, interpreted in Eastern time (today = 6:00 PM today; tomorrow = 6:00 PM tomorrow; "this week" = Friday 6:00 PM). A commitment is never a completion.
- From the Director saying they are partway ("working on it", "drafting it now"): "in_progress".
- From the Director saying it is finished ("updated the page", "it's live", "sent it", "done"): "claimed_done", with confidence for how clearly it says finished. The system verifies website claims against the live page; you only report the claim.
Never mark anything done because the Director merely acknowledged it.

Importance "high" when: the sender marked it urgent or high importance; it is due within 48 hours; it is from the pastor (Msgr. Tom${PASTOR_EMAILS.length ? `, ${PASTOR_EMAILS.join(', ')}` : ''}) and asks for something; it is a livestream or recording request with a date; someone is waiting on a reply about a meeting already on the calendar. Otherwise "normal".

Categories: reply (a person is waiting on an answer), website (a change on sainthelen.org), bulletin (bulletin, Wednesday email, screens, announcements), calendar (parish calendar), av (sound, projection, livestream, recording), admin (internal office matters), other.

Titles read like a to-do: "Update Youth Ministry page: restore volunteer registration button (Patricia Gomez)". Notes carry the specifics: page, link, wording, date. Use the requester's name and email from the message. Return one decision per message, including "none".`;
}

type Decision = {
  message: number;
  action: 'none' | 'create' | 'follow_up' | 'commitment' | 'in_progress' | 'claimed_done';
  task_id?: string | null;
  confidence: number;
  reason: string;
  committed_for?: string | null;
  task?: {
    title: string;
    notes?: string | null;
    category: TaskCategory;
    importance: 'normal' | 'high';
    due_at?: string | null;
    page_url?: string | null;
    requester_name?: string | null;
    requester_email?: string | null;
  } | null;
};

async function decide(messages: ScanMessage[], open: TaskRow[], now: Date): Promise<Decision[]> {
  const taskList = open
    .slice(0, 120)
    .map(
      (t) =>
        `- id=${t.id} | ${t.status} | ${t.category} | "${t.title}"${t.requester_name ? ` from ${t.requester_name}` : ''}${t.conversation_id ? ` | conv=${t.conversation_id}` : ''}${t.page_url ? ` | page=${t.page_url}` : ''}${t.due_at ? ` | due ${t.due_at}` : ''}${t.follow_up_count ? ` | chased ${t.follow_up_count}x` : ''}`
    )
    .join('\n');
  const msgList = messages
    .map(
      (m, i) =>
        `### Message ${i}\nchannel: ${m.channel}\nfrom: ${m.fromName} <${m.fromEmail}>${m.fromDirector ? ' (THE DIRECTOR)' : ''}\nto: ${m.to.join(', ') || '-'}\nwhen: ${m.at}\nsubject: ${m.subject}\nconversation: ${m.conversationId || '-'}\nmarked urgent: ${m.flagged ? 'yes' : 'no'}\n\n${m.text || '(empty)'}`
    )
    .join('\n\n');

  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    thinking: { type: 'adaptive' },
    output_config: { effort: 'medium', format: { type: 'json_schema', schema: SCHEMA as any } },
    system: systemPrompt(now),
    messages: [
      {
        role: 'user',
        content: `Open tasks:\n${taskList || '(none)'}\n\nMessages to triage (${messages.length}):\n\n${msgList}`,
      },
    ],
  });
  if (response.stop_reason === 'refusal') throw new Error('Claude declined to triage this batch');
  const raw = JSON.parse(response.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join(''));
  return Array.isArray(raw.decisions) ? raw.decisions : [];
}

/* ---------------------------------------------------------------- run */

export type ScanSummary = {
  since: string;
  until: string;
  fetched: { email: number; teams: number };
  skippedAutomated: number;
  created: number;
  followUps: number;
  commitments: number;
  inProgress: number;
  claimed: number;
  verified: number;
  none: number;
  errors: string[];
  decisions?: Array<Decision & { subject: string; from: string }>;
};

export async function runInboxScan(opts: { since?: string; dry?: boolean; lookbackHours?: number } = {}): Promise<ScanSummary> {
  if (!isGraphConfigured()) throw new Error('Microsoft Graph is not configured (AZURE_AD_* env vars)');
  const now = new Date();
  const fallback = new Date(now.getTime() - (opts.lookbackHours ?? 3) * 3600 * 1000).toISOString();
  const since = opts.since || (await getCursor('inbox')) || fallback;
  const summary: ScanSummary = {
    since,
    until: now.toISOString(),
    fetched: { email: 0, teams: 0 },
    skippedAutomated: 0,
    created: 0,
    followUps: 0,
    commitments: 0,
    inProgress: 0,
    claimed: 0,
    verified: 0,
    none: 0,
    errors: [],
    decisions: opts.dry ? [] : undefined,
  };

  const email = await fetchOutlook(since);
  const teams = await fetchTeams(since);
  if (teams.error) summary.errors.push(teams.error);
  summary.fetched = { email: email.length, teams: teams.messages.length };

  let messages = [...email, ...teams.messages].sort((a, b) => a.at.localeCompare(b.at));
  const before = messages.length;
  messages = messages.filter((m) => m.fromDirector || !isAutomated(m));
  summary.skippedAutomated = before - messages.length;

  if (!messages.length) {
    if (!opts.dry) await setCursor('inbox', now.toISOString());
    return summary;
  }

  const open = await openTasksForMatching();
  // Messages already turned into a task (re-delivery, overlapping window)
  const known = new Set(open.map((t) => t.source_ref).filter(Boolean) as string[]);

  for (let i = 0; i < messages.length; i += 25) {
    const batch = messages.slice(i, i + 25);
    let decisions: Decision[] = [];
    try {
      decisions = await decide(batch, open, now);
    } catch (err: any) {
      summary.errors.push(`Claude: ${err.message || err}`);
      continue;
    }
    for (const d of decisions) {
      const m = batch[d.message];
      if (!m) continue;
      if (opts.dry) {
        summary.decisions!.push({ ...d, subject: m.subject, from: `${m.fromName} <${m.fromEmail}>` });
      }
      try {
        if (d.action === 'none') {
          summary.none++;
          continue;
        }
        if (d.action === 'create') {
          if (!d.task?.title) continue;
          if (known.has(m.id)) continue;
          if (d.confidence < 40) {
            summary.none++;
            continue;
          }
          summary.created++;
          if (opts.dry) continue;
          const { task, created } = await upsertTask({
            title: d.task.title,
            notes: d.task.notes || null,
            source: m.channel,
            source_ref: m.id,
            source_link: m.link,
            conversation_id: m.conversationId,
            requester_name: d.task.requester_name || (m.fromDirector ? null : m.fromName),
            requester_email: d.task.requester_email || (m.fromDirector ? null : m.fromEmail),
            category: d.task.category,
            due_at: d.task.due_at || null,
            importance: d.task.importance === 'high' || m.flagged ? 'high' : 'normal',
            page_url: d.task.page_url || null,
            requested_at: m.at,
            actor: 'scan',
          });
          known.add(m.id);
          if (created) {
            open.push(task);
            await logEvent(task.id, 'note', `Why: ${d.reason}`, { confidence: d.confidence, actor: 'scan' });
            if (task.page_url) {
              const h = await hashPage(task.page_url);
              if (h) await setPageHash(task.id, h);
            }
          }
          continue;
        }
        // The rest act on an existing task
        const target = open.find((t) => t.id === d.task_id);
        if (!target) {
          summary.none++;
          continue;
        }
        if (d.action === 'follow_up') {
          summary.followUps++;
          if (!opts.dry) await recordFollowUp(target.id, { at: m.at, sourceRef: m.id, sourceLink: m.link, detail: `${m.fromName}: ${d.reason}`, dueAt: d.task?.due_at || null });
        } else if (d.action === 'commitment') {
          summary.commitments++;
          if (!opts.dry) await recordCommitment(target.id, { committedFor: d.committed_for || null, sourceRef: m.id, sourceLink: m.link, detail: d.reason });
        } else if (d.action === 'in_progress') {
          summary.inProgress++;
          if (!opts.dry) await recordInProgress(target.id, { sourceRef: m.id, sourceLink: m.link, detail: d.reason });
        } else if (d.action === 'claimed_done') {
          summary.claimed++;
          if (opts.dry) continue;
          await recordClaimedDone(target.id, { confidence: d.confidence, sourceRef: m.id, sourceLink: m.link, detail: d.reason });
          if (target.page_url) {
            const before = await getPageHash(target.id);
            const after = await hashPage(target.page_url);
            if (before && after && before !== after) {
              summary.verified++;
              await recordVerifiedDone(target.id, { confidence: Math.max(d.confidence, 85), detail: `The page at ${target.page_url} changed since the request came in.` });
            } else if (!before && after) {
              await setPageHash(target.id, after);
              await logEvent(target.id, 'note', 'No earlier snapshot of the page to compare against; left as claimed.', { actor: 'scan' });
            } else if (before && after && before === after) {
              await logEvent(target.id, 'note', `The page at ${target.page_url} looks unchanged; left as claimed, not done.`, { actor: 'scan' });
            }
          }
        }
      } catch (err: any) {
        summary.errors.push(`${m.subject}: ${err.message || err}`);
      }
    }
  }

  if (!opts.dry) {
    const last = messages[messages.length - 1]?.at || now.toISOString();
    // Move the cursor just past the newest message seen, so nothing is read twice
    await setCursor('inbox', new Date(new Date(last).getTime() + 1000).toISOString());
  }
  return summary;
}

/** Tasks whose commitment date has passed without completion. */
export function overdueCommitments(tasks: TaskRow[]): TaskRow[] {
  const now = Date.now();
  return tasks.filter((t) => t.status !== 'done' && t.committed_for && new Date(t.committed_for).getTime() < now);
}
