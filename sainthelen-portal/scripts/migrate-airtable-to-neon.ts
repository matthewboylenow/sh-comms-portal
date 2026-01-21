/**
 * Migration Script: Airtable → Neon PostgreSQL
 *
 * This script exports all data from Airtable and imports it into Neon PostgreSQL.
 *
 * Usage: DATABASE_URL="..." AIRTABLE_PERSONAL_TOKEN="..." AIRTABLE_BASE_ID="..." npx tsx scripts/migrate-airtable-to-neon.ts
 */

import Airtable from 'airtable';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../app/lib/db/schema';

// Configuration
const config = {
  airtable: {
    personalToken: process.env.AIRTABLE_PERSONAL_TOKEN || '',
    baseId: process.env.AIRTABLE_BASE_ID || '',
  },
  database: {
    url: process.env.DATABASE_URL || '',
  },
};

// Airtable table names
const TABLE_NAMES = {
  ANNOUNCEMENTS: 'Announcements',
  MINISTRIES: 'Ministries',
  AV_REQUESTS: 'A/V Requests',
  SMS_REQUESTS: 'SMS Requests',
  WEBSITE_UPDATES: 'Website Updates',
  GRAPHIC_DESIGN: 'Graphic Design Requests',
  NOTIFICATIONS: 'Notifications',
  PUSH_SUBSCRIPTIONS: 'Push Subscriptions',
  COMMENTS: 'Comments',
  FLYER_REVIEWS: 'Flyer Reviews',
};

// Initialize clients
function getAirtableBase() {
  return new Airtable({ apiKey: config.airtable.personalToken }).base(config.airtable.baseId);
}

function getDatabase() {
  const sql = neon(config.database.url);
  return drizzle(sql, { schema });
}

// Helper: Convert Airtable "Yes"/"No" to boolean
function yesNoToBoolean(value: any): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'yes';
  }
  return false;
}

// Helper: Parse newline-separated string to array
function parseFileLinks(value: any): string[] | null {
  if (!value) return null;
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    return value.split('\n').filter(link => link.trim());
  }
  return null;
}

// Helper: Parse date string
function parseDate(value: any): string | null {
  if (!value) return null;
  return value;
}

// Helper: Parse time string
function parseTime(value: any): string | null {
  if (!value) return null;
  return value;
}

// Fetch all records from an Airtable table
async function fetchAllRecords(base: Airtable.Base, tableName: string): Promise<any[]> {
  const records: any[] = [];

  return new Promise((resolve, reject) => {
    base(tableName)
      .select({ pageSize: 100 })
      .eachPage(
        (pageRecords, fetchNextPage) => {
          records.push(...pageRecords.map(r => ({ id: r.id, ...r.fields })));
          fetchNextPage();
        },
        (err) => {
          if (err) reject(err);
          else resolve(records);
        }
      );
  });
}

// Migration: Ministries (must be first due to foreign key)
async function migrateMinistries(base: Airtable.Base, db: ReturnType<typeof getDatabase>) {
  console.log('\n📋 Migrating Ministries...');

  const records = await fetchAllRecords(base, TABLE_NAMES.MINISTRIES);
  console.log(`   Found ${records.length} records in Airtable`);

  const ministryIdMap = new Map<string, string>(); // Airtable ID → Neon UUID

  for (const record of records) {
    try {
      const [inserted] = await db.insert(schema.ministries).values({
        name: record.Name || 'Unknown Ministry',
        requiresApproval: record['Requires Approval'] || false,
        approvalCoordinator: record['Approval Coordinator'] || 'adult-discipleship',
        description: record.Description || null,
        active: record.Active !== false,
        aliases: record.Aliases || null,
      }).returning();

      ministryIdMap.set(record.id, inserted.id);
      console.log(`   ✓ Migrated ministry: ${record.Name}`);
    } catch (error: any) {
      if (error.message?.includes('duplicate key')) {
        console.log(`   ⚠ Skipping duplicate ministry: ${record.Name}`);
        // Fetch existing ministry ID
        const existing = await db.query.ministries.findFirst({
          where: (m, { eq }) => eq(m.name, record.Name),
        });
        if (existing) {
          ministryIdMap.set(record.id, existing.id);
        }
      } else {
        console.error(`   ✗ Error migrating ministry ${record.Name}:`, error.message);
      }
    }
  }

  return ministryIdMap;
}

// Migration: Announcements
async function migrateAnnouncements(
  base: Airtable.Base,
  db: ReturnType<typeof getDatabase>,
  ministryIdMap: Map<string, string>
) {
  console.log('\n📢 Migrating Announcements...');

  const records = await fetchAllRecords(base, TABLE_NAMES.ANNOUNCEMENTS);
  console.log(`   Found ${records.length} records in Airtable`);

  let migrated = 0;
  let errors = 0;

  for (const record of records) {
    try {
      // Get ministry UUID from map if we have a Ministry ID
      let ministryId: string | null = null;
      if (record['Ministry ID'] && Array.isArray(record['Ministry ID'])) {
        ministryId = ministryIdMap.get(record['Ministry ID'][0]) || null;
      }

      await db.insert(schema.announcements).values({
        name: record.Name || '',
        email: record.Email || '',
        ministry: record.Ministry || null,
        ministryId: ministryId,
        announcementBody: record['Announcement Body'] || '',
        dateOfEvent: parseDate(record['Date of Event']),
        timeOfEvent: parseTime(record['Time of Event']),
        promotionStartDate: parseDate(record['Promotion Start Date']),
        platforms: record.Platforms || null,
        addToEventsCalendar: yesNoToBoolean(record['Add to Events Calendar']),
        externalEvent: yesNoToBoolean(record['External Event']),
        fileLinks: parseFileLinks(record['File Links']),
        approvalStatus: record['Approval Status'] || 'pending',
        requiresApproval: record['Requires Approval'] || false,
        approvedBy: record['Approved By'] || null,
        approvedAt: record['Approved At'] ? new Date(record['Approved At']) : null,
        rejectionReason: record['Rejection Reason'] || null,
        wordpressEventId: record['WordPress Event ID'] || null,
        wordpressEventUrl: record['WordPress Event URL'] || null,
        submittedAt: record['Submitted At'] ? new Date(record['Submitted At']) : new Date(),
      });

      migrated++;
    } catch (error: any) {
      errors++;
      console.error(`   ✗ Error migrating announcement from ${record.Email}:`, error.message);
    }
  }

  console.log(`   ✓ Migrated ${migrated} announcements (${errors} errors)`);
}

// Migration: Website Updates
async function migrateWebsiteUpdates(base: Airtable.Base, db: ReturnType<typeof getDatabase>) {
  console.log('\n🌐 Migrating Website Updates...');

  const records = await fetchAllRecords(base, TABLE_NAMES.WEBSITE_UPDATES);
  console.log(`   Found ${records.length} records in Airtable`);

  let migrated = 0;
  let errors = 0;

  for (const record of records) {
    try {
      await db.insert(schema.websiteUpdates).values({
        name: record.Name || '',
        email: record.Email || '',
        urgent: yesNoToBoolean(record.Urgent),
        pageToUpdate: record['Page to Update'] || '',
        description: record.Description || '',
        signUpUrl: record['Sign-Up URL'] || null,
        fileLinks: parseFileLinks(record['File Links']),
      });

      migrated++;
    } catch (error: any) {
      errors++;
      console.error(`   ✗ Error migrating website update from ${record.Email}:`, error.message);
    }
  }

  console.log(`   ✓ Migrated ${migrated} website updates (${errors} errors)`);
}

// Migration: Graphic Design Requests
async function migrateGraphicDesign(base: Airtable.Base, db: ReturnType<typeof getDatabase>) {
  console.log('\n🎨 Migrating Graphic Design Requests...');

  const records = await fetchAllRecords(base, TABLE_NAMES.GRAPHIC_DESIGN);
  console.log(`   Found ${records.length} records in Airtable`);

  let migrated = 0;
  let errors = 0;

  for (const record of records) {
    try {
      await db.insert(schema.graphicDesignRequests).values({
        name: record.Name || '',
        email: record.Email || '',
        ministry: record.Ministry || null,
        projectType: record['Project Type'] || '',
        projectDescription: record['Project Description'] || '',
        deadline: parseDate(record.Deadline),
        priority: record.Priority || 'Standard',
        requiredDimensions: record['Required Size/Dimensions'] || null,
        fileLinks: parseFileLinks(record['File Links']),
        status: record.Status || 'New',
      });

      migrated++;
    } catch (error: any) {
      errors++;
      console.error(`   ✗ Error migrating design request from ${record.Email}:`, error.message);
    }
  }

  console.log(`   ✓ Migrated ${migrated} graphic design requests (${errors} errors)`);
}

// Migration: A/V Requests
async function migrateAvRequests(base: Airtable.Base, db: ReturnType<typeof getDatabase>) {
  console.log('\n🎬 Migrating A/V Requests...');

  const records = await fetchAllRecords(base, TABLE_NAMES.AV_REQUESTS);
  console.log(`   Found ${records.length} records in Airtable`);

  let migrated = 0;
  let errors = 0;

  for (const record of records) {
    try {
      await db.insert(schema.avRequests).values({
        name: record.Name || '',
        email: record.Email || '',
        ministry: record.Ministry || null,
        eventName: record['Event Name'] || '',
        eventDatesAndTimes: record['Event Dates and Times'] || null,
        dateTimeEntries: null, // Will be parsed if structured data exists
        description: record.Description || '',
        location: record.Location || '',
        needsLivestream: record['Needs Livestream'] || false,
        avNeeds: record['A/V Needs'] || null,
        expectedAttendees: record['Expected Attendees'] || null,
        additionalNotes: record['Additional Notes'] || null,
        fileLinks: parseFileLinks(record['File Links']),
      });

      migrated++;
    } catch (error: any) {
      errors++;
      console.error(`   ✗ Error migrating A/V request from ${record.Email}:`, error.message);
    }
  }

  console.log(`   ✓ Migrated ${migrated} A/V requests (${errors} errors)`);
}

// Migration: SMS Requests
async function migrateSmsRequests(base: Airtable.Base, db: ReturnType<typeof getDatabase>) {
  console.log('\n📱 Migrating SMS Requests...');

  const records = await fetchAllRecords(base, TABLE_NAMES.SMS_REQUESTS);
  console.log(`   Found ${records.length} records in Airtable`);

  let migrated = 0;
  let errors = 0;

  for (const record of records) {
    try {
      await db.insert(schema.smsRequests).values({
        name: record.Name || '',
        email: record.Email || '',
        ministry: record.Ministry || null,
        smsMessage: (record['SMS Message'] || '').substring(0, 160),
        requestedDate: parseDate(record['Requested Date']),
        additionalInfo: record['Additional Info'] || null,
        fileLinks: parseFileLinks(record['File Links']),
      });

      migrated++;
    } catch (error: any) {
      errors++;
      console.error(`   ✗ Error migrating SMS request from ${record.Email}:`, error.message);
    }
  }

  console.log(`   ✓ Migrated ${migrated} SMS requests (${errors} errors)`);
}

// Migration: Flyer Reviews
async function migrateFlyerReviews(base: Airtable.Base, db: ReturnType<typeof getDatabase>) {
  console.log('\n📄 Migrating Flyer Reviews...');

  const records = await fetchAllRecords(base, TABLE_NAMES.FLYER_REVIEWS);
  console.log(`   Found ${records.length} records in Airtable`);

  let migrated = 0;
  let errors = 0;

  for (const record of records) {
    try {
      await db.insert(schema.flyerReviews).values({
        name: record.Name || '',
        email: record.Email || '',
        ministry: record.Ministry || null,
        eventName: record['Event Name'] || '',
        eventDate: parseDate(record['Event Date']),
        targetAudience: record['Target Audience'] || null,
        purpose: record.Purpose || null,
        feedbackNeeded: record['Feedback Needed'] || null,
        urgency: record.Urgency || 'standard',
        fileLinks: parseFileLinks(record['File Links']),
        status: record.Status || 'Pending',
      });

      migrated++;
    } catch (error: any) {
      errors++;
      console.error(`   ✗ Error migrating flyer review from ${record.Email}:`, error.message);
    }
  }

  console.log(`   ✓ Migrated ${migrated} flyer reviews (${errors} errors)`);
}

// Migration: Comments
async function migrateComments(base: Airtable.Base, db: ReturnType<typeof getDatabase>) {
  console.log('\n💬 Migrating Comments...');

  const records = await fetchAllRecords(base, TABLE_NAMES.COMMENTS);
  console.log(`   Found ${records.length} records in Airtable`);

  let migrated = 0;
  let errors = 0;

  for (const record of records) {
    try {
      await db.insert(schema.comments).values({
        recordId: record['Record ID'] || '',
        tableName: record['Table Name'] || '',
        message: record.Message || '',
        isPublic: record['Is Public'] || false,
        publicName: record['Public Name'] || null,
        publicEmail: record['Public Email'] || null,
        adminUser: record['Admin User'] || null,
        createdAt: record['Created At'] ? new Date(record['Created At']) : new Date(),
      });

      migrated++;
    } catch (error: any) {
      errors++;
      console.error(`   ✗ Error migrating comment:`, error.message);
    }
  }

  console.log(`   ✓ Migrated ${migrated} comments (${errors} errors)`);
}

// Migration: Notifications
async function migrateNotifications(base: Airtable.Base, db: ReturnType<typeof getDatabase>) {
  console.log('\n🔔 Migrating Notifications...');

  const records = await fetchAllRecords(base, TABLE_NAMES.NOTIFICATIONS);
  console.log(`   Found ${records.length} records in Airtable`);

  let migrated = 0;
  let errors = 0;

  for (const record of records) {
    try {
      await db.insert(schema.notifications).values({
        userEmail: record.userEmail || '',
        type: record.type || 'info',
        message: record.message || '',
        relatedRecordId: record.relatedRecordId || null,
        relatedRecordType: record.relatedRecordType || null,
        isRead: record.isRead || false,
        createdAt: record['Created Time'] ? new Date(record['Created Time']) : new Date(),
      });

      migrated++;
    } catch (error: any) {
      errors++;
      console.error(`   ✗ Error migrating notification:`, error.message);
    }
  }

  console.log(`   ✓ Migrated ${migrated} notifications (${errors} errors)`);
}

// Migration: Push Subscriptions
async function migratePushSubscriptions(base: Airtable.Base, db: ReturnType<typeof getDatabase>) {
  console.log('\n📲 Migrating Push Subscriptions...');

  const records = await fetchAllRecords(base, TABLE_NAMES.PUSH_SUBSCRIPTIONS);
  console.log(`   Found ${records.length} records in Airtable`);

  let migrated = 0;
  let errors = 0;

  for (const record of records) {
    try {
      // Parse keys if stored as string
      let keys = record.keys;
      if (typeof keys === 'string') {
        try {
          keys = JSON.parse(keys);
        } catch {
          keys = { p256dh: '', auth: '' };
        }
      }

      await db.insert(schema.pushSubscriptions).values({
        endpoint: record.endpoint || '',
        keys: keys || { p256dh: '', auth: '' },
        userEmail: record.userEmail || null,
      });

      migrated++;
    } catch (error: any) {
      if (error.message?.includes('duplicate key')) {
        console.log(`   ⚠ Skipping duplicate subscription`);
      } else {
        errors++;
        console.error(`   ✗ Error migrating push subscription:`, error.message);
      }
    }
  }

  console.log(`   ✓ Migrated ${migrated} push subscriptions (${errors} errors)`);
}

// Main migration function
async function runMigration() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('     AIRTABLE → NEON POSTGRESQL MIGRATION');
  console.log('═══════════════════════════════════════════════════════════════');

  // Validate configuration
  if (!config.airtable.personalToken || !config.airtable.baseId) {
    console.error('❌ Missing Airtable configuration. Please set:');
    console.error('   - AIRTABLE_PERSONAL_TOKEN');
    console.error('   - AIRTABLE_BASE_ID');
    process.exit(1);
  }

  if (!config.database.url) {
    console.error('❌ Missing DATABASE_URL environment variable');
    process.exit(1);
  }

  console.log('\n✓ Configuration validated');
  console.log(`  Airtable Base: ${config.airtable.baseId}`);
  console.log(`  Database: ${config.database.url.split('@')[1]?.split('/')[0] || 'configured'}`);

  const base = getAirtableBase();
  const db = getDatabase();

  try {
    // Migrate in order (respecting foreign keys)
    const ministryIdMap = await migrateMinistries(base, db);
    await migrateAnnouncements(base, db, ministryIdMap);
    await migrateWebsiteUpdates(base, db);
    await migrateGraphicDesign(base, db);
    await migrateAvRequests(base, db);
    await migrateSmsRequests(base, db);
    await migrateFlyerReviews(base, db);
    await migrateComments(base, db);
    await migrateNotifications(base, db);
    await migratePushSubscriptions(base, db);

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('     MIGRATION COMPLETE');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('\n✓ All data has been migrated from Airtable to Neon PostgreSQL');
    console.log('\nNext steps:');
    console.log('  1. Verify data integrity in Neon dashboard');
    console.log('  2. Run S3 → Vercel Blob file migration');
    console.log('  3. Update API routes to use Drizzle');
    console.log('  4. Test all functionality');
    console.log('  5. Set USE_NEON_DB=true to switch to new database');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();
