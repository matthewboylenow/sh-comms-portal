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
