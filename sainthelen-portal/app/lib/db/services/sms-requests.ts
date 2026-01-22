import { db } from '../index';
import { smsRequests, type SmsRequest, type NewSmsRequest } from '../schema';
import { eq, desc, or, isNull } from 'drizzle-orm';

/**
 * SMS Requests Service
 */

// Get all requests (excludes completed by default)
export async function getAllSmsRequests(options: { includeCompleted?: boolean } = {}): Promise<SmsRequest[]> {
  if (options.includeCompleted) {
    return db.select().from(smsRequests).orderBy(desc(smsRequests.createdAt));
  }
  // Handle null values: include records where completed is false OR null
  return db
    .select()
    .from(smsRequests)
    .where(or(eq(smsRequests.completed, false), isNull(smsRequests.completed)))
    .orderBy(desc(smsRequests.createdAt));
}

// Get by ID
export async function getSmsRequestById(id: string): Promise<SmsRequest | undefined> {
  const results = await db.select().from(smsRequests).where(eq(smsRequests.id, id));
  return results[0];
}

// Create request
export async function createSmsRequest(data: NewSmsRequest): Promise<SmsRequest> {
  // Enforce 160 character limit
  const sanitizedData = {
    ...data,
    smsMessage: data.smsMessage.substring(0, 160),
    createdAt: new Date(),
  };

  const [request] = await db.insert(smsRequests).values(sanitizedData).returning();
  return request;
}

// Update request
export async function updateSmsRequest(
  id: string,
  data: Partial<Omit<NewSmsRequest, 'id'>>
): Promise<SmsRequest | undefined> {
  const [request] = await db
    .update(smsRequests)
    .set(data)
    .where(eq(smsRequests.id, id))
    .returning();
  return request;
}

// Delete request
export async function deleteSmsRequest(id: string): Promise<boolean> {
  await db.delete(smsRequests).where(eq(smsRequests.id, id));
  return true;
}

// Mark request as completed
export async function markCompleted(id: string, completed: boolean): Promise<SmsRequest | undefined> {
  const [request] = await db
    .update(smsRequests)
    .set({
      completed,
      completedDate: completed ? new Date() : null,
    })
    .where(eq(smsRequests.id, id))
    .returning();
  return request;
}

// Aliases for consistency
export const getAllSMSRequests = getAllSmsRequests;
export const createSMSRequest = createSmsRequest;
