import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// Create the Neon SQL client
const sql = neon(process.env.DATABASE_URL!);

// Create the Drizzle database instance with schema
export const db = drizzle(sql, { schema });

// Re-export schema for convenience
export * from './schema';

// Helper to check if database is configured
export function isDatabaseConfigured(): boolean {
  return !!process.env.DATABASE_URL;
}

// Feature flag for gradual migration
export function useNeonDatabase(): boolean {
  return process.env.USE_NEON_DB === 'true';
}
