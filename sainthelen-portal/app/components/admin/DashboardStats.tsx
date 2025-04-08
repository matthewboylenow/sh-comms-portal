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
import { motion } from 'framer-motion';

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

  // Stats card animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: { 
        delay: custom * 0.1,
        duration: 0.5,
        ease: "easeOut"
      }
    })
  };

  // Stats for each card
  const stats = [
    {
      title: "Announcements",
      count: pendingAnnouncements,
      icon: <MegaphoneIcon className="h-5 w-5" />,
      color: "from-blue-500 to-blue-600",
      textColor: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      urgent: 0,
      link: "#announcements"
    },
    {
      title: "Website Updates",
      count: pendingWebsiteUpdates,
      icon: <GlobeAltIcon className="h-5 w-5" />,
      color: "from-emerald-500 to-green-600",
      textColor: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      urgent: urgentWebsiteUpdates,
      link: "#websiteUpdates"
    },
    {
      title: "SMS Requests",
      count: pendingSmsRequests,
      icon: <ChatBubbleLeftRightIcon className="h-5 w-5" />,
      color: "from-purple-500 to-purple-600",
      textColor: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      urgent: 0,
      link: "#smsRequests"
    },
    {
      title: "A/V Requests",
      count: pendingAvRequests,
      icon: <VideoCameraIcon className="h-5 w-5" />,
      color: "from-red-500 to-red-600",
      textColor: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-50 dark:bg-red-900/20",
      urgent: livestreamRequests,
      link: "#avRequests",
      urgentLabel: "Livestream"
    },
    {
      title: "Flyer Reviews",
      count: pendingFlyerReviews,
      icon: <DocumentTextIcon className="h-5 w-5" />,
      color: "from-amber-500 to-amber-600",
      textColor: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
      urgent: urgentFlyerReviews,
      link: "#flyerReviews"
    },
    {
      title: "Graphic Design",
      count: pendingGraphicDesign,
      icon: <PencilSquareIcon className="h-5 w-5" />,
      color: "from-indigo-500 to-indigo-600",
      textColor: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
      urgent: urgentGraphicDesign,
      link: "#graphicDesign"
    }
  ];

  // Calculate total pending requests
  const totalPending = stats.reduce((sum, stat) => sum + stat.count, 0);

  return (
    <div className="mb-8">
      {/* Total pending stats */}
      <motion.div 
        className="mb-6 p-6 bg-gradient-to-r from-sh-primary to-blue-700 rounded-xl shadow-lg text-white"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">Communications Dashboard</h2>
            <p className="text-blue-100">{hideCompleted ? 'Showing pending items only' : 'Showing all items'}</p>
          </div>
          <div className="mt-4 md:mt-0 bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="text-center">
              <p className="text-sm text-blue-100">TOTAL PENDING</p>
              <p className="text-4xl font-bold">{totalPending}</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, index) => (
          <motion.div 
            key={stat.title}
            className="col-span-1"
            custom={index}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
          >
            <a href={stat.link} className="block h-full">
              <Card className="border-0 shadow hover:shadow-md transition-all transform hover:-translate-y-1 duration-200 h-full">
                <CardContent className="p-0 h-full">
                  <div className="flex flex-col h-full">
                    <div className={`h-28 w-full ${stat.bgColor} rounded-t-lg flex items-center justify-center`}>
                      <div className="bg-white dark:bg-gray-800 p-3 rounded-full shadow-md">
                        <div className={`h-12 w-12 bg-gradient-to-r ${stat.color} rounded-full flex items-center justify-center text-white`}>
                          {stat.icon}
                        </div>
                      </div>
                    </div>
                    <div className="p-4 text-center flex-grow">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{stat.title}</h3>
                      <div className="flex items-center justify-center">
                        <p className={`text-4xl font-bold ${stat.textColor}`}>{stat.count}</p>
                        {stat.urgent > 0 && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300">
                            <ExclamationTriangleIcon className="h-3 w-3 mr-0.5" />
                            {stat.urgentLabel || stat.urgent}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </a>
          </motion.div>
        ))}
      </div>
    </div>
  );
}