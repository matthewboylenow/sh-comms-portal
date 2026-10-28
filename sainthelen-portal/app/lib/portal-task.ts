// app/lib/portal-task.ts
// Glue between portal requests and the Tasks tab. A new request creates a
// task; completing either side completes the other. Failures here are
// logged, never surfaced to the submitter.
import { useNeonDatabase } from './db';
import { upsertTask, setPortalTaskDone, type TaskCategory } from './db/services/portal-tasks';
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
  d: { title: string; requesterName?: string | null; requesterEmail?: string | null; dueAt?: string | Date | null; notes?: string | null; urgent?: boolean }
): Promise<void> {
  if (!useNeonDatabase()) return;
  try {
    await upsertTask({
      title: d.title.trim().slice(0, 200),
      notes: d.notes?.trim() || null,
      source: 'portal',
      source_ref: portalRef(id),
      source_link: `${PORTAL_URL}/admin?open=${id}`,
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
  } catch (err) {
    console.error('[tasks] could not sync the task for a portal request:', err);
  }
}

/** Called by the tasks API so the request follows the task. */
export async function setRequestCompleted(sourceRef: string, completed: boolean): Promise<void> {
  const id = sourceRef.replace(/^portal:/, '');
  if (!id) return;
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
