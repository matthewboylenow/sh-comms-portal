// app/lib/portal-task.ts
// Glue between portal requests and the Tasks tab. A new request creates a
// task; completing either side completes the other. Failures here are
// logged, never surfaced to the submitter.
import { useNeonDatabase } from './db';
import { upsertTask, setPortalTaskDone, openTasksForMatching, patchTask, type TaskCategory } from './db/services/portal-tasks';
import * as announcementsService from './db/services/announcements';
import * as websiteUpdatesService from './db/services/website-updates';
import * as smsRequestsService from './db/services/sms-requests';
import * as avRequestsService from './db/services/av-requests';
import * as flyerReviewsService from './db/services/flyer-reviews';
import * as graphicDesignService from './db/services/graphic-design';

export type PortalRequestKind = 'announcement' | 'website' | 'text' | 'av' | 'flyer' | 'design';

const CATEGORY: Record<PortalRequestKind, TaskCategory> = {
  announcement: 'bulletin',
  website: 'website',
  text: 'other',
  av: 'av',
  flyer: 'other',
  design: 'other',
};

const PORTAL_URL = process.env.NEXTAUTH_URL || 'https://comms.sainthelen.org';

/** The request id doubles as the task's source_ref, prefixed so it can never collide with an email id. */
export const portalRef = (id: string) => `portal:${id}`;

export async function createPortalTask(
  kind: PortalRequestKind,
  id: string,
  d: {
    title: string;
    requesterName?: string | null;
    requesterEmail?: string | null;
    dueAt?: string | Date | null;
    notes?: string | null;
    urgent?: boolean;
    pageUrl?: string | null;
    /** the request to open in the Inbox when the id carries an item suffix */
    openId?: string;
  }
): Promise<void> {
  if (!useNeonDatabase()) return;
  try {
    await upsertTask({
      title: d.title.trim().slice(0, 200),
      notes: d.notes?.trim() || null,
      source: 'portal',
      source_ref: portalRef(id),
      source_link: `${PORTAL_URL}/admin?open=${d.openId || id}`,
      page_url: d.pageUrl || null,
      actor: 'portal',
      requester_name: d.requesterName || null,
      requester_email: d.requesterEmail || null,
      category: CATEGORY[kind],
      due_at: d.dueAt ? new Date(d.dueAt).toISOString() : null,
      importance: d.urgent ? 'high' : 'normal',
    });
  } catch (err) {
    console.error('[tasks] could not create the task for a portal request:', err);
  }
}

/** Called by markCompleted so the matching task follows the request. */
export async function syncPortalTask(recordId: string, completed: boolean): Promise<void> {
  if (!useNeonDatabase()) return;
  try {
    await setPortalTaskDone(portalRef(recordId), completed);
    // Website updates may have one task per change
    const prefix = `${portalRef(recordId)}#`;
    const open = await openTasksForMatching();
    for (const t of open) if (t.source_ref?.startsWith(prefix) && completed) await patchTask(t.id, { status: 'done' }, 'portal');
    if (!completed) {
      // reopening a request reopens its item tasks too
      const { getTaskBySourceRefPrefix } = await import('./db/services/portal-tasks');
      for (const t of await getTaskBySourceRefPrefix(prefix)) if (t.status === 'done') await patchTask(t.id, { status: 'open' }, 'portal');
    }
  } catch (err) {
    console.error('[tasks] could not sync the task for a portal request:', err);
  }
}

/** Called by the tasks API so the request follows the task. */
export async function setRequestCompleted(sourceRef: string, completed: boolean): Promise<void> {
  const bare = sourceRef.replace(/^portal:/, '');
  if (!bare) return;
  // "portal:<updateId>#<n>" is one change on a website update: finish that item,
  // and the request only once every item is done.
  const m = bare.match(/^([0-9a-f-]{36})#(\d+)$/i);
  if (m) {
    const { getItems, setItemDone } = await import('./db/services/website-update-items');
    const items = await getItems(m[1]);
    const item = items.find((i) => i.position === Number(m[2]));
    if (item) await setItemDone(item.id, completed);
    const all = (await getItems(m[1])).every((i) => i.done);
    if (completed && all) await websiteUpdatesService.markCompleted(m[1], true);
    if (!completed) await websiteUpdatesService.markCompleted(m[1], false);
    return;
  }
  const id = bare;
  // We do not store which table the id belongs to; try each until one has it.
  const finders: Array<[() => Promise<unknown>, (c: boolean) => Promise<unknown>]> = [
    [() => announcementsService.getAnnouncementById(id), (c) => announcementsService.markCompleted(id, c)],
    [() => websiteUpdatesService.getWebsiteUpdateById(id), (c) => websiteUpdatesService.markCompleted(id, c)],
    [() => smsRequestsService.getSmsRequestById(id), (c) => smsRequestsService.markCompleted(id, c)],
    [() => avRequestsService.getAvRequestById(id), (c) => avRequestsService.markCompleted(id, c)],
    [() => flyerReviewsService.getFlyerReviewById(id), (c) => flyerReviewsService.markCompleted(id, c)],
    [() => graphicDesignService.getGraphicDesignRequestById(id), (c) => graphicDesignService.markCompleted(id, c)],
  ];
  for (const [find, mark] of finders) {
    const rec = await find().catch(() => null);
    if (rec) {
      await mark(completed);
      return;
    }
  }
}
