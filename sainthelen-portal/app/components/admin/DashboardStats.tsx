// app/components/admin/DashboardStats.tsx - Improved layout

import { Card, CardContent } from '../ui/Card';
import { 
  MegaphoneIcon,
  GlobeAltIcon,
  ChatBubbleLeftRightIcon,
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

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {/* Announcements Card */}
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="absolute top-0 left-0 w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-br-xl flex items-center justify-center">
            <MegaphoneIcon className="h-8 w-8 text-blue-600 dark:text-blue-300" />
          </div>
          <div className="ml-14 mt-1">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Announcements</p>
            <p className="text-4xl font-bold mt-1">{pendingAnnouncements}</p>
          </div>
        </CardContent>
      </Card>

      {/* Website Updates Card */}
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="absolute top-0 left-0 w-16 h-16 bg-green-100 dark:bg-green-900 rounded-br-xl flex items-center justify-center">
            <GlobeAltIcon className="h-8 w-8 text-green-600 dark:text-green-300" />
          </div>
          <div className="ml-14 mt-1">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Website Updates</p>
            <div className="flex items-center">
              <p className="text-4xl font-bold mt-1">{pendingWebsiteUpdates}</p>
              {urgentWebsiteUpdates > 0 && (
                <span className="ml-2 flex items-center text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                  <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                  {urgentWebsiteUpdates} urgent
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SMS Requests Card */}
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="absolute top-0 left-0 w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-br-xl flex items-center justify-center">
            <ChatBubbleLeftRightIcon className="h-8 w-8 text-purple-600 dark:text-purple-300" />
          </div>
          <div className="ml-14 mt-1">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">SMS Requests</p>
            <p className="text-4xl font-bold mt-1">{pendingSmsRequests}</p>
          </div>
        </CardContent>
      </Card>

      {/* A/V Requests Card */}
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="absolute top-0 left-0 w-16 h-16 bg-red-100 dark:bg-red-900 rounded-br-xl flex items-center justify-center">
            <VideoCameraIcon className="h-8 w-8 text-red-600 dark:text-red-300" />
          </div>
          <div className="ml-14 mt-1">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">A/V Requests</p>
            <div className="flex items-center">
              <p className="text-4xl font-bold mt-1">{pendingAvRequests}</p>
              {livestreamRequests > 0 && (
                <span className="ml-2 flex items-center text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                  <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                  {livestreamRequests} stream
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flyer Reviews Card */}
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="absolute top-0 left-0 w-16 h-16 bg-amber-100 dark:bg-amber-900 rounded-br-xl flex items-center justify-center">
            <DocumentTextIcon className="h-8 w-8 text-amber-600 dark:text-amber-300" />
          </div>
          <div className="ml-14 mt-1">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Flyer Reviews</p>
            <div className="flex items-center">
              <p className="text-4xl font-bold mt-1">{pendingFlyerReviews}</p>
              {urgentFlyerReviews > 0 && (
                <span className="ml-2 flex items-center text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                  <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                  {urgentFlyerReviews} urgent
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Graphic Design Card */}
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="absolute top-0 left-0 w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-br-xl flex items-center justify-center">
            <PencilSquareIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-300" />
          </div>
          <div className="ml-14 mt-1">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Graphic Design</p>
            <div className="flex items-center">
              <p className="text-4xl font-bold mt-1">{pendingGraphicDesign}</p>
              {urgentGraphicDesign > 0 && (
                <span className="ml-2 flex items-center text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-0.5 rounded-full whitespace-nowrap">
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