// app/components/admin/DashboardStats.tsx
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
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
      {/* Announcements Card */}
      <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
        <CardContent className="p-0">
          <div className="flex flex-col h-full">
            <div className="h-24 w-full bg-blue-50 dark:bg-blue-900/20 rounded-t-lg flex items-center justify-center">
              <div className="bg-white dark:bg-gray-800 p-3 rounded-full shadow-md">
                <MegaphoneIcon className="h-10 w-10 text-blue-500 dark:text-blue-400" />
              </div>
            </div>
            <div className="p-4 text-center">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Announcements</h3>
              <p className="text-4xl font-bold text-gray-900 dark:text-white">{pendingAnnouncements}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Website Updates Card */}
      <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
        <CardContent className="p-0">
          <div className="flex flex-col h-full">
            <div className="h-24 w-full bg-green-50 dark:bg-green-900/20 rounded-t-lg flex items-center justify-center">
              <div className="bg-white dark:bg-gray-800 p-3 rounded-full shadow-md">
                <GlobeAltIcon className="h-10 w-10 text-green-500 dark:text-green-400" />
              </div>
            </div>
            <div className="p-4 text-center">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Website Updates</h3>
              <div className="flex items-center justify-center">
                <p className="text-4xl font-bold text-gray-900 dark:text-white">{pendingWebsiteUpdates}</p>
                {urgentWebsiteUpdates > 0 && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300">
                    <ExclamationTriangleIcon className="h-3 w-3 mr-0.5" />
                    {urgentWebsiteUpdates}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SMS Requests Card */}
      <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
        <CardContent className="p-0">
          <div className="flex flex-col h-full">
            <div className="h-24 w-full bg-purple-50 dark:bg-purple-900/20 rounded-t-lg flex items-center justify-center">
              <div className="bg-white dark:bg-gray-800 p-3 rounded-full shadow-md">
                <ChatBubbleLeftRightIcon className="h-10 w-10 text-purple-500 dark:text-purple-400" />
              </div>
            </div>
            <div className="p-4 text-center">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">SMS Requests</h3>
              <p className="text-4xl font-bold text-gray-900 dark:text-white">{pendingSmsRequests}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* A/V Requests Card */}
      <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
        <CardContent className="p-0">
          <div className="flex flex-col h-full">
            <div className="h-24 w-full bg-red-50 dark:bg-red-900/20 rounded-t-lg flex items-center justify-center">
              <div className="bg-white dark:bg-gray-800 p-3 rounded-full shadow-md">
                <VideoCameraIcon className="h-10 w-10 text-red-500 dark:text-red-400" />
              </div>
            </div>
            <div className="p-4 text-center">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">A/V Requests</h3>
              <div className="flex items-center justify-center">
                <p className="text-4xl font-bold text-gray-900 dark:text-white">{pendingAvRequests}</p>
                {livestreamRequests > 0 && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300">
                    <ExclamationTriangleIcon className="h-3 w-3 mr-0.5" />
                    {livestreamRequests}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flyer Reviews Card */}
      <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
        <CardContent className="p-0">
          <div className="flex flex-col h-full">
            <div className="h-24 w-full bg-amber-50 dark:bg-amber-900/20 rounded-t-lg flex items-center justify-center">
              <div className="bg-white dark:bg-gray-800 p-3 rounded-full shadow-md">
                <DocumentTextIcon className="h-10 w-10 text-amber-500 dark:text-amber-400" />
              </div>
            </div>
            <div className="p-4 text-center">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Flyer Reviews</h3>
              <div className="flex items-center justify-center">
                <p className="text-4xl font-bold text-gray-900 dark:text-white">{pendingFlyerReviews}</p>
                {urgentFlyerReviews > 0 && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300">
                    <ExclamationTriangleIcon className="h-3 w-3 mr-0.5" />
                    {urgentFlyerReviews}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Graphic Design Card */}
      <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
        <CardContent className="p-0">
          <div className="flex flex-col h-full">
            <div className="h-24 w-full bg-indigo-50 dark:bg-indigo-900/20 rounded-t-lg flex items-center justify-center">
              <div className="bg-white dark:bg-gray-800 p-3 rounded-full shadow-md">
                <PencilSquareIcon className="h-10 w-10 text-indigo-500 dark:text-indigo-400" />
              </div>
            </div>
            <div className="p-4 text-center">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Graphic Design</h3>
              <div className="flex items-center justify-center">
                <p className="text-4xl font-bold text-gray-900 dark:text-white">{pendingGraphicDesign}</p>
                {urgentGraphicDesign > 0 && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300">
                    <ExclamationTriangleIcon className="h-3 w-3 mr-0.5" />
                    {urgentGraphicDesign}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}