// app/lib/requests.ts
//
// One shape for every kind of request the office handles, built from the six
// record types the admin API returns. The board, the list, the week run-sheet
// and the detail panel all read this, so a request looks and behaves the same
// whether it started as an announcement or an A/V form.

export type RequestType = 'announcement' | 'website' | 'text' | 'av' | 'design' | 'photo';

/** Where a request is in the office's week. */
export type RequestStatus =
  | 'new' // just arrived, nobody has opened it
  | 'review' // the office is on it
  | 'approval' // blocked: waiting on a ministry coordinator
  | 'approved' // ready to run
  | 'done';

export const REQUEST_TYPES: Record<
  RequestType,
  { label: string; plural: string; table: ApiTable; cssVar: string; href: string }
> = {
  announcement: { label: 'Announcement', plural: 'Announcements', table: 'announcements', cssVar: '--t-ann', href: '/announcements' },
  website: { label: 'Website update', plural: 'Website updates', table: 'websiteUpdates', cssVar: '--t-web', href: '/website-updates' },
  text: { label: 'Text message', plural: 'Text messages', table: 'smsRequests', cssVar: '--t-text', href: '/sms-requests' },
  av: { label: 'A/V', plural: 'A/V requests', table: 'avRequests', cssVar: '--t-av', href: '/av-requests' },
  design: { label: 'Flier or design', plural: 'Fliers & design', table: 'graphicDesign', cssVar: '--t-design', href: '/graphic-design' },
  photo: { label: 'Shared photos', plural: 'Shared photos', table: 'photoSubmissions', cssVar: '--t-photo', href: '/share-photos' },
};

export type ApiTable =
  | 'announcements'
  | 'websiteUpdates'
  | 'smsRequests'
  | 'avRequests'
  | 'flyerReviews'
  | 'graphicDesign'
  | 'photoSubmissions';

/** The words the office sees. */
export const STATUS_LABEL: Record<RequestStatus, string> = {
  new: 'Just arrived',
  review: 'Needs review',
  approval: 'Needs approval',
  approved: 'Approved',
  done: 'Published',
};

/** The words a submitter sees for the same states. */
export const PUBLIC_STATUS_LABEL: Record<RequestStatus, string> = {
  new: 'Received',
  review: 'Being reviewed',
  approval: 'Being reviewed',
  approved: 'Approved',
  done: 'Done',
};

export type ApiRecord = { id: string; fields: Record<string, any> };

export type PortalRequest = {
  id: string;
  type: RequestType;
  /** which admin API table it came from (flyer reviews are a design type) */
  table: ApiTable;
  title: string;
  requester: string;
  email: string;
  ministry: string;
  status: RequestStatus;
  requiresApproval: boolean;
  approvalStatus?: string; // pending | approved | rejected
  stage?: 'review' | 'approved'; // set by dragging on the board
  completed: boolean;
  submittedAt: string | null; // ISO
  completedAt: string | null; // ISO
  /** when it should run: the publication weekend for announcements, requested date for texts */
  runsOn: string | null; // YYYY-MM-DD
  runsLabel: string; // "Oct 10–11", "Oct 6", "—"
  platforms: string[];
  body: string; // the copy, request text, or message
  words: number;
  chars: number;
  files: string[];
  calendar: 'none' | 'requested' | 'draft' | 'published';
  wordpressEventUrl?: string;
  eventLabel?: string; // "Sat Oct 17, 5:00 PM · Gathering Space"
  page?: string; // website updates
  notes?: string; // publication notes / additional info
  urgent?: boolean;
  raw: ApiRecord;
};

const TABLE_TO_TYPE: Record<ApiTable, RequestType> = {
  announcements: 'announcement',
  websiteUpdates: 'website',
  smsRequests: 'text',
  avRequests: 'av',
  flyerReviews: 'design',
  graphicDesign: 'design',
  photoSubmissions: 'photo',
};

const str = (v: unknown) => (v === undefined || v === null ? '' : String(v).trim());
const list = (v: unknown): string[] =>
  Array.isArray(v) ? v.map(String).filter(Boolean) : typeof v === 'string' ? v.split('\n').map((s) => s.trim()).filter(Boolean) : [];

export function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

/** A weekend label from the Saturday or Sunday date: "Oct 10–11". */
export function weekendLabel(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return '—';
  // normalise to the Saturday
  const day = d.getUTCDay(); // 0 Sun … 6 Sat
  const sat = new Date(d);
  if (day === 0) sat.setUTCDate(d.getUTCDate() - 1);
  else if (day !== 6) sat.setUTCDate(d.getUTCDate() + (6 - day));
  const sun = new Date(sat);
  sun.setUTCDate(sat.getUTCDate() + 1);
  const m = (x: Date) => x.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
  return m(sat) === m(sun)
    ? `${m(sat)} ${sat.getUTCDate()}–${sun.getUTCDate()}`
    : `${m(sat)} ${sat.getUTCDate()}–${m(sun)} ${sun.getUTCDate()}`;
}

export function shortDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: iso.length === 10 ? 'UTC' : undefined });
}

/** "2h ago", "Yesterday", "Sep 24" */
export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return shortDate(iso);
}

function fmtTime(t: string): string {
  const m = t.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return t;
  const h = Number(m[1]);
  return `${h % 12 || 12}:${m[2]} ${h >= 12 ? 'PM' : 'AM'}`;
}

function eventLabelFor(f: Record<string, any>): string | undefined {
  const dates: Array<{ date: string; time?: string }> =
    Array.isArray(f['Event Dates']) && f['Event Dates'].length
      ? f['Event Dates']
      : f['Date of Event']
        ? [{ date: f['Date of Event'], time: f['Time of Event'] }]
        : [];
  if (!dates.length) return undefined;
  const parts = dates.slice(0, 3).map((d) => {
    const day = new Date(`${String(d.date).slice(0, 10)}T12:00:00Z`).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
    return d.time ? `${day}, ${fmtTime(String(d.time))}` : day;
  });
  const where = str(f['Calendar Event Location']);
  return parts.join(' · ') + (dates.length > 3 ? ` · +${dates.length - 3}` : '') + (where ? ` · ${where}` : '');
}

/** Status is derived, not stored: the record's own flags decide it. */
function statusOf(f: Record<string, any>, type: RequestType): RequestStatus {
  if (f.Completed === true || f.Completed === 'Yes') return 'done';
  const approval = str(f['Approval Status']).toLowerCase();
  const requires = f['Requires Approval'] === true || f['Requires Approval'] === 'Yes';
  if (requires && approval === 'pending') return 'approval';
  // Where the office dragged the card wins over everything but completion and a pending approval
  if (f.Stage === 'approved') return 'approved';
  if (f.Stage === 'review') return 'review';
  if (requires && approval === 'rejected') return 'review';
  const s = str(f.Status).toLowerCase();
  if (type === 'design') {
    if (/complete|done|delivered/.test(s)) return 'done';
    if (/progress|working|design/.test(s)) return 'approved';
  }
  if (requires && approval === 'approved') return 'approved';
  // Nothing has touched it yet
  const sent = f['Submitted At'] || f['Created At'];
  if (sent && Date.now() - new Date(sent).getTime() < 48 * 3600 * 1000 && !f['Promotion Start Date']) return 'new';
  if (sent && Date.now() - new Date(sent).getTime() < 24 * 3600 * 1000) return 'new';
  return 'review';
}

export function toRequest(table: ApiTable, rec: ApiRecord): PortalRequest {
  const f = rec.fields || {};
  const type = TABLE_TO_TYPE[table];
  const submittedAt = str(f['Submitted At'] || f['Created At']) || null;
  const files = list(f['File Links']);

  let title = '';
  let body = '';
  let runsOn: string | null = null;
  let runsLabel = '—';
  let page: string | undefined;
  let notes: string | undefined;
  let eventLabel: string | undefined;

  switch (table) {
    case 'announcements':
      title = str(f['Calendar Event Name']) || str(f['Announcement Body']).split(/[.!?\n]/)[0].slice(0, 80) || 'Announcement';
      body = str(f['Announcement Body']);
      runsOn = str(f['Promotion Start Date']).slice(0, 10) || null;
      runsLabel = weekendLabel(runsOn);
      notes = str(f['Publication Notes']) || undefined;
      eventLabel = eventLabelFor(f);
      break;
    case 'websiteUpdates':
      page = str(f['Page to Update']) || undefined;
      body = str(f.Description);
      title = body.split(/[.!?\n]/)[0].slice(0, 80) || (page ? `Update ${page}` : 'Website update');
      break;
    case 'smsRequests':
      title = str(f['SMS Message']).slice(0, 80) || 'Text message';
      body = str(f['SMS Message']);
      runsOn = str(f['Requested Date']).slice(0, 10) || null;
      runsLabel = shortDate(runsOn);
      notes = str(f['Additional Info']) || undefined;
      break;
    case 'avRequests': {
      title = str(f['Event Name']) || 'A/V request';
      body = str(f.Description);
      notes = [str(f['A/V Needs']), str(f['Additional Notes'])].filter(Boolean).join('\n\n') || undefined;
      try {
        const entries = JSON.parse(str(f['Event Dates and Times']) || '[]');
        const first = Array.isArray(entries) && entries[0];
        if (first?.date) {
          runsOn = String(first.date).slice(0, 10);
          runsLabel = shortDate(runsOn);
        }
      } catch {
        /* older rows store free text */
      }
      const where = str(f.Location);
      eventLabel = [runsLabel !== '—' ? runsLabel : '', where].filter(Boolean).join(' · ') || undefined;
      break;
    }
    case 'flyerReviews':
      title = str(f['Event Name']) ? `${f['Event Name']} flier` : 'Flier review';
      body = [str(f.Purpose), str(f['Feedback Needed'])].filter(Boolean).join('\n\n');
      runsOn = str(f['Event Date']).slice(0, 10) || null;
      runsLabel = shortDate(runsOn);
      break;
    case 'graphicDesign':
      title = str(f['Project Type']) ? `${f['Project Type']}` : 'Design request';
      body = str(f['Project Description']);
      runsOn = str(f.Deadline).slice(0, 10) || null;
      runsLabel = shortDate(runsOn);
      break;
    case 'photoSubmissions':
      title = str(f.Description).split(/[.!?\n]/)[0].slice(0, 80) || 'Shared photos';
      body = str(f.Description);
      break;
  }

  const calendar: PortalRequest['calendar'] = f['WordPress Event ID']
    ? 'published'
    : f['Add to Events Calendar'] === 'Yes' || f['Add to Events Calendar'] === true
      ? 'requested'
      : 'none';

  return {
    id: rec.id,
    type,
    table,
    title,
    requester: str(f.Name) || str(f['Submitter Name']) || 'Unknown',
    email: str(f.Email),
    ministry: str(f.Ministry),
    status: statusOf(f, type),
    requiresApproval: f['Requires Approval'] === true || f['Requires Approval'] === 'Yes',
    approvalStatus: str(f['Approval Status']) || undefined,
    stage: f.Stage === 'approved' || f.Stage === 'review' ? f.Stage : undefined,
    completed: f.Completed === true || f.Completed === 'Yes',
    submittedAt,
    completedAt: str(f['Completed Date']) || null,
    runsOn,
    runsLabel,
    platforms: list(f.Platforms),
    body,
    words: wordCount(body),
    chars: body.length,
    files,
    calendar,
    wordpressEventUrl: str(f['WordPress Event URL']) || undefined,
    eventLabel,
    page,
    notes,
    urgent: f.Urgent === 'Yes' || f.Urgent === true || /urgent|rush/i.test(str(f.Urgency) + str(f.Priority)),
    raw: rec,
  };
}

/** Flatten the admin API payload into one list, newest first. */
export function toRequests(payload: Partial<Record<ApiTable, ApiRecord[]>>): PortalRequest[] {
  const out: PortalRequest[] = [];
  (Object.keys(payload) as ApiTable[]).forEach((table) => {
    if (!TABLE_TO_TYPE[table]) return;
    (payload[table] || []).forEach((rec) => out.push(toRequest(table, rec)));
  });
  return out.sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''));
}

/** The coming publication weekend (Saturday) as YYYY-MM-DD, in parish time. */
export function nextWeekendIso(from = new Date()): string {
  const ny = new Date(from.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day = ny.getDay();
  const add = day === 6 ? 0 : day === 0 ? -1 : 6 - day;
  ny.setDate(ny.getDate() + add);
  return ny.toISOString().slice(0, 10);
}

export function sameWeekend(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  return weekendLabel(a) === weekendLabel(b);
}
