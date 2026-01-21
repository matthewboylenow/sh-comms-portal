/**
 * Migration Script: AWS S3 → Vercel Blob
 *
 * This script migrates all files from S3 to Vercel Blob and updates database references.
 *
 * Usage: DATABASE_URL="..." BLOB_READ_WRITE_TOKEN="..." npx tsx scripts/migrate-s3-to-blob.ts
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { put } from '@vercel/blob';
import { eq } from 'drizzle-orm';
import * as schema from '../app/lib/db/schema';

// Configuration
const config = {
  database: {
    url: process.env.DATABASE_URL || '',
  },
  blob: {
    token: process.env.BLOB_READ_WRITE_TOKEN || '',
  },
};

// Initialize database
function getDatabase() {
  const sql = neon(config.database.url);
  return drizzle(sql, { schema });
}

// Check if URL is an S3 URL
function isS3Url(url: string): boolean {
  return url.includes('.s3.') || url.includes('s3.amazonaws.com');
}

// Extract filename from S3 URL
function extractFilename(s3Url: string): string {
  const parts = s3Url.split('/');
  return parts[parts.length - 1] || `file-${Date.now()}`;
}

// Download file from S3 (public URL)
async function downloadFromS3(s3Url: string): Promise<{ buffer: ArrayBuffer; contentType: string }> {
  const response = await fetch(s3Url);

  if (!response.ok) {
    throw new Error(`Failed to download from S3: ${response.status} ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  const contentType = response.headers.get('content-type') || 'application/octet-stream';

  return { buffer, contentType };
}

// Upload file to Vercel Blob
async function uploadToBlob(
  buffer: ArrayBuffer,
  filename: string,
  contentType: string
): Promise<string> {
  const blob = await put(filename, buffer, {
    access: 'public',
    contentType,
    addRandomSuffix: false,
  });

  return blob.url;
}

// Migrate a single URL from S3 to Blob
async function migrateUrl(s3Url: string): Promise<string> {
  if (!isS3Url(s3Url)) {
    // Not an S3 URL, return as-is (might be WordPress URL)
    return s3Url;
  }

  try {
    const filename = extractFilename(s3Url);
    const { buffer, contentType } = await downloadFromS3(s3Url);
    const blobUrl = await uploadToBlob(buffer, `uploads/${filename}`, contentType);

    console.log(`     ✓ Migrated: ${filename}`);
    return blobUrl;
  } catch (error: any) {
    console.error(`     ✗ Failed to migrate ${s3Url}: ${error.message}`);
    // Return original URL on failure (fallback)
    return s3Url;
  }
}

// Migrate file links for a table
async function migrateTableFiles<T extends { id: string; fileLinks: string[] | null }>(
  db: ReturnType<typeof getDatabase>,
  tableName: string,
  table: any,
  records: T[]
): Promise<{ migrated: number; skipped: number; errors: number }> {
  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const record of records) {
    if (!record.fileLinks || record.fileLinks.length === 0) {
      skipped++;
      continue;
    }

    // Check if any links are S3 URLs
    const hasS3Links = record.fileLinks.some(isS3Url);
    if (!hasS3Links) {
      skipped++;
      continue;
    }

    try {
      // Migrate each file link
      const newLinks: string[] = [];
      for (const link of record.fileLinks) {
        const newUrl = await migrateUrl(link);
        newLinks.push(newUrl);
      }

      // Update database record
      await db.update(table).set({ fileLinks: newLinks }).where(eq(table.id, record.id));
      migrated++;
    } catch (error: any) {
      errors++;
      console.error(`   ✗ Error updating record ${record.id}: ${error.message}`);
    }
  }

  return { migrated, skipped, errors };
}

// Main migration function
async function runFileMigration() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('     AWS S3 → VERCEL BLOB FILE MIGRATION');
  console.log('═══════════════════════════════════════════════════════════════');

  // Validate configuration
  if (!config.database.url) {
    console.error('❌ Missing DATABASE_URL environment variable');
    process.exit(1);
  }

  if (!config.blob.token) {
    console.error('❌ Missing BLOB_READ_WRITE_TOKEN environment variable');
    process.exit(1);
  }

  console.log('\n✓ Configuration validated');

  const db = getDatabase();

  try {
    // Migrate Announcements
    console.log('\n📢 Migrating Announcements files...');
    const announcements = await db.select().from(schema.announcements);
    const annResult = await migrateTableFiles(db, 'announcements', schema.announcements, announcements);
    console.log(`   Result: ${annResult.migrated} migrated, ${annResult.skipped} skipped, ${annResult.errors} errors`);

    // Migrate Website Updates
    console.log('\n🌐 Migrating Website Updates files...');
    const websiteUpdates = await db.select().from(schema.websiteUpdates);
    const wuResult = await migrateTableFiles(db, 'website_updates', schema.websiteUpdates, websiteUpdates);
    console.log(`   Result: ${wuResult.migrated} migrated, ${wuResult.skipped} skipped, ${wuResult.errors} errors`);

    // Migrate Graphic Design Requests
    console.log('\n🎨 Migrating Graphic Design files...');
    const graphicDesign = await db.select().from(schema.graphicDesignRequests);
    const gdResult = await migrateTableFiles(db, 'graphic_design_requests', schema.graphicDesignRequests, graphicDesign);
    console.log(`   Result: ${gdResult.migrated} migrated, ${gdResult.skipped} skipped, ${gdResult.errors} errors`);

    // Migrate A/V Requests
    console.log('\n🎬 Migrating A/V Requests files...');
    const avRequests = await db.select().from(schema.avRequests);
    const avResult = await migrateTableFiles(db, 'av_requests', schema.avRequests, avRequests);
    console.log(`   Result: ${avResult.migrated} migrated, ${avResult.skipped} skipped, ${avResult.errors} errors`);

    // Migrate SMS Requests
    console.log('\n📱 Migrating SMS Requests files...');
    const smsRequests = await db.select().from(schema.smsRequests);
    const smsResult = await migrateTableFiles(db, 'sms_requests', schema.smsRequests, smsRequests);
    console.log(`   Result: ${smsResult.migrated} migrated, ${smsResult.skipped} skipped, ${smsResult.errors} errors`);

    // Migrate Flyer Reviews
    console.log('\n📄 Migrating Flyer Reviews files...');
    const flyerReviews = await db.select().from(schema.flyerReviews);
    const frResult = await migrateTableFiles(db, 'flyer_reviews', schema.flyerReviews, flyerReviews);
    console.log(`   Result: ${frResult.migrated} migrated, ${frResult.skipped} skipped, ${frResult.errors} errors`);

    // Summary
    const totalMigrated = annResult.migrated + wuResult.migrated + gdResult.migrated +
                          avResult.migrated + smsResult.migrated + frResult.migrated;
    const totalSkipped = annResult.skipped + wuResult.skipped + gdResult.skipped +
                         avResult.skipped + smsResult.skipped + frResult.skipped;
    const totalErrors = annResult.errors + wuResult.errors + gdResult.errors +
                        avResult.errors + smsResult.errors + frResult.errors;

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('     FILE MIGRATION COMPLETE');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`\n✓ Total records migrated: ${totalMigrated}`);
    console.log(`  Records skipped (no S3 files): ${totalSkipped}`);
    console.log(`  Errors: ${totalErrors}`);

    if (totalErrors > 0) {
      console.log('\n⚠ Some files failed to migrate. Original S3 URLs preserved as fallback.');
      console.log('  Consider re-running the migration or manually migrating failed files.');
    }

    console.log('\nNext steps:');
    console.log('  1. Verify files are accessible in Vercel Blob dashboard');
    console.log('  2. Update client components to use blob-upload endpoint');
    console.log('  3. Set USE_BLOB_STORAGE=true to use Vercel Blob for new uploads');
    console.log('  4. Once verified, you can remove S3 bucket');

  } catch (error) {
    console.error('\n❌ File migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runFileMigration();
