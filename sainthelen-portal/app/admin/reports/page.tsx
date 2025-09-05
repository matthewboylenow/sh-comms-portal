'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { CalendarDaysIcon, ArrowDownTrayIcon, ChartBarIcon, ClockIcon, ExclamationTriangleIcon, CheckCircleIcon, TrendingUpIcon } from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface WeeklyReportData {
  weekStart: string;
  weekEnd: string;
  totalRequests: number;
  completedRequests: number;
  pendingRequests: number;
  avgCompletionTime: number;
  requestsByType: {
    websiteUpdates: RequestTypeStats;
    flyerReviews: RequestTypeStats;
    graphicDesign: RequestTypeStats;
  };
  urgentRequests: {
    total: number;
    completed: number;
    avgCompletionTime: number;
  };
}

interface RequestTypeStats {
  total: number;
  completed: number;
  pending: number;
  avgCompletionTime: number;
  requests: RequestDetails[];
}

interface CompletionTime {
  totalHours: number;
  days: number;
  hours: number;
  displayText: string;
}

interface RequestDetails {
  id: string;
  name: string;
  email: string;
  submittedDate: string;
  completedDate?: string;
  status: string;
  completionTime?: CompletionTime;
  priority?: string;
  urgent?: boolean;
  description: string;
}

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const [reportData, setReportData] = useState<WeeklyReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState('0');
  const [downloading, setDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (status === 'authenticated') {
      fetchReport();
    }
  }, [status, selectedWeek]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/weekly-report?weekOffset=${selectedWeek}`);
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      } else {
        console.error('Failed to fetch report');
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = async () => {
    setDownloading(true);
    try {
      const response = await fetch(`/api/admin/weekly-report?weekOffset=${selectedWeek}&format=csv`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `weekly-report-${reportData?.weekStart || 'latest'}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Failed to download CSV');
      }
    } catch (error) {
      console.error('Error downloading CSV:', error);
    } finally {
      setDownloading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatCompletionTime = (decimalDays: number) => {
    if (decimalDays === 0) return '0h';
    
    const totalHours = Math.round(decimalDays * 24);
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    
    if (days > 0 && hours > 0) {
      return `${days} day${days > 1 ? 's' : ''} ${hours} hour${hours > 1 ? 's' : ''}`;
    } else if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''}`;
    } else {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
  };

  const getWeekOptions = () => {
    const options = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (i * 7));
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay());
      
      const label = i === 0 ? 'Current Week' : `${i} week${i > 1 ? 's' : ''} ago`;
      options.push({
        value: i.toString(),
        label: `${label} (${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`
      });
    }
    return options;
  };

  const completionRate = reportData?.totalRequests > 0 
    ? Math.round((reportData.completedRequests / reportData.totalRequests) * 100) 
    : 0;

  // Prepare chart data
  const requestTypeChartData = reportData ? Object.entries(reportData.requestsByType).map(([key, data]) => ({
    name: key === 'websiteUpdates' ? 'Website Updates' : 
          key === 'flyerReviews' ? 'Flyer Reviews' : 'Graphic Design',
    total: data.total,
    completed: data.completed,
    pending: data.pending,
    completionRate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0
  })) : [];

  const pieChartData = requestTypeChartData.map(item => ({
    name: item.name,
    value: item.total,
    color: item.name.includes('Website') ? '#3B82F6' :
           item.name.includes('Flyer') ? '#10B981' : '#F59E0B'
  }));

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (status === 'loading' || loading) {
    return (
      <AdminLayout title="Weekly Reports">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading report...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!reportData) {
    return (
      <AdminLayout title="Weekly Reports">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No Data Available</h2>
          <p className="text-gray-600 dark:text-gray-400">Unable to load report data.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Weekly Reports">
      <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Weekly Reports</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Performance metrics for {formatDate(reportData.weekStart)} - {formatDate(reportData.weekEnd)}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative">
            <CalendarDaysIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select 
              value={selectedWeek} 
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {getWeekOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <Button onClick={downloadCSV} disabled={downloading} size="sm" className="w-full sm:w-auto">
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            {downloading ? 'Downloading...' : 'Download CSV'}
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <ChartBarIcon className="h-4 w-4 mr-2" />
              Total Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalRequests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-gray-500">
              {reportData.completedRequests} of {reportData.totalRequests} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <ClockIcon className="h-4 w-4 mr-2" />
              Avg. Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCompletionTime(reportData.avgCompletionTime)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
              Urgent Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.urgentRequests.total}</div>
            <p className="text-xs text-gray-500">
              {reportData.urgentRequests.completed} completed
              {reportData.urgentRequests.avgCompletionTime > 0 && 
                ` (${formatCompletionTime(reportData.urgentRequests.avgCompletionTime)} avg)`
              }
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {/* Mobile-Optimized Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <nav className="flex space-x-6 sm:space-x-8 min-w-max" aria-label="Tabs">
            {[
              { key: 'overview', label: 'Overview', shortLabel: 'Overview' },
              { key: 'website', label: 'Website Updates', shortLabel: 'Website' },
              { key: 'flyers', label: 'Flyer Reviews', shortLabel: 'Flyers' },
              { key: 'design', label: 'Graphic Design', shortLabel: 'Design' },
              { key: 'details', label: 'Request Details', shortLabel: 'Details' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-xs sm:text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {Object.entries(reportData.requestsByType).map(([key, data]) => {
              const titles = {
                websiteUpdates: 'Website Updates',
                flyerReviews: 'Flyer Reviews',
                graphicDesign: 'Graphic Design'
              };
              
              return (
                <Card key={key}>
                  <CardHeader>
                    <CardTitle className="text-lg">{titles[key as keyof typeof titles]}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total:</span>
                      <span className="font-semibold">{data.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Completed:</span>
                      <span className="font-semibold text-green-600">{data.completed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Pending:</span>
                      <span className="font-semibold text-orange-600">{data.pending}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Avg. Time:</span>
                      <span className="font-semibold">{formatCompletionTime(data.avgCompletionTime)}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {['website', 'flyers', 'design'].map(tab => {
          const dataKey = tab === 'website' ? 'websiteUpdates' : 
                         tab === 'flyers' ? 'flyerReviews' : 'graphicDesign';
          const data = reportData.requestsByType[dataKey];
          
          return activeTab === tab && (
            <div key={tab}>
              <Card>
                <CardHeader>
                  <CardTitle>
                    {tab === 'website' ? 'Website Updates' : 
                     tab === 'flyers' ? 'Flyer Reviews' : 'Graphic Design Requests'}
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {data.total} total requests, {data.completed} completed, {data.pending} pending
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.requests.map(request => (
                      <div key={request.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{request.name}</h4>
                            <p className="text-sm text-gray-600">{request.email}</p>
                          </div>
                          <div className="flex gap-2">
                            {request.urgent && <Badge variant="danger">Urgent</Badge>}
                            <Badge variant={
                              request.status === 'Completed' || request.status === 'Done' ? 'success' :
                              request.status === 'Pending' ? 'warning' : 'default'
                            }>
                              {request.status}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2">{request.description}</p>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Submitted: {formatDate(request.submittedDate)}</span>
                          {request.completedDate && (
                            <span>Completed: {formatDate(request.completedDate)} 
                              {request.completionTime && ` (${request.completionTime.displayText})`}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {data.requests.length === 0 && (
                      <p className="text-center text-gray-500 py-4">No requests for this week</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          );
          })}

        {activeTab === 'details' && (
          <Card>
            <CardHeader>
              <CardTitle>All Request Details</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">Complete list of all requests for the selected week</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  ...reportData.requestsByType.websiteUpdates.requests.map(r => ({...r, type: 'Website Update'})),
                  ...reportData.requestsByType.flyerReviews.requests.map(r => ({...r, type: 'Flyer Review'})),
                  ...reportData.requestsByType.graphicDesign.requests.map(r => ({...r, type: 'Graphic Design'}))
                ]
                .sort((a, b) => new Date(a.submittedDate).getTime() - new Date(b.submittedDate).getTime())
                .map(request => (
                  <div key={`${request.type}-${request.id}`} className="border rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{request.name}</h4>
                        <p className="text-sm text-gray-600">{request.email}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="info">{(request as any).type}</Badge>
                        {request.urgent && <Badge variant="danger">Urgent</Badge>}
                        <Badge variant={
                          request.status === 'Completed' || request.status === 'Done' ? 'success' :
                          request.status === 'Pending' ? 'warning' : 'default'
                        }>
                          {request.status}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">{request.description}</p>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Submitted: {formatDate(request.submittedDate)}</span>
                      {request.completedDate && (
                        <span>Completed: {formatDate(request.completedDate)} 
                          {request.completionTime && ` (${request.completionTime.displayText})`}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts Section - Mobile Responsive */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mt-6">
            {/* Request Distribution Pie Chart */}
            {pieChartData.length > 0 && (
              <Card className="w-full">
                <CardHeader>
                  <CardTitle className="flex items-center text-sm sm:text-base">
                    <ChartBarIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Request Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 sm:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={60}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Completion Rate Bar Chart */}
            {requestTypeChartData.length > 0 && (
              <Card className="w-full">
                <CardHeader>
                  <CardTitle className="flex items-center text-sm sm:text-base">
                    <TrendingUpIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Completion Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 sm:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={requestTypeChartData} margin={{ bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45} 
                          textAnchor="end" 
                          height={80} 
                          fontSize={11}
                          interval={0}
                        />
                        <YAxis fontSize={11} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Bar dataKey="completed" stackId="a" fill="#10B981" name="Completed" />
                        <Bar dataKey="pending" stackId="a" fill="#F59E0B" name="Pending" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
      </div>
    </AdminLayout>
  );
}