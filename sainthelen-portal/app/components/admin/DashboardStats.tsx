// app/components/admin/DashboardStats.tsx

import { Card, CardContent } from '../ui/Card';
import { 
  MegaphoneIcon,
  GlobeAltIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';

type DashboardStatsProps = {
  announcements: any[];
  websiteUpdates: any[];
  smsRequests: any[];
  avRequests: any[];
  flyerReviews: any[];
  graphicDesign: any[];
  hideCompleted: boolean;
};

export default function DashboardStats({
  announcements,
  websiteUpdates,
  smsRequests,
  avRequests,
  flyerReviews,
  graphicDesign,
  hideCompleted
}: DashboardStatsProps) {
  // Calculate totals
  const pendingAnnouncements = announcements.filter(r => !r.fields.Completed).length;
  const pendingWebsiteUpdates = websiteUpdates.filter(r => !r.fields.Completed).length;
  const pendingSmsRequests = smsRequests.filter(r => !r.fields.Completed).length;
  const pendingAvRequests = avRequests.filter(r => !r.fields.Completed).length;
  const pendingFlyerReviews = flyerReviews.filter(r => !r.fields.Completed).length;
  const pendingGraphicDesign = graphicDesign.filter(r => !r.fields.Completed).length;
  
  // Calculate urgent counts
  const urgentWebsiteUpdates = websiteUpdates.filter(r => !r.fields.Completed && r.fields.Urgent).length;
  const urgentFlyerReviews = flyerReviews.filter(r => !r.fields.Completed && r.fields.Urgency === 'urgent').length;
  const livestreamRequests = avRequests.filter(r => !r.fields.Completed && r.fields['Needs Livestream']).length;
  const urgentGraphicDesign = graphicDesign.filter(r => !r.fields.Completed && r.fields.Priority === 'Urgent').length;
  
  // Calculate today's date in YYYY-MM-DD format for date comparison
  const today = new Date().toISOString().split('T')[0];
  
  // Find announcements with today's promotion start date
  const todayStarting = announcements.filter(r => {
    const startDate = r.fields['Promotion Start Date'];
    return startDate === today;
  }).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      <Card>
        <CardContent className="p-4 flex items-center">
          <div className="rounded-full p-3 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-200 mr-3">
            <MegaphoneIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Announcements</p>
            <p className="text-2xl font-bold">{pendingAnnouncements}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex items-center">
          <div className="rounded-full p-3 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-200 mr-3">
            <GlobeAltIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Website Updates</p>
            <div className="flex items-center">
              <p className="text-2xl font-bold">{pendingWebsiteUpdates}</p>
              {urgentWebsiteUpdates > 0 && (
                <span className="ml-2 flex items-center text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-0.5 rounded-full">
                  <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                  {urgentWebsiteUpdates} urgent
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex items-center">
          <div className="rounded-full p-3 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-200 mr-3">
            <ChatBubbleLeftRightIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">SMS Requests</p>
            <p className="text-2xl font-bold">{pendingSmsRequests}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex items-center">
          <div className="rounded-full p-3 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200 mr-3">
            <VideoCameraIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">A/V Requests</p>
            <div className="flex items-center">
              <p className="text-2xl font-bold">{pendingAvRequests}</p>
              {livestreamRequests > 0 && (
                <span className="ml-2 flex items-center text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-0.5 rounded-full">
                  <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                  {livestreamRequests} stream
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex items-center">
          <div className="rounded-full p-3 bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-200 mr-3">
            <DocumentTextIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Flyer Reviews</p>
            <div className="flex items-center">
              <p className="text-2xl font-bold">{pendingFlyerReviews}</p>
              {urgentFlyerReviews > 0 && (
                <span className="ml-2 flex items-center text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-0.5 rounded-full">
                  <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                  {urgentFlyerReviews} urgent
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex items-center">
          <div className="rounded-full p-3 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-200 mr-3">
            <PencilSquareIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Graphic Design</p>
            <div className="flex items-center">
              <p className="text-2xl font-bold">{pendingGraphicDesign}</p>
              {urgentGraphicDesign > 0 && (
                <span className="ml-2 flex items-center text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-0.5 rounded-full">
                  <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                  {urgentGraphicDesign} urgent
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}