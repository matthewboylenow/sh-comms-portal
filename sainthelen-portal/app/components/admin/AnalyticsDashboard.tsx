// app/components/admin/AnalyticsDashboard.tsx
'use client';

import React, { useMemo } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '../ui/Card';
import {
  MegaphoneIcon,
  GlobeAltIcon,
  ChatBubbleLeftRightIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

type AdminRecord = {
  id: string;
  fields: Record<string, any>;
};

type AnalyticsDashboardProps = {
  announcements: AdminRecord[];
  websiteUpdates: AdminRecord[];
  smsRequests: AdminRecord[];
  avRequests: AdminRecord[];
  flyerReviews: AdminRecord[];
  graphicDesign: AdminRecord[];
};

export default function AnalyticsDashboard({
  announcements,
  websiteUpdates,
  smsRequests,
  avRequests,
  flyerReviews,
  graphicDesign
}: AnalyticsDashboardProps) {
  
  // Calculate total items and completed items
  const totalItems = announcements.length + websiteUpdates.length + smsRequests.length + 
    avRequests.length + flyerReviews.length + graphicDesign.length;
  
  const completedItems = [
    ...announcements,
    ...websiteUpdates,
    ...smsRequests,
    ...avRequests,
    ...flyerReviews,
    ...graphicDesign
  ].filter(item => item.fields.Completed).length;
  
  // Calculate completion rate
  const completionRate = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  
  // Calculate counts by type
  const counts = {
    announcements: announcements.length,
    websiteUpdates: websiteUpdates.length,
    smsRequests: smsRequests.length,
    avRequests: avRequests.length,
    flyerReviews: flyerReviews.length,
    graphicDesign: graphicDesign.length
  };
  
  // Count urgent items
  const urgentItems = [
    ...websiteUpdates.filter(item => item.fields.Urgent === 'Yes'),
    ...flyerReviews.filter(item => item.fields.Urgency === 'urgent'),
    ...graphicDesign.filter(item => item.fields.Priority === 'Urgent')
  ].length;
  
  // Calculate turnaround metrics
  // This would require creation/completion dates to be accurate in Airtable
  
  // Count pending items by ministry
      const pendingByMinistry = useMemo(() => {
    const allItems = [
      ...announcements,
      ...websiteUpdates,
      ...smsRequests,
      ...avRequests,
      ...flyerReviews,
      ...graphicDesign
    ].filter(item => !item.fields.Completed);

    const ministryMap: Record<string, number> = {};
    
    allItems.forEach(item => {
      const ministry = item.fields.Ministry || 'Unspecified';
      ministryMap[ministry] = (ministryMap[ministry] || 0) + 1;
    });
    
    // Convert to array and sort by count
    return Object.entries(ministryMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5
  }, [announcements, websiteUpdates, smsRequests, avRequests, flyerReviews, graphicDesign]);
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Analytics Dashboard</h2>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center">
            <div className="rounded-full p-3 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-200 mr-3">
              <ClockIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Requests</p>
              <p className="text-2xl font-bold">{totalItems}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center">
            <div className="rounded-full p-3 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-200 mr-3">
              <CheckCircleIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completion Rate</p>
              <p className="text-2xl font-bold">{completionRate}%</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center">
            <div className="rounded-full p-3 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200 mr-3">
              <ExclamationTriangleIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Urgent Items</p>
              <p className="text-2xl font-bold">{urgentItems}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center">
            <div className="rounded-full p-3 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-200 mr-3">
              <MegaphoneIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Tasks</p>
              <p className="text-2xl font-bold">{totalItems - completedItems}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Request Types Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Requests by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-10 h-10 flex items-center justify-center bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-200 rounded-full mr-3">
                  <MegaphoneIcon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">Announcements</p>
                    <p className="text-sm font-medium">{counts.announcements}</p>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(counts.announcements / totalItems) * 100}%` }}></div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-10 h-10 flex items-center justify-center bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-200 rounded-full mr-3">
                  <GlobeAltIcon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">Website Updates</p>
                    <p className="text-sm font-medium">{counts.websiteUpdates}</p>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: `${(counts.websiteUpdates / totalItems) * 100}%` }}></div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-10 h-10 flex items-center justify-center bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-200 rounded-full mr-3">
                  <ChatBubbleLeftRightIcon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">SMS Requests</p>
                    <p className="text-sm font-medium">{counts.smsRequests}</p>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${(counts.smsRequests / totalItems) * 100}%` }}></div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-10 h-10 flex items-center justify-center bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200 rounded-full mr-3">
                  <VideoCameraIcon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">A/V Requests</p>
                    <p className="text-sm font-medium">{counts.avRequests}</p>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-red-600 h-2 rounded-full" style={{ width: `${(counts.avRequests / totalItems) * 100}%` }}></div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-10 h-10 flex items-center justify-center bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-200 rounded-full mr-3">
                  <DocumentTextIcon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">Flyer Reviews</p>
                    <p className="text-sm font-medium">{counts.flyerReviews}</p>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-amber-600 h-2 rounded-full" style={{ width: `${(counts.flyerReviews / totalItems) * 100}%` }}></div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-10 h-10 flex items-center justify-center bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-200 rounded-full mr-3">
                  <PencilSquareIcon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">Graphic Design</p>
                    <p className="text-sm font-medium">{counts.graphicDesign}</p>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-pink-600 h-2 rounded-full" style={{ width: `${(counts.graphicDesign / totalItems) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Ministry Engagement */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Ministries by Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingByMinistry.length > 0 ? (
              <div className="space-y-4">
                {pendingByMinistry.map((ministry, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-10 h-10 flex items-center justify-center bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-200 rounded-full mr-3">
                      <span className="font-bold">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">{ministry.name}</p>
                        <p className="text-sm font-medium">{ministry.count}</p>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full" 
                          style={{ width: `${(ministry.count / pendingByMinistry[0].count) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500 dark:text-gray-400">No ministry data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}