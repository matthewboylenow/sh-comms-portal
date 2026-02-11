import { db } from '../index';
import { userPreferences, type UserPreference, type NewUserPreference } from '../schema';
import { eq } from 'drizzle-orm';

/**
 * User Preferences Service - Manage user settings for Command Center
 */

// Get preferences for a user (creates default if doesn't exist)
export async function getPreferencesForUser(userEmail: string): Promise<UserPreference> {
  const results = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userEmail, userEmail));

  if (results.length > 0) {
    return results[0];
  }

  // Create default preferences if none exist
  const [newPrefs] = await db.insert(userPreferences).values({
    userEmail,
    dailyDigestEnabled: true,
    dailyDigestTime: '07:30:00',
    defaultView: 'daily',
    theme: 'system',
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();

  return newPrefs;
}

// Update preferences
export async function updatePreferences(
  userEmail: string,
  data: Partial<{
    dailyDigestEnabled: boolean;
    dailyDigestTime: string;
    defaultView: string;
    theme: string;
  }>
): Promise<UserPreference> {
  // First ensure preferences exist
  await getPreferencesForUser(userEmail);

  const [prefs] = await db
    .update(userPreferences)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(userPreferences.userEmail, userEmail))
    .returning();

  return prefs;
}

// Toggle daily digest
export async function toggleDailyDigest(userEmail: string): Promise<UserPreference> {
  const current = await getPreferencesForUser(userEmail);

  const [prefs] = await db
    .update(userPreferences)
    .set({
      dailyDigestEnabled: !current.dailyDigestEnabled,
      updatedAt: new Date(),
    })
    .where(eq(userPreferences.userEmail, userEmail))
    .returning();

  return prefs;
}

// Get all users with daily digest enabled
export async function getUsersWithDigestEnabled(): Promise<UserPreference[]> {
  return db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.dailyDigestEnabled, true));
}

// Set default view
export async function setDefaultView(
  userEmail: string,
  view: 'daily' | 'weekly'
): Promise<UserPreference> {
  // First ensure preferences exist
  await getPreferencesForUser(userEmail);

  const [prefs] = await db
    .update(userPreferences)
    .set({
      defaultView: view,
      updatedAt: new Date(),
    })
    .where(eq(userPreferences.userEmail, userEmail))
    .returning();

  return prefs;
}

// Set daily digest time
export async function setDigestTime(
  userEmail: string,
  time: string
): Promise<UserPreference> {
  // First ensure preferences exist
  await getPreferencesForUser(userEmail);

  const [prefs] = await db
    .update(userPreferences)
    .set({
      dailyDigestTime: time,
      updatedAt: new Date(),
    })
    .where(eq(userPreferences.userEmail, userEmail))
    .returning();

  return prefs;
}
