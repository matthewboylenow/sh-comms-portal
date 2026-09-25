// app/lib/copy-review.ts
//
// Runs the style check on a submission and stores the suggested edit for the
// admin cards. Nothing is sent anywhere and the submitter never sees it.

import { getAnnouncementById } from './db/services/announcements';
import { getWebsiteUpdateById } from './db/services/website-updates';
import {
  beginCopyReview,
  finishCopyReview,
  type CopySourceType,
} from './db/services/copy-reviews';
import type { CopyReview } from './db/schema';
import { cleanUpCopy } from './copy-cleanup';

async function loadCopy(
  sourceType: CopySourceType,
  sourceId: string
): Promise<{ text: string; context: string } | null> {
  if (sourceType === 'announcement') {
    const a = await getAnnouncementById(sourceId);
    if (!a) return null;
    return {
      text: a.announcementBody,
      context: a.ministry ? `Submitted for: ${a.ministry}` : '',
    };
  }
  const w = await getWebsiteUpdateById(sourceId);
  if (!w) return null;
  return { text: w.description, context: `Page to update: ${w.pageToUpdate}` };
}

/** Never throws for a failed cleanup: the stored review records the error instead. */
export async function runCopyReview(
  sourceType: CopySourceType,
  sourceId: string
): Promise<CopyReview> {
  const source = await loadCopy(sourceType, sourceId);
  if (!source) throw new Error('That submission is not in the database.');

  const review = await beginCopyReview(sourceType, sourceId, source.text);
  try {
    const result = await cleanUpCopy(sourceType, source.text, { context: source.context });
    return await finishCopyReview(review.id, {
      cleaned: result.text,
      unchanged: result.unchanged,
      changes: result.changes,
      concerns: result.concerns,
      aiError: null,
    });
  } catch (err: any) {
    console.error(`Copy review failed for ${sourceType} ${sourceId}:`, err);
    return finishCopyReview(review.id, {
      cleaned: null,
      unchanged: false,
      changes: [],
      concerns: [],
      aiError: err?.message || 'Cleanup failed',
    });
  }
}
