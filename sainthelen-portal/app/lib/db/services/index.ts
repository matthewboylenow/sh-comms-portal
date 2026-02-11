/**
 * Database Services - Re-export all service modules
 *
 * Usage:
 *   import { ministriesService, announcementsService } from '@/app/lib/db/services';
 *   const ministries = await ministriesService.getAllMinistries();
 */

export * as ministriesService from './ministries';
export * as announcementsService from './announcements';
export * as websiteUpdatesService from './website-updates';
export * as graphicDesignService from './graphic-design';
export * as avRequestsService from './av-requests';
export * as smsRequestsService from './sms-requests';
export * as flyerReviewsService from './flyer-reviews';
export * as commentsService from './comments';
export * as notificationsService from './notifications';

// Command Center services
export * as tasksService from './tasks';
export * as notesService from './notes';
export * as recurringRemindersService from './recurring-reminders';
export * as userPreferencesService from './user-preferences';
export * as socialMediaContentService from './social-media-content';

// Re-export individual functions for convenience
export {
  getAllMinistries,
  getMinistryById,
  getMinistryByName,
  findMinistryByNameOrAlias,
  getMinistriesRequiringApproval,
  createMinistry,
  updateMinistry,
  deleteMinistry,
} from './ministries';

export {
  getAnnouncements,
  getAnnouncementById,
  getPendingApprovals,
  createAnnouncement,
  updateAnnouncement,
  approveAnnouncement,
  rejectAnnouncement,
  bulkApproveAnnouncements,
  bulkRejectAnnouncements,
} from './announcements';

export {
  getCommentsForRecord,
  createAdminComment,
  createPublicComment,
  deleteComment,
} from './comments';

export {
  getNotificationsForUser,
  getUnreadNotifications,
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from './notifications';

// Command Center exports
export {
  getTasksForUser,
  getTasksForDate,
  getTasksForDateRange,
  getOverdueTasks,
  getTaskById,
  createTask,
  updateTask,
  completeTask,
  uncompleteTask,
  deleteTask,
  getPendingTaskCount,
} from './tasks';

export {
  getNotesForUser,
  getPinnedNotes,
  getNoteById,
  createNote,
  updateNote,
  toggleNotePin,
  deleteNote,
} from './notes';

export {
  getRemindersForUser,
  getRemindersByFrequency,
  getRemindersForDayOfWeek,
  getReminderById,
  createReminder,
  updateReminder,
  toggleReminderActive,
  deleteReminder,
  seedDefaultReminders,
  getDailyRemindersToGenerate,
  getWeeklyRemindersForToday,
} from './recurring-reminders';

export {
  getPreferencesForUser,
  updatePreferences,
  toggleDailyDigest,
  getUsersWithDigestEnabled,
  setDefaultView,
  setDigestTime,
} from './user-preferences';

export {
  getContentForUser,
  getDraftContent,
  getContentById,
  getContentForSourceRecord,
  createContent,
  updateContent,
  markAsPosted,
  archiveContent,
  deleteContent,
  getContentSuggestionsForDate,
  getPlatformCharacterLimit,
  getRecommendedHashtagCount,
} from './social-media-content';
