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
  // Additional occurrences beyond the primary date/time above
  eventDates: json('event_dates').$type<Array<{ date: string; time?: string }>>(),
  promotionStartDate: date('promotion_start_date'),
  platforms: json('platforms').$type<string[]>(), // Array of platform names
  addToEventsCalendar: boolean('add_to_events_calendar').default(false),
  // Event calendar detail fields (populated when addToEventsCalendar is true)
  calendarEventName: varchar('calendar_event_name', { length: 500 }),
  calendarEventDate: date('calendar_event_date'),
  calendarEventStartTime: time('calendar_event_start_time'),
  calendarEventEndTime: time('calendar_event_end_time'),
  calendarEventDescription: text('calendar_event_description'),
  calendarEventLocation: varchar('calendar_event_location', { length: 500 }),
  calendarEventSignUpLink: varchar('calendar_event_sign_up_link', { length: 500 }),
  externalEvent: boolean('external_event').default(false),
  // "Consider for Social Media" flag - editorial consideration, not a promised post
  socialConsideration: boolean('social_consideration').default(false),
  socialWhatToKnow: text('social_what_to_know'),
  socialHasPhotos: varchar('social_has_photos', { length: 20 }), // yes | no | not_yet
  fileLinks: text('file_links').array(), // Array of URLs
  signUpUrl: varchar('sign_up_url', { length: 500 }),
  // Multiple labeled sign-up links; signUpUrl above holds the first for compatibility
  signUpLinks: json('sign_up_links').$type<Array<{ label?: string; url: string }>>(),
  publicationNotes: text('publication_notes'),
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
  newPage: boolean('new_page').default(false),
  description: text('description').notNull(),
  signUpUrl: varchar('sign_up_url', { length: 500 }),
  // Multiple labeled sign-up links; signUpUrl above holds the first for compatibility
  signUpLinks: json('sign_up_links').$type<Array<{ label?: string; url: string }>>(),
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
// PHOTO SUBMISSIONS TABLE (Share Photos with Communications)
// ============================================================================
export const photoSubmissions = pgTable('photo_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  submitterName: varchar('submitter_name', { length: 255 }),
  ministry: varchar('ministry', { length: 255 }),
  description: text('description').notNull(), // "What's happening?"
  photoDate: date('photo_date'),
  fileLinks: text('file_links').array(),
  privacyConcern: boolean('privacy_concern').default(false).notNull(), // someone pictured shouldn't be used publicly
  privacyNotes: text('privacy_notes'),
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

export type PhotoSubmission = typeof photoSubmissions.$inferSelect;
export type NewPhotoSubmission = typeof photoSubmissions.$inferInsert;

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert;

// ============================================================================
// COMMAND CENTER - USER PREFERENCES TABLE
// ============================================================================
export const userPreferences = pgTable('user_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userEmail: varchar('user_email', { length: 255 }).notNull().unique(),
  dailyDigestEnabled: boolean('daily_digest_enabled').default(false),
  dailyDigestTime: time('daily_digest_time').default('07:30:00'),
  websiteUpdateEmailEnabled: boolean('website_update_email_enabled').default(true),
  defaultView: varchar('default_view', { length: 20 }).default('daily'), // daily, weekly
  theme: varchar('theme', { length: 20 }).default('system'), // light, dark, system
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================================
// COMMAND CENTER TYPE EXPORTS
// ============================================================================
export type UserPreference = typeof userPreferences.$inferSelect;
export type NewUserPreference = typeof userPreferences.$inferInsert;


// ============================================================================
// CALENDAR REVIEWS
// ============================================================================
// One row per announcement that asked to be on the parish calendar. Holds the
// event as submitted, Claude's cleaned-up version, and the magic-link token the
// review email uses to approve or edit it.
export type CalendarEventFields = {
  title: string;
  description: string;
  dates: string[]; // YYYY-MM-DD, sorted
  startTime: string; // HH:MM, '' for all day
  endTime: string; // HH:MM or ''
  location: string;
  signUpUrl: string;
  // Public contact, only when the copy names one. Optional for reviews saved
  // before the field existed.
  contact?: string;
};

export const calendarReviews = pgTable('calendar_reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  announcementId: uuid('announcement_id').references(() => announcements.id).notNull(),
  token: varchar('token', { length: 64 }).notNull().unique(),
  // processing -> ready -> published | dismissed
  status: varchar('status', { length: 20 }).default('processing').notNull(),
  original: json('original').$type<CalendarEventFields>().notNull(),
  cleaned: json('cleaned').$type<CalendarEventFields>(),
  changes: json('changes').$type<string[]>(),
  concerns: json('concerns').$type<string[]>(),
  aiError: text('ai_error'),
  wordpressEventId: integer('wordpress_event_id'),
  wordpressEventUrl: varchar('wordpress_event_url', { length: 500 }),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type CalendarReview = typeof calendarReviews.$inferSelect;
export type NewCalendarReview = typeof calendarReviews.$inferInsert;

// ============================================================================
// COPY REVIEWS
// ============================================================================
// Claude's suggested edit for a submission's copy (announcement body, website
// update description), shown to the communications office on the admin cards.
// One row per submission; re-running the check replaces it.
export const copyReviews = pgTable('copy_reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  sourceType: varchar('source_type', { length: 30 }).notNull(), // announcement | website_update
  sourceId: uuid('source_id').notNull(),
  // processing -> ready
  status: varchar('status', { length: 20 }).default('processing').notNull(),
  original: text('original').notNull(),
  cleaned: text('cleaned'),
  unchanged: boolean('unchanged').default(false).notNull(),
  changes: json('changes').$type<string[]>(),
  concerns: json('concerns').$type<string[]>(),
  aiError: text('ai_error'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type CopyReview = typeof copyReviews.$inferSelect;

// ============================================================================
// REQUEST STAGES - where the office dragged a card on the board
// ============================================================================

export const requestStages = pgTable('request_stages', {
  id: uuid('id').primaryKey().defaultRandom(),
  sourceTable: varchar('source_table', { length: 30 }).notNull(), // announcements | websiteUpdates | ...
  recordId: varchar('record_id', { length: 64 }).notNull(),
  stage: varchar('stage', { length: 20 }), // review | approved | null
  flag: varchar('flag', { length: 30 }), // msgr | null
  setBy: varchar('set_by', { length: 255 }),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type RequestStage = typeof requestStages.$inferSelect;

// ============================================================================
// TASKS TAB - the Communications Director's to-do list
// ============================================================================

export const portalTasks = pgTable('portal_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerEmail: varchar('owner_email', { length: 255 }).notNull(),
  title: text('title').notNull(),
  notes: text('notes'),
  source: varchar('source', { length: 20 }).default('manual').notNull(), // email | teams | portal | manual
  sourceRef: varchar('source_ref', { length: 500 }), // internetMessageId, Teams message id, portal:<id>
  sourceLink: text('source_link'),
  conversationId: varchar('conversation_id', { length: 500 }), // Outlook conversationId or Teams chat id, for follow-ups
  requesterName: varchar('requester_name', { length: 255 }),
  requesterEmail: varchar('requester_email', { length: 255 }),
  category: varchar('category', { length: 20 }).default('other').notNull(),
  dueAt: timestamp('due_at', { withTimezone: true }),
  importance: varchar('importance', { length: 20 }).default('normal').notNull(), // normal | high
  status: varchar('status', { length: 20 }).default('open').notNull(), // open | in_progress | claimed_done | done
  snoozedUntil: timestamp('snoozed_until', { withTimezone: true }),
  // follow-up tracking
  firstRequestedAt: timestamp('first_requested_at', { withTimezone: true }),
  lastFollowUpAt: timestamp('last_follow_up_at', { withTimezone: true }),
  followUpCount: integer('follow_up_count').default(0).notNull(),
  // a commitment the director made ("I'll get to that today")
  committedFor: timestamp('committed_for', { withTimezone: true }),
  // website verification
  pageUrl: varchar('page_url', { length: 1000 }),
  pageHash: varchar('page_hash', { length: 64 }),
  completionConfidence: integer('completion_confidence'), // 0..100 from the last signal
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

/** Audit trail: every signal that touched a task and what was decided. */
export const taskEvents = pgTable('task_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').notNull(),
  kind: varchar('kind', { length: 30 }).notNull(), // created | follow_up | commitment | in_progress | claimed_done | verified_done | reopened | edited | done | snoozed
  detail: text('detail'),
  confidence: integer('confidence'),
  sourceRef: varchar('source_ref', { length: 500 }),
  sourceLink: text('source_link'),
  actor: varchar('actor', { length: 255 }), // email of a person, or "scan"
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

/** One website update request can carry several individual changes. */
export const websiteUpdateItems = pgTable('website_update_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  updateId: uuid('update_id').notNull(),
  position: integer('position').default(0).notNull(),
  text: text('text').notNull(),
  done: boolean('done').default(false).notNull(),
  doneAt: timestamp('done_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type PortalTask = typeof portalTasks.$inferSelect;
export type TaskEvent = typeof taskEvents.$inferSelect;
export type WebsiteUpdateItem = typeof websiteUpdateItems.$inferSelect;
