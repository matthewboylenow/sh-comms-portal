import {
  pgTable,
  text,
  varchar,
  boolean,
  timestamp,
  date,
  time,
  uuid,
  json,
  integer,
} from 'drizzle-orm/pg-core';

// ============================================================================
// MINISTRIES TABLE
// ============================================================================
export const ministries = pgTable('ministries', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  requiresApproval: boolean('requires_approval').default(false).notNull(),
  approvalCoordinator: varchar('approval_coordinator', { length: 100 }).default('adult-discipleship'),
  description: text('description'),
  active: boolean('active').default(true).notNull(),
  aliases: text('aliases'), // Comma-separated aliases
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================================
// ANNOUNCEMENTS TABLE
// ============================================================================
export const announcements = pgTable('announcements', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  ministry: varchar('ministry', { length: 255 }),
  ministryId: uuid('ministry_id').references(() => ministries.id),
  announcementBody: text('announcement_body').notNull(),
  dateOfEvent: date('date_of_event'),
  timeOfEvent: time('time_of_event'),
  promotionStartDate: date('promotion_start_date'),
  platforms: json('platforms').$type<string[]>(), // Array of platform names
  addToEventsCalendar: boolean('add_to_events_calendar').default(false),
  externalEvent: boolean('external_event').default(false),
  fileLinks: text('file_links').array(), // Array of URLs
  approvalStatus: varchar('approval_status', { length: 50 }).default('pending').notNull(),
  requiresApproval: boolean('requires_approval').default(false).notNull(),
  approvedBy: varchar('approved_by', { length: 255 }),
  approvedAt: timestamp('approved_at'),
  rejectionReason: text('rejection_reason'),
  wordpressEventId: integer('wordpress_event_id'),
  wordpressEventUrl: varchar('wordpress_event_url', { length: 500 }),
  completed: boolean('completed').default(false),
  completedDate: timestamp('completed_date'),
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// WEBSITE UPDATES TABLE
// ============================================================================
export const websiteUpdates = pgTable('website_updates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  urgent: boolean('urgent').default(false).notNull(),
  pageToUpdate: varchar('page_to_update', { length: 500 }).notNull(),
  description: text('description').notNull(),
  signUpUrl: varchar('sign_up_url', { length: 500 }),
  fileLinks: text('file_links').array(), // Array of URLs (WordPress or Blob)
  completed: boolean('completed').default(false),
  completedDate: timestamp('completed_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// GRAPHIC DESIGN REQUESTS TABLE
// ============================================================================
export const graphicDesignRequests = pgTable('graphic_design_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  ministry: varchar('ministry', { length: 255 }),
  projectType: varchar('project_type', { length: 255 }).notNull(),
  projectDescription: text('project_description').notNull(),
  deadline: date('deadline'),
  priority: varchar('priority', { length: 50 }).default('Standard').notNull(),
  requiredDimensions: varchar('required_dimensions', { length: 255 }),
  fileLinks: text('file_links').array(),
  status: varchar('status', { length: 50 }).default('New').notNull(),
  completed: boolean('completed').default(false),
  completedDate: timestamp('completed_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// A/V REQUESTS TABLE
// ============================================================================
export const avRequests = pgTable('av_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  ministry: varchar('ministry', { length: 255 }),
  eventName: varchar('event_name', { length: 500 }).notNull(),
  dateTimeEntries: json('date_time_entries').$type<Array<{
    date: string;
    startTime: string;
    endTime: string;
  }>>(), // Structured JSON instead of formatted text
  eventDatesAndTimes: text('event_dates_and_times'), // Legacy formatted text field
  description: text('description').notNull(),
  location: varchar('location', { length: 500 }).notNull(),
  needsLivestream: boolean('needs_livestream').default(false).notNull(),
  avNeeds: text('av_needs'),
  expectedAttendees: varchar('expected_attendees', { length: 100 }),
  additionalNotes: text('additional_notes'),
  fileLinks: text('file_links').array(),
  completed: boolean('completed').default(false),
  completedDate: timestamp('completed_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// SMS REQUESTS TABLE
// ============================================================================
export const smsRequests = pgTable('sms_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  ministry: varchar('ministry', { length: 255 }),
  smsMessage: varchar('sms_message', { length: 160 }).notNull(), // SMS character limit
  requestedDate: date('requested_date'),
  additionalInfo: text('additional_info'),
  fileLinks: text('file_links').array(),
  completed: boolean('completed').default(false),
  completedDate: timestamp('completed_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// FLYER REVIEWS TABLE
// ============================================================================
export const flyerReviews = pgTable('flyer_reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  ministry: varchar('ministry', { length: 255 }),
  eventName: varchar('event_name', { length: 500 }).notNull(),
  eventDate: date('event_date'),
  targetAudience: varchar('target_audience', { length: 255 }),
  purpose: text('purpose'),
  feedbackNeeded: text('feedback_needed'),
  urgency: varchar('urgency', { length: 50 }).default('standard').notNull(),
  fileLinks: text('file_links').array(),
  status: varchar('status', { length: 50 }).default('Pending').notNull(),
  completed: boolean('completed').default(false),
  completedDate: timestamp('completed_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// COMMENTS TABLE (Cross-table commenting system)
// ============================================================================
export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  recordId: varchar('record_id', { length: 255 }).notNull(), // UUID of the related record
  tableName: varchar('table_name', { length: 100 }).notNull(), // Which table the record belongs to
  message: text('message').notNull(),
  isPublic: boolean('is_public').default(false).notNull(),
  publicName: varchar('public_name', { length: 255 }),
  publicEmail: varchar('public_email', { length: 255 }),
  adminUser: varchar('admin_user', { length: 255 }), // Admin who created the comment
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// NOTIFICATIONS TABLE
// ============================================================================
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userEmail: varchar('user_email', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).default('info').notNull(), // info, success, warning, error
  message: text('message').notNull(),
  relatedRecordId: varchar('related_record_id', { length: 255 }),
  relatedRecordType: varchar('related_record_type', { length: 100 }),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// PUSH SUBSCRIPTIONS TABLE
// ============================================================================
export const pushSubscriptions = pgTable('push_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  endpoint: text('endpoint').notNull().unique(),
  keys: json('keys').$type<{
    p256dh: string;
    auth: string;
  }>().notNull(),
  userEmail: varchar('user_email', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// TYPE EXPORTS (for use in services)
// ============================================================================
export type Ministry = typeof ministries.$inferSelect;
export type NewMinistry = typeof ministries.$inferInsert;

export type Announcement = typeof announcements.$inferSelect;
export type NewAnnouncement = typeof announcements.$inferInsert;

export type WebsiteUpdate = typeof websiteUpdates.$inferSelect;
export type NewWebsiteUpdate = typeof websiteUpdates.$inferInsert;

export type GraphicDesignRequest = typeof graphicDesignRequests.$inferSelect;
export type NewGraphicDesignRequest = typeof graphicDesignRequests.$inferInsert;

export type AvRequest = typeof avRequests.$inferSelect;
export type NewAvRequest = typeof avRequests.$inferInsert;

export type SmsRequest = typeof smsRequests.$inferSelect;
export type NewSmsRequest = typeof smsRequests.$inferInsert;

export type FlyerReview = typeof flyerReviews.$inferSelect;
export type NewFlyerReview = typeof flyerReviews.$inferInsert;

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert;
