import Airtable from 'airtable';

// Centralized Airtable configuration
const personalToken = process.env.AIRTABLE_PERSONAL_TOKEN || '';
const baseId = process.env.AIRTABLE_BASE_ID || '';

// Only create the base instance when actually needed
export function getAirtableBase() {
  if (!personalToken || !baseId) {
    throw new Error('Missing Airtable configuration: AIRTABLE_PERSONAL_TOKEN or AIRTABLE_BASE_ID not found in environment variables');
  }
  return new Airtable({ apiKey: personalToken }).base(baseId);
}

// Helper function to check if Airtable is configured without throwing
export function isAirtableConfigured(): boolean {
  return !!(personalToken && baseId);
}

// Table name constants
export const TABLE_NAMES = {
  ANNOUNCEMENTS: process.env.ANNOUNCEMENTS_TABLE_NAME || 'Announcements',
  MINISTRIES: process.env.MINISTRIES_TABLE_NAME || 'Ministries',
  AV_REQUESTS: process.env.AV_REQUESTS_TABLE_NAME || 'AV Requests',
  SMS_REQUESTS: process.env.SMS_REQUESTS_TABLE_NAME || 'SMS Requests',
  WEBSITE_UPDATES: process.env.WEBSITE_UPDATES_TABLE_NAME || 'Website Updates',
  GRAPHIC_DESIGN: process.env.GRAPHIC_DESIGN_TABLE_NAME || 'Graphic Design',
  NOTIFICATIONS: process.env.NOTIFICATIONS_TABLE_NAME || 'Notifications',
  PUSH_SUBSCRIPTIONS: process.env.PUSH_SUBSCRIPTIONS_TABLE_NAME || 'Push Subscriptions',
  CALENDAR_EVENTS: process.env.CALENDAR_EVENTS_TABLE_NAME || 'Calendar Events'
};

// Graceful fallback for development/build time
export function getAirtableBaseSafe() {
  try {
    return getAirtableBase();
  } catch (error) {
    // During build time or when env vars are missing, return null instead of throwing
    console.warn('Airtable not configured, returning null. This is normal during build.');
    return null;
  }
}