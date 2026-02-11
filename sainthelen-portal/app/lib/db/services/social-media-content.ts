import { db } from '../index';
import { socialMediaContent, type SocialMediaContent, type NewSocialMediaContent } from '../schema';
import { eq, and, desc, asc, gte, lte } from 'drizzle-orm';

/**
 * Social Media Content Service - Manage AI-generated social content
 */

// Platform types
export type Platform = 'facebook' | 'instagram' | 'x' | 'linkedin' | 'gmb' | 'threads' | 'tiktok';

// Content types
export type ContentType = 'event_promo' | 'event_recap' | 'inspirational' | 'sermon_clip' | 'homily_clip' | 'ministry_spotlight';

// Get all content for a user
export async function getContentForUser(
  userEmail: string,
  options?: {
    platform?: Platform;
    contentType?: ContentType;
    status?: string;
    limit?: number;
  }
): Promise<SocialMediaContent[]> {
  const conditions = [eq(socialMediaContent.userEmail, userEmail)];

  if (options?.platform) {
    conditions.push(eq(socialMediaContent.platform, options.platform));
  }

  if (options?.contentType) {
    conditions.push(eq(socialMediaContent.contentType, options.contentType));
  }

  if (options?.status) {
    conditions.push(eq(socialMediaContent.status, options.status));
  }

  const query = db
    .select()
    .from(socialMediaContent)
    .where(and(...conditions))
    .orderBy(desc(socialMediaContent.createdAt));

  if (options?.limit) {
    return query.limit(options.limit);
  }

  return query;
}

// Get draft content for a user
export async function getDraftContent(userEmail: string): Promise<SocialMediaContent[]> {
  return getContentForUser(userEmail, { status: 'draft' });
}

// Get content by ID
export async function getContentById(id: string): Promise<SocialMediaContent | undefined> {
  const results = await db.select().from(socialMediaContent).where(eq(socialMediaContent.id, id));
  return results[0];
}

// Get content linked to a source record
export async function getContentForSourceRecord(
  sourceRecordId: string,
  sourceRecordType: string
): Promise<SocialMediaContent[]> {
  return db
    .select()
    .from(socialMediaContent)
    .where(
      and(
        eq(socialMediaContent.sourceRecordId, sourceRecordId),
        eq(socialMediaContent.sourceRecordType, sourceRecordType)
      )
    )
    .orderBy(desc(socialMediaContent.createdAt));
}

// Create new content
export async function createContent(data: {
  userEmail: string;
  platform: string;
  contentType: string;
  content: string;
  hashtags?: string;
  suggestedDate?: string;
  sourceRecordId?: string;
  sourceRecordType?: string;
}): Promise<SocialMediaContent> {
  const [content] = await db.insert(socialMediaContent).values({
    userEmail: data.userEmail,
    platform: data.platform,
    contentType: data.contentType,
    content: data.content,
    hashtags: data.hashtags,
    suggestedDate: data.suggestedDate,
    sourceRecordId: data.sourceRecordId,
    sourceRecordType: data.sourceRecordType,
    status: 'draft',
    createdAt: new Date(),
  }).returning();
  return content;
}

// Update content
export async function updateContent(
  id: string,
  data: Partial<{
    content: string;
    hashtags: string;
    suggestedDate: string;
    status: string;
  }>
): Promise<SocialMediaContent | undefined> {
  const [content] = await db
    .update(socialMediaContent)
    .set(data)
    .where(eq(socialMediaContent.id, id))
    .returning();
  return content;
}

// Mark content as posted
export async function markAsPosted(id: string): Promise<SocialMediaContent | undefined> {
  const [content] = await db
    .update(socialMediaContent)
    .set({ status: 'posted' })
    .where(eq(socialMediaContent.id, id))
    .returning();
  return content;
}

// Archive content
export async function archiveContent(id: string): Promise<SocialMediaContent | undefined> {
  const [content] = await db
    .update(socialMediaContent)
    .set({ status: 'archived' })
    .where(eq(socialMediaContent.id, id))
    .returning();
  return content;
}

// Delete content
export async function deleteContent(id: string): Promise<boolean> {
  await db.delete(socialMediaContent).where(eq(socialMediaContent.id, id));
  return true;
}

// Get content suggestions for today
export async function getContentSuggestionsForDate(
  userEmail: string,
  date: string
): Promise<SocialMediaContent[]> {
  return db
    .select()
    .from(socialMediaContent)
    .where(
      and(
        eq(socialMediaContent.userEmail, userEmail),
        eq(socialMediaContent.suggestedDate, date),
        eq(socialMediaContent.status, 'draft')
      )
    )
    .orderBy(asc(socialMediaContent.platform));
}

// Get platform-specific character limit
export function getPlatformCharacterLimit(platform: Platform): number {
  const limits: Record<Platform, number> = {
    facebook: 63206,
    instagram: 2200,
    x: 280,
    linkedin: 3000,
    gmb: 1500,
    threads: 500,
    tiktok: 2200,
  };
  return limits[platform] || 2200;
}

// Get platform-specific hashtag recommendations
export function getRecommendedHashtagCount(platform: Platform): number {
  const recommendations: Record<Platform, number> = {
    facebook: 3,
    instagram: 15,
    x: 3,
    linkedin: 5,
    gmb: 0,
    threads: 5,
    tiktok: 5,
  };
  return recommendations[platform] || 5;
}
