import { db } from '../index';
import { ministries, type Ministry, type NewMinistry } from '../schema';
import { eq, ilike, and, or } from 'drizzle-orm';

/**
 * Ministry Service - Database operations for ministries
 */

// Get all ministries (optionally filter by active status)
export async function getAllMinistries(activeOnly = false): Promise<Ministry[]> {
  if (activeOnly) {
    return db.select().from(ministries).where(eq(ministries.active, true));
  }
  return db.select().from(ministries);
}

// Get ministry by ID
export async function getMinistryById(id: string): Promise<Ministry | undefined> {
  const results = await db.select().from(ministries).where(eq(ministries.id, id));
  return results[0];
}

// Get ministry by name (case-insensitive)
export async function getMinistryByName(name: string): Promise<Ministry | undefined> {
  const results = await db.select().from(ministries).where(ilike(ministries.name, name));
  return results[0];
}

// Get ministry by name or alias
export async function findMinistryByNameOrAlias(name: string): Promise<Ministry | undefined> {
  // First try exact name match
  let ministry = await getMinistryByName(name);
  if (ministry) return ministry;

  // Search in aliases
  const allMinistries = await getAllMinistries();
  return allMinistries.find(m => {
    if (!m.aliases) return false;
    const aliases = m.aliases.split(',').map(a => a.trim().toLowerCase());
    return aliases.includes(name.toLowerCase());
  });
}

// Get ministries that require approval
export async function getMinistriesRequiringApproval(): Promise<Ministry[]> {
  return db.select().from(ministries).where(eq(ministries.requiresApproval, true));
}

// Get ministries by approval coordinator
export async function getMinistriesByCoordinator(coordinator: string): Promise<Ministry[]> {
  return db.select().from(ministries).where(
    and(
      eq(ministries.approvalCoordinator, coordinator),
      eq(ministries.requiresApproval, true)
    )
  );
}

// Create a new ministry
export async function createMinistry(data: NewMinistry): Promise<Ministry> {
  const [ministry] = await db.insert(ministries).values({
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();
  return ministry;
}

// Update a ministry
export async function updateMinistry(
  id: string,
  data: Partial<Omit<NewMinistry, 'id'>>
): Promise<Ministry | undefined> {
  const [ministry] = await db
    .update(ministries)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(ministries.id, id))
    .returning();
  return ministry;
}

// Delete a ministry
export async function deleteMinistry(id: string): Promise<boolean> {
  const result = await db.delete(ministries).where(eq(ministries.id, id));
  return true; // Drizzle doesn't return affected rows count easily
}

// Check if ministry name exists (for validation)
export async function ministryNameExists(name: string, excludeId?: string): Promise<boolean> {
  const query = excludeId
    ? db.select().from(ministries).where(
        and(ilike(ministries.name, name), eq(ministries.id, excludeId))
      )
    : db.select().from(ministries).where(ilike(ministries.name, name));

  const results = await query;
  return results.length > 0;
}
