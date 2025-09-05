// app/components/admin/DashboardStats.tsx
import { Card, CardContent } from '../ui/Card';
import { 
  MegaphoneIcon,
  GlobeAltIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  ChartBarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { format, parseISO, subDays, eachDayOfInterval } from 'date-fns';

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

  // Prepare data for charts
  const pieData = stats.map(stat => ({
    name: stat.title,
    value: stat.count,
    color: stat.textColor.includes('blue') ? '#3B82F6' :
           stat.textColor.includes('green') ? '#10B981' :
           stat.textColor.includes('purple') ? '#8B5CF6' :
           stat.textColor.includes('red') ? '#EF4444' :
           stat.textColor.includes('amber') ? '#F59E0B' :
           '#6366F1'
  })).filter(item => item.value > 0);

  // Calculate submissions over the last 7 days
  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date()
  });

  const submissionTrendData = last7Days.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const daySubmissions = [...announcements, ...websiteUpdates, ...smsRequests, ...avRequests, ...flyerReviews, ...graphicDesign]
      .filter(record => {
        const submittedDate = record.fields['Submitted At'];
        if (!submittedDate) return false;
        return submittedDate.startsWith(dayStr);
      }).length;

    return {
      date: format(day, 'MMM dd'),
      submissions: daySubmissions,
      fullDate: dayStr
    };
  });

  // Calculate completion rate data
  const allRecords = [...announcements, ...websiteUpdates, ...smsRequests, ...avRequests, ...flyerReviews, ...graphicDesign];
  const completionData = stats.map(stat => {
    const tableName = stat.title;
    let records = [];
    
    switch (tableName) {
      case 'Announcements': records = announcements; break;
      case 'Website Updates': records = websiteUpdates; break;
      case 'SMS Requests': records = smsRequests; break;
      case 'A/V Requests': records = avRequests; break;
      case 'Flyer Reviews': records = flyerReviews; break;
      case 'Graphic Design': records = graphicDesign; break;
    }

    const total = records.length;
    const completed = records.filter(r => r.fields.Completed).length;
    const pending = total - completed;
    
    return {
      category: tableName.replace(' Requests', '').replace(' Updates', ''),
      completed,
      pending,
      total,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }).filter(item => item.total > 0);

  return (
    <div className="mb-8">
      {/* Total pending stats */}
      <motion.div 
        className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1 text-gray-900 dark:text-white">Communications Dashboard</h2>
            <p className="text-gray-600 dark:text-gray-400">{hideCompleted ? 'Showing pending items only' : 'Showing all items'}</p>
          </div>
          <div className="mt-4 md:mt-0 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <div className="text-center">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">TOTAL PENDING</p>
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{totalPending}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {stats.map((stat, index) => (
          <motion.div 
            key={stat.title}
            className="col-span-1"
            custom={index}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
          >
            <a href={stat.link} className="block h-full group">
              <Card className="border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 h-full group-hover:-translate-y-1">
                <CardContent className="p-0 h-full">
                  <div className="flex flex-col h-full">
                    <div className={`h-20 w-full ${stat.bgColor} rounded-t-xl flex items-center justify-center`}>
                      <div className={`h-10 w-10 ${stat.textColor} flex items-center justify-center`}>
                        {stat.icon}
                      </div>
                    </div>
                    <div className="p-4 text-center flex-grow">
                      <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">{stat.title}</h3>
                      <div className="flex items-center justify-center">
                        <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.count}</p>
                        {stat.urgent > 0 && (
                          <div className="ml-2 flex flex-col">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300">
                              <ExclamationTriangleIcon className="h-3 w-3 mr-0.5" />
                              {stat.urgentLabel || stat.urgent}
                            </span>
                          </div>
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

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {/* Pending Requests Distribution */}
        {pieData.length > 0 && (
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Card className="border border-gray-200 dark:border-gray-700 shadow-sm h-full">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <ChartBarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pending Distribution</h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Submission Trend (Last 7 Days) */}
        <motion.div
          className="lg:col-span-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Card className="border border-gray-200 dark:border-gray-700 shadow-sm h-full">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <ClockIcon className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">7-Day Trend</h3>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={submissionTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="submissions" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Completion Rates */}
        {completionData.length > 0 && (
          <motion.div
            className="lg:col-span-2 xl:col-span-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <Card className="border border-gray-200 dark:border-gray-700 shadow-sm h-full">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <ExclamationTriangleIcon className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Completion Status</h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={completionData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="category" type="category" width={80} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="completed" stackId="a" fill="#10B981" name="Completed" />
                      <Bar dataKey="pending" stackId="a" fill="#F59E0B" name="Pending" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}