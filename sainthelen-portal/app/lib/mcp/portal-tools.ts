// app/lib/mcp/portal-tools.ts
//
// The tools the portal's MCP server exposes (see app/api/mcp/[token]/route.ts
// and README-mcp.md). Everything reads and writes the same Neon tables the
// admin UI uses, through the same Drizzle client, so a change made here shows
// up on the board straight away and vice versa.
//
// Text fields are never shortened. The only derived one-liner is `summary` on
// list_requests, which exists so a client can pick a row before calling
// get_request for the full text.
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/server';
import { and, desc, eq, gte, ilike, isNull, or, type SQL } from 'drizzle-orm';
import { db } from '../db';
import {
  announcements,
  avRequests,
  calendarReviews,
  flyerReviews,
  graphicDesignRequests,
  ministries,
  photoSubmissions,
  smsRequests,
  websiteUpdates,
} from '../db/schema';
import { getAllStages } from '../db/services/request-stages';
import { createAdminComment, getCommentsForRecord } from '../db/services/comments';
import { getItems, setAllItemsDone } from '../db/services/website-update-items';
import { ensureSchema as ensureWebsiteUpdatesSchema } from '../db/services/website-updates';
import { createNotification } from '../db/services/notifications';
import { syncPortalTask } from '../portal-task';

const PORTAL_URL = (process.env.NEXTAUTH_URL || 'https://comms.sainthelen.org').replace(/\/$/, '');
const NOTE_AUTHOR = 'Claude';
const TIME_ZONE = 'America/New_York';

// ---------------------------------------------------------------------------
// Request types
// ---------------------------------------------------------------------------

export const REQUEST_TYPES = [
  'announcement',
  'website_update',
  'graphic_design',
  'av_request',
  'sms_request',
  'flyer_review',
  'photo_submission',
] as const;
export type RequestType = (typeof REQUEST_TYPES)[number];

type Def = {
  table: any;
  /** The key the admin UI uses for this table in comments, stages and markCompleted. */
  uiKey: string;
  /** Human label for messages. */
  label: string;
  /** Whether the table has completed / completed_date columns. */
  completable: boolean;
};

const DEFS: Record<RequestType, Def> = {
  announcement: { table: announcements, uiKey: 'announcements', label: 'Announcement', completable: true },
  website_update: { table: websiteUpdates, uiKey: 'websiteUpdates', label: 'Website update', completable: true },
  graphic_design: { table: graphicDesignRequests, uiKey: 'graphicDesign', label: 'Graphic design request', completable: true },
  av_request: { table: avRequests, uiKey: 'avRequests', label: 'A/V request', completable: true },
  sms_request: { table: smsRequests, uiKey: 'smsRequests', label: 'Text message request', completable: true },
  flyer_review: { table: flyerReviews, uiKey: 'flyerReviews', label: 'Flyer review', completable: true },
  photo_submission: { table: photoSubmissions, uiKey: 'photoSubmissions', label: 'Photo submission', completable: false },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Today's date (YYYY-MM-DD) in the parish's time zone. */
function todayLocal(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

function addDays(ymd: string, days: number): string {
  const d = new Date(`${ymd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function iso(v: unknown): string | null {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

/** Make a stored link absolute. Relative links are served by the portal itself. */
function absolute(url: string | null | undefined): string | null {
  if (!url) return null;
  const s = String(url).trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('/')) return `${PORTAL_URL}${s}`;
  return `https://${s}`;
}

function absoluteList(urls: unknown): string[] {
  if (!Array.isArray(urls)) return [];
  return urls.map((u) => absolute(typeof u === 'string' ? u : (u as any)?.url)).filter((u): u is string => !!u);
}

type Link = { label: string | null; url: string };

/** Every sign-up style link a row carries, deduplicated, absolute. */
function signUpLinks(row: any): Link[] {
  const out: Link[] = [];
  const seen = new Set<string>();
  const push = (label: string | null, url: unknown) => {
    const abs = absolute(typeof url === 'string' ? url : null);
    if (!abs || seen.has(abs)) return;
    seen.add(abs);
    out.push({ label, url: abs });
  };
  if (Array.isArray(row.signUpLinks)) for (const l of row.signUpLinks) push(l?.label || null, l?.url);
  push(null, row.signUpUrl);
  push('Calendar sign-up', row.calendarEventSignUpLink);
  return out;
}

/** One line, for the list view only. */
function oneLine(text: unknown, max = 160): string {
  const s = String(text ?? '').replace(/\s+/g, ' ').trim();
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

/** camelCase row -> snake_case keys, Dates -> ISO strings. */
function snake(row: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(row)) {
    const key = k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
    out[key] = v instanceof Date ? v.toISOString() : v;
  }
  return out;
}

function adminUrl(id: string): string {
  return `${PORTAL_URL}/admin?open=${id}`;
}

/** Date fields a list row should surface, per type. */
function dateFields(type: RequestType, r: any): Record<string, unknown> {
  switch (type) {
    case 'announcement':
      return {
        promotion_start_date: r.promotionStartDate ?? null,
        date_of_event: r.dateOfEvent ?? null,
        time_of_event: r.timeOfEvent ?? null,
        event_dates: r.eventDates ?? [],
        calendar_event_date: r.calendarEventDate ?? null,
      };
    case 'graphic_design':
      return { deadline: r.deadline ?? null };
    case 'av_request':
      return { date_time_entries: r.dateTimeEntries ?? [], event_dates_and_times: r.eventDatesAndTimes ?? null };
    case 'sms_request':
      return { requested_date: r.requestedDate ?? null };
    case 'flyer_review':
      return { event_date: r.eventDate ?? null };
    case 'photo_submission':
      return { photo_date: r.photoDate ?? null };
    default:
      return {};
  }
}

function summaryFor(type: RequestType, r: any): string {
  switch (type) {
    case 'announcement':
      return oneLine(r.announcementBody);
    case 'website_update':
      return oneLine(`${r.newPage ? 'New page: ' : ''}${r.pageToUpdate} — ${r.description}`);
    case 'graphic_design':
      return oneLine(`${r.projectType}: ${r.projectDescription}`);
    case 'av_request':
      return oneLine(`${r.eventName} at ${r.location}${r.needsLivestream ? ' (livestream)' : ''}: ${r.description}`);
    case 'sms_request':
      return oneLine(r.smsMessage);
    case 'flyer_review':
      return oneLine(`${r.eventName}${r.feedbackNeeded ? ': ' + r.feedbackNeeded : ''}`);
    case 'photo_submission':
      return oneLine(r.description);
  }
}

function listRow(type: RequestType, r: any, stages: Map<string, { stage: string | null; flag: string | null }>) {
  const def = DEFS[type];
  const st = stages.get(`${def.uiKey}:${r.id}`);
  const row: Record<string, unknown> = {
    id: r.id,
    type,
    submitter_name: r.name ?? r.submitterName ?? null,
    submitter_email: r.email ?? null,
    ministry: r.ministry ?? null,
    created_at: iso(r.createdAt ?? r.submittedAt),
    completed: def.completable ? !!r.completed : null,
    completed_date: def.completable ? iso(r.completedDate) : null,
    summary: summaryFor(type, r),
    ...dateFields(type, r),
    board_stage: st?.stage ?? null,
    flagged_for_pastor: st?.flag === 'msgr',
    admin_url: adminUrl(r.id),
  };
  if (type === 'announcement') {
    row.platforms = r.platforms ?? [];
    row.approval_status = r.approvalStatus;
    row.requires_approval = r.requiresApproval;
  }
  if (type === 'website_update') row.urgent = r.urgent;
  if (type === 'graphic_design') {
    row.priority = r.priority;
    row.status = r.status;
  }
  if (type === 'flyer_review') {
    row.urgency = r.urgency;
    row.status = r.status;
  }
  return row;
}

function text(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

function fail(message: string) {
  return { isError: true, content: [{ type: 'text' as const, text: JSON.stringify({ error: message }) }] };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function fetchRow(type: RequestType, id: string): Promise<any | undefined> {
  if (!UUID.test(id)) return undefined;
  if (type === 'website_update') await ensureWebsiteUpdatesSchema();
  const t = DEFS[type].table;
  const rows = await db.select().from(t).where(eq(t.id, id)).limit(1);
  return rows[0];
}

/** Notes on a request, oldest first. Staff comments and Claude's notes both live here. */
async function notesFor(type: RequestType, id: string) {
  const rows = await getCommentsForRecord(id, DEFS[type].uiKey);
  return rows.map((c) => ({
    id: c.id,
    created_at: iso(c.createdAt),
    author: c.adminUser || c.publicName || null,
    author_email: c.publicEmail || null,
    from_submitter: c.isPublic,
    text: c.message,
  }));
}

// ---------------------------------------------------------------------------
// Tool registration
// ---------------------------------------------------------------------------

const COLUMN_GLOSSARY = `Column meanings (shared by every request type):
- id: the request's UUID. Pass it back to get_request, mark_complete and add_note.
- type: which kind of request this is (announcement, website_update, graphic_design, av_request, sms_request, flyer_review, photo_submission).
- submitter_name / submitter_email: the staff member or volunteer who filled in the form. Not a public contact.
- ministry: the ministry they chose from the list, as typed.
- created_at: when the form was submitted (ISO 8601, UTC).
- completed / completed_date: whether the office has finished the request and when. Photo submissions have no completed flag (null).
- summary: a one-line digest for picking a row. Use get_request for the full text.
- board_stage: where the card sits on the admin board: null = needs review, "approved" = approved by the office, "published" = done and off the inbox.
- flagged_for_pastor: true when the office marked it "Review with Msgr. Tom".
- admin_url: opens the request in the portal.
Type-specific list columns: announcements add promotion_start_date (first date the item should run), date_of_event / time_of_event (the main occurrence), event_dates (extra occurrences), calendar_event_date, platforms (channels requested: "Bulletin", "Email Blast" = the Wednesday email, "Church Screens"), approval_status (pending / approved / rejected for ministries that need coordinator sign-off) and requires_approval. Website updates add urgent. Graphic design adds deadline, priority and status. A/V adds date_time_entries (each with date, startTime, endTime). Text messages add requested_date (the day the text should go out). Flyer reviews add event_date, urgency and status. Photo submissions add photo_date.`;

export function registerPortalTools(server: McpServer) {
  server.registerTool(
    'list_requests',
    {
      title: 'List portal requests',
      description: `List requests submitted through the Saint Helen Communications Portal. Defaults: type "all", status "open" (not yet completed), since = 60 days ago, limit 100. "since" filters on created_at (submission time), so use a wider window to find older open items. Results are newest first.\n\n${COLUMN_GLOSSARY}`,
      inputSchema: z.object({
        type: z.enum([...REQUEST_TYPES, 'all']).optional().describe('Which request table to read, or "all" (default).'),
        status: z.enum(['open', 'completed', 'all']).optional().describe('"open" = not completed (default), "completed", or "all".'),
        since: z.string().optional().describe('ISO date or date-time. Only requests submitted at or after this moment. Default: 60 days ago.'),
        limit: z.number().int().min(1).max(500).optional().describe('Maximum rows to return across all types (default 100).'),
      }),
    },
    async ({ type, status, since, limit }) => {
      const types: RequestType[] = !type || type === 'all' ? [...REQUEST_TYPES] : [type];
      const cap = limit ?? 100;
      const sinceDate = since ? new Date(since) : new Date(Date.now() - 60 * 24 * 3600 * 1000);
      if (Number.isNaN(sinceDate.getTime())) return fail(`"since" is not a date: ${since}`);
      const want = status ?? 'open';
      await ensureWebsiteUpdatesSchema();
      const stages = await getAllStages().catch(() => new Map());
      const rows: ReturnType<typeof listRow>[] = [];
      for (const t of types) {
        const def = DEFS[t];
        const tbl = def.table;
        const conds: SQL[] = [gte(tbl.createdAt, sinceDate)];
        if (def.completable && want === 'open') conds.push(or(eq(tbl.completed, false), isNull(tbl.completed))!);
        if (def.completable && want === 'completed') conds.push(eq(tbl.completed, true));
        if (!def.completable && want === 'completed') continue; // photos are never "completed"
        const found = await db.select().from(tbl).where(and(...conds)).orderBy(desc(tbl.createdAt)).limit(cap);
        for (const r of found) rows.push(listRow(t, r, stages));
      }
      rows.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
      const out = rows.slice(0, cap);
      return text({ count: out.length, truncated: rows.length > cap, since: sinceDate.toISOString(), status: want, requests: out });
    }
  );

  server.registerTool(
    'get_request',
    {
      title: 'Get one request in full',
      description: `The complete record for one request: every column (snake_case, full untruncated text), plus:
- sign_up_links: every sign-up / registration link the submitter gave, absolute URLs, with labels when provided.
- file_links: attached files (fliers, photos, documents) as absolute URLs.
- notes: staff comments and Claude's notes on this request, oldest first (author, text, created_at; from_submitter marks replies the requester wrote).
- For website updates: changes[] (the individual edits requested, each with done / done_at) and new_page (the submitter asked for a page that does not exist yet).
- For announcements: calendar_review (the parish-calendar event derived from the request, if one was asked for, including the published WordPress event URL) and the social-media consideration fields.
Key announcement columns: announcement_body is the copy as submitted; publication_notes are instructions to the office; platforms lists the channels requested; approval_status / approved_by / rejection_reason track coordinator sign-off; wordpress_event_url is the calendar event once published.
Key website update columns: page_to_update is the sainthelen.org URL to edit; description is the full request; urgent flags same-week changes.
A/V: event_name, location, date_time_entries, needs_livestream, av_needs, expected_attendees, additional_notes.
Text messages: sms_message (160 chars max), requested_date, additional_info.
Flyer reviews: event_name, event_date, target_audience, purpose, feedback_needed, urgency, status.
Graphic design: project_type, project_description, deadline, priority, required_dimensions, status.
Photo submissions: submitter_name, description, photo_date, privacy_concern / privacy_notes (someone pictured should not be shown publicly).`,
      inputSchema: z.object({
        type: z.enum(REQUEST_TYPES).describe('The request type, as returned by list_requests.'),
        id: z.string().describe('The request UUID.'),
      }),
    },
    async ({ type, id }) => {
      const r = await fetchRow(type, id);
      if (!r) return fail(`No ${DEFS[type].label.toLowerCase()} with id ${id}`);
      const stages = await getAllStages().catch(() => new Map());
      const st = stages.get(`${DEFS[type].uiKey}:${id}`);
      const out: Record<string, unknown> = {
        ...snake(r),
        type,
        file_links: absoluteList(r.fileLinks),
        sign_up_links: signUpLinks(r),
        board_stage: st?.stage ?? null,
        flagged_for_pastor: st?.flag === 'msgr',
        admin_url: adminUrl(id),
        notes: await notesFor(type, id),
      };
      if (type === 'website_update') {
        const items = await getItems(id).catch(() => []);
        out.changes = items.map((i) => ({ position: i.position, text: i.text, done: i.done, done_at: iso(i.doneAt) }));
      }
      if (type === 'announcement') {
        const [cr] = await db.select().from(calendarReviews).where(eq(calendarReviews.announcementId, id)).orderBy(desc(calendarReviews.createdAt)).limit(1);
        out.calendar_review = cr
          ? {
              status: cr.status,
              event: cr.cleaned || cr.original,
              as_submitted: cr.original,
              changes: cr.changes ?? [],
              concerns: cr.concerns ?? [],
              wordpress_event_url: cr.wordpressEventUrl,
              published_at: iso(cr.publishedAt),
            }
          : null;
      }
      return text(out);
    }
  );

  server.registerTool(
    'list_announcements',
    {
      title: 'List announcements with run dates and channels',
      description: `Announcements with the dates they run and the channels they were requested for. Built for assembling the Wednesday email blast and the bulletin.
window (default "upcoming"):
- "upcoming": the event happens in the next 30 days (date_of_event, any event_dates entry, or calendar_event_date), or the announcement has no event date but was submitted in the last 30 days.
- "current": should be running now: promotion_start_date is unset, already passed, or falls within the next 7 days (the office enters the first weekend an item runs, so a Wednesday run picks up items that start that Saturday), and the event has not yet passed (or has no date). This is the set to put in this week's email.
- "all": no date filter.
channel filters to announcements whose platforms include it (case-insensitive substring), e.g. "Email Blast" (the Wednesday email), "Bulletin", "Church Screens".
Completed announcements are left out unless include_completed is true. Announcements whose coordinator approval is still pending or was rejected are included but marked by approval_status; do not publish anything with approval_status "rejected", and treat "pending" with requires_approval true as not yet cleared.
Each row has the full announcement_body (never shortened), ministry, submitter, promotion_start_date (first week it should appear), date_of_event / time_of_event, event_dates (extra occurrences), platforms, sign_up_links, file_links, publication_notes, approval_status, requires_approval, add_to_events_calendar, calendar_event_* fields, wordpress_event_url, social_consideration (the office may post it on social; not a promise), board_stage, flagged_for_pastor, completed and admin_url.`,
      inputSchema: z.object({
        window: z.enum(['upcoming', 'current', 'all']).optional().describe('Date window (default "upcoming", the next 30 days).'),
        channel: z.string().optional().describe('Only announcements requested for this channel, e.g. "Email Blast", "Bulletin", "Church Screens".'),
        include_completed: z.boolean().optional().describe('Include announcements the office has marked completed (default false).'),
        limit: z.number().int().min(1).max(500).optional().describe('Maximum rows (default 200).'),
      }),
    },
    async ({ window, channel, include_completed, limit }) => {
      const win = window ?? 'upcoming';
      const today = todayLocal();
      const horizon = addDays(today, 30);
      const recent = addDays(today, -30);
      const conds: SQL[] = [];
      if (!include_completed) conds.push(or(eq(announcements.completed, false), isNull(announcements.completed))!);
      // Keep the DB filter loose (submitted in the last 180 days or event still ahead) and
      // apply the window in code, since event_dates is JSON.
      if (win !== 'all') conds.push(or(gte(announcements.createdAt, new Date(`${addDays(today, -180)}T00:00:00Z`)), gte(announcements.dateOfEvent, today))!);
      const rows = await db
        .select()
        .from(announcements)
        .where(conds.length ? and(...conds) : undefined)
        .orderBy(desc(announcements.createdAt));
      const stages = await getAllStages().catch(() => new Map());
      const needle = channel?.trim().toLowerCase();

      const eventDays = (r: any): string[] => {
        const days = new Set<string>();
        if (r.dateOfEvent) days.add(String(r.dateOfEvent));
        if (r.calendarEventDate) days.add(String(r.calendarEventDate));
        if (Array.isArray(r.eventDates)) for (const e of r.eventDates) if (e?.date) days.add(String(e.date));
        return [...days].sort();
      };

      const keep = rows.filter((r) => {
        if (needle && !(r.platforms || []).some((p) => String(p).toLowerCase().includes(needle))) return false;
        const days = eventDays(r);
        const last = days[days.length - 1];
        const submitted = (r.submittedAt || r.createdAt).toISOString().slice(0, 10);
        if (win === 'upcoming') {
          if (!days.length) return submitted >= recent;
          return days.some((d) => d >= today && d <= horizon);
        }
        if (win === 'current') {
          const started = !r.promotionStartDate || String(r.promotionStartDate) <= addDays(today, 7);
          const notPast = !last || last >= today;
          return started && notPast;
        }
        return true;
      });

      const out = keep.slice(0, limit ?? 200).map((r) => {
        const st = stages.get(`announcements:${r.id}`);
        return {
          id: r.id,
          submitter_name: r.name,
          submitter_email: r.email,
          ministry: r.ministry,
          submitted_at: iso(r.submittedAt || r.createdAt),
          announcement_body: r.announcementBody,
          publication_notes: r.publicationNotes,
          promotion_start_date: r.promotionStartDate,
          date_of_event: r.dateOfEvent,
          time_of_event: r.timeOfEvent,
          event_dates: r.eventDates ?? [],
          all_event_days: eventDays(r),
          platforms: r.platforms ?? [],
          sign_up_links: signUpLinks(r),
          file_links: absoluteList(r.fileLinks),
          approval_status: r.approvalStatus,
          requires_approval: r.requiresApproval,
          approved_by: r.approvedBy,
          rejection_reason: r.rejectionReason,
          add_to_events_calendar: r.addToEventsCalendar,
          calendar_event_name: r.calendarEventName,
          calendar_event_date: r.calendarEventDate,
          calendar_event_start_time: r.calendarEventStartTime,
          calendar_event_end_time: r.calendarEventEndTime,
          calendar_event_location: r.calendarEventLocation,
          calendar_event_description: r.calendarEventDescription,
          external_event: r.externalEvent,
          wordpress_event_url: r.wordpressEventUrl,
          social_consideration: r.socialConsideration,
          social_what_to_know: r.socialWhatToKnow,
          social_has_photos: r.socialHasPhotos,
          completed: !!r.completed,
          completed_date: iso(r.completedDate),
          board_stage: st?.stage ?? null,
          flagged_for_pastor: st?.flag === 'msgr',
          admin_url: adminUrl(r.id),
        };
      });
      return text({ window: win, today, count: out.length, truncated: keep.length > out.length, announcements: out });
    }
  );

  server.registerTool(
    'list_ministries',
    {
      title: 'List ministries',
      description: `The parish ministries the forms offer. Columns: id (UUID), name, description, aliases (other names people type for it, comma separated), contact (the approval coordinator responsible when requires_approval is true; the table stores a role key, not a person's email), requires_approval (announcements from this ministry need that coordinator's sign-off before publishing), active (inactive ministries are hidden from the forms). search matches name, aliases and description, case-insensitive.`,
      inputSchema: z.object({
        search: z.string().optional().describe('Case-insensitive text to match against name, aliases and description.'),
        include_inactive: z.boolean().optional().describe('Also return ministries hidden from the forms (default false).'),
      }),
    },
    async ({ search, include_inactive }) => {
      const conds: SQL[] = [];
      if (!include_inactive) conds.push(eq(ministries.active, true));
      if (search?.trim()) {
        const pat = `%${search.trim()}%`;
        conds.push(or(ilike(ministries.name, pat), ilike(ministries.aliases, pat), ilike(ministries.description, pat))!);
      }
      const rows = await db
        .select()
        .from(ministries)
        .where(conds.length ? and(...conds) : undefined)
        .orderBy(ministries.name);
      return text({
        count: rows.length,
        ministries: rows.map((m) => ({
          id: m.id,
          name: m.name,
          description: m.description,
          aliases: m.aliases,
          contact: m.approvalCoordinator,
          requires_approval: m.requiresApproval,
          active: m.active,
        })),
      });
    }
  );

  server.registerTool(
    'mark_complete',
    {
      title: 'Mark a request complete (or reopen it)',
      description: `Set a request's completed flag. completed=true stamps completed_date with now, moves the card off the admin inbox, finishes any linked Tasks-tab item and tells the submitter in their portal notifications; completed=false clears completed_date and reopens it. For website updates every individual change is marked done (or reopened) together. Photo submissions cannot be completed.`,
      inputSchema: z.object({
        type: z.enum(REQUEST_TYPES).describe('The request type.'),
        id: z.string().describe('The request UUID.'),
        completed: z.boolean().describe('true to complete, false to reopen.'),
      }),
    },
    async ({ type, id, completed }) => {
      const def = DEFS[type];
      if (!def.completable) return fail(`${def.label}s have no completed flag.`);
      const before = await fetchRow(type, id);
      if (!before) return fail(`No ${def.label.toLowerCase()} with id ${id}`);
      const tbl = def.table;
      const [after] = await db
        .update(tbl)
        .set({ completed, completedDate: completed ? new Date() : null })
        .where(eq(tbl.id, id))
        .returning();
      if (type === 'website_update') await setAllItemsDone(id, completed).catch(() => {});
      await syncPortalTask(id, completed);
      if (before.email) {
        const title =
          before.eventName || before.pageToUpdate || before.projectType || (type === 'announcement' ? before.name : null) || def.label;
        await createNotification({
          userEmail: before.email,
          type: completed ? 'success' : 'info',
          message: completed ? `Your ${def.label.toLowerCase()} "${title}" has been completed` : `Your ${def.label.toLowerCase()} "${title}" is now in progress`,
          relatedRecordId: id,
          relatedRecordType: def.uiKey,
        }).catch((err) => console.error('[mcp] notification failed:', err));
      }
      return text({ ok: true, id, type, completed: !!after.completed, completed_date: iso(after.completedDate), admin_url: adminUrl(id) });
    }
  );

  server.registerTool(
    'add_note',
    {
      title: 'Add a note to a request',
      description: `Append an internal note to a request, authored as "${NOTE_AUTHOR}", so staff can see in the portal what was done (for example "Added to the 12 Nov email blast" or "Page updated, new PDF linked"). Notes appear in the request's comments in the admin panel and are returned by get_request under notes. They are internal: the submitter is not emailed.`,
      inputSchema: z.object({
        type: z.enum(REQUEST_TYPES).describe('The request type.'),
        id: z.string().describe('The request UUID.'),
        text: z.string().min(1).describe('The note. Plain text; line breaks are kept.'),
      }),
    },
    async ({ type, id, text: body }) => {
      const row = await fetchRow(type, id);
      if (!row) return fail(`No ${DEFS[type].label.toLowerCase()} with id ${id}`);
      const c = await createAdminComment(id, DEFS[type].uiKey, body.trim(), NOTE_AUTHOR);
      return text({ ok: true, note: { id: c.id, created_at: iso(c.createdAt), author: c.adminUser, text: c.message }, admin_url: adminUrl(id) });
    }
  );
}
