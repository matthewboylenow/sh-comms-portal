import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';

export const dynamic = 'force-dynamic';

const personalToken = process.env.AIRTABLE_PERSONAL_TOKEN || '';
const baseId = process.env.AIRTABLE_BASE_ID || '';
const websiteUpdatesTable = process.env.WEBSITE_UPDATES_TABLE_NAME || 'Website Updates';
const flyerReviewsTable = process.env.FLYER_REVIEW_TABLE_NAME || 'Flyer Reviews';
const graphicDesignTable = process.env.GRAPHIC_DESIGN_TABLE_NAME || 'Graphic Design Requests';

const base = new Airtable({ apiKey: personalToken }).base(baseId);

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

function getWeekDates(weekOffset: number = 0): { start: Date; end: Date } {
  const now = new Date();
  const currentDay = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - currentDay - (weekOffset * 7));
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

interface CompletionTime {
  totalHours: number;
  days: number;
  hours: number;
  displayText: string;
}

function calculateCompletionTime(submitted: string, completed?: string): CompletionTime | undefined {
  if (!completed) return undefined;
  
  const submittedDate = new Date(submitted);
  const completedDate = new Date(completed);
  const diffTime = completedDate.getTime() - submittedDate.getTime();
  const totalHours = Math.ceil(diffTime / (1000 * 60 * 60)); // Total hours
  
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  
  let displayText = '';
  if (days > 0 && hours > 0) {
    displayText = `${days}d ${hours}h`;
  } else if (days > 0) {
    displayText = `${days}d`;
  } else {
    displayText = `${hours}h`;
  }
  
  return {
    totalHours,
    days,
    hours,
    displayText
  };
}

function isWithinWeek(date: string, weekStart: Date, weekEnd: Date): boolean {
  const recordDate = new Date(date);
  return recordDate >= weekStart && recordDate <= weekEnd;
}

async function fetchRequestsForWeek(tableName: string, weekStart: Date, weekEnd: Date) {
  try {
    const records = await base(tableName)
      .select({ view: 'Grid view' })
      .all();
    
    return records.filter(record => {
      const createdTime = record.get('Created Time') || record._rawJson.createdTime;
      return createdTime && isWithinWeek(createdTime, weekStart, weekEnd);
    });
  } catch (error) {
    console.error(`Error fetching ${tableName}:`, error);
    return [];
  }
}

function processRequests(records: any[], type: string): RequestTypeStats {
  const requests: RequestDetails[] = records.map(record => {
    const fields = record.fields;
    const createdTime = fields['Created Time'] || record._rawJson.createdTime;
    const completedDate = fields['Completed Date'] || fields['Date Completed'];
    
    return {
      id: record.id,
      name: fields.Name || '',
      email: fields.Email || '',
      submittedDate: createdTime,
      completedDate,
      status: fields.Status || 'Pending',
      completionTime: calculateCompletionTime(createdTime, completedDate),
      priority: fields.Priority,
      urgent: fields.Urgent === 'Yes' || fields.Priority === 'Urgent',
      description: fields['Project Description'] || fields['Project Type'] || fields['Event Name'] || fields.Description || ''
    };
  });

  const completed = requests.filter(req => 
    req.status === 'Completed' || req.status === 'Done' || req.completedDate
  );
  
  const completionTimes = completed
    .map(req => req.completionTime?.totalHours)
    .filter((time): time is number => time !== undefined);
    
  const avgCompletionTimeHours = completionTimes.length > 0 
    ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length 
    : 0;

  // Convert average back to days for backward compatibility in overview stats
  const avgCompletionTimeDays = avgCompletionTimeHours / 24;

  return {
    total: requests.length,
    completed: completed.length,
    pending: requests.length - completed.length,
    avgCompletionTime: Math.round(avgCompletionTimeDays * 10) / 10,
    requests
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const weekOffset = parseInt(searchParams.get('weekOffset') || '0');
    const format = searchParams.get('format') || 'json';
    
    const { start: weekStart, end: weekEnd } = getWeekDates(weekOffset);
    
    // Fetch all request types for the week
    const [websiteRecords, flyerRecords, graphicRecords] = await Promise.all([
      fetchRequestsForWeek(websiteUpdatesTable, weekStart, weekEnd),
      fetchRequestsForWeek(flyerReviewsTable, weekStart, weekEnd),
      fetchRequestsForWeek(graphicDesignTable, weekStart, weekEnd)
    ]);

    // Process each request type
    const websiteUpdates = processRequests(websiteRecords, 'Website Updates');
    const flyerReviews = processRequests(flyerRecords, 'Flyer Reviews');
    const graphicDesign = processRequests(graphicRecords, 'Graphic Design');

    // Calculate overall stats
    const totalRequests = websiteUpdates.total + flyerReviews.total + graphicDesign.total;
    const completedRequests = websiteUpdates.completed + flyerReviews.completed + graphicDesign.completed;
    const pendingRequests = totalRequests - completedRequests;

    // Calculate overall average completion time
    const allCompletionTimes = [
      ...websiteUpdates.requests,
      ...flyerReviews.requests,
      ...graphicDesign.requests
    ]
      .map(req => req.completionTime?.totalHours)
      .filter((time): time is number => time !== undefined);
    
    const avgCompletionTimeHours = allCompletionTimes.length > 0 
      ? allCompletionTimes.reduce((sum, time) => sum + time, 0) / allCompletionTimes.length 
      : 0;
    
    const avgCompletionTime = avgCompletionTimeHours / 24; // Convert to days for display

    // Calculate urgent request stats
    const allRequests = [
      ...websiteUpdates.requests,
      ...flyerReviews.requests,
      ...graphicDesign.requests
    ];
    
    const urgentRequests = allRequests.filter(req => req.urgent);
    const urgentCompleted = urgentRequests.filter(req => 
      req.status === 'Completed' || req.status === 'Done' || req.completedDate
    );
    
    const urgentCompletionTimes = urgentCompleted
      .map(req => req.completionTime?.totalHours)
      .filter((time): time is number => time !== undefined);
      
    const urgentAvgCompletionTimeHours = urgentCompletionTimes.length > 0 
      ? urgentCompletionTimes.reduce((sum, time) => sum + time, 0) / urgentCompletionTimes.length 
      : 0;
      
    const urgentAvgCompletionTime = urgentAvgCompletionTimeHours / 24; // Convert to days for display

    const reportData: WeeklyReportData = {
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      totalRequests,
      completedRequests,
      pendingRequests,
      avgCompletionTime: Math.round(avgCompletionTime * 10) / 10,
      requestsByType: {
        websiteUpdates,
        flyerReviews,
        graphicDesign
      },
      urgentRequests: {
        total: urgentRequests.length,
        completed: urgentCompleted.length,
        avgCompletionTime: Math.round(urgentAvgCompletionTime * 10) / 10
      }
    };

    if (format === 'csv') {
      // Generate CSV format
      const csvData = generateCSV(reportData);
      return new NextResponse(csvData, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="weekly-report-${reportData.weekStart}.csv"`,
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      });
    }

    return new NextResponse(JSON.stringify(reportData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });

  } catch (error: any) {
    console.error('Error generating weekly report:', error);
    return new NextResponse(
      JSON.stringify({ error: error.message || 'Error generating report' }),
      { status: 500 }
    );
  }
}

function generateCSV(data: WeeklyReportData): string {
  const headers = [
    'Request Type',
    'Requester Name', 
    'Email',
    'Description',
    'Submitted Date',
    'Completed Date',
    'Status',
    'Priority/Urgent',
    'Completion Time (Days)'
  ];

  const rows = [
    headers.join(','),
    '',
    `Weekly Report: ${data.weekStart} to ${data.weekEnd}`,
    `Total Requests: ${data.totalRequests}`,
    `Completed: ${data.completedRequests}`,
    `Pending: ${data.pendingRequests}`,
    `Average Completion Time: ${data.avgCompletionTime} days`,
    `Urgent Requests: ${data.urgentRequests.total} (${data.urgentRequests.completed} completed)`,
    '',
    headers.join(',')
  ];

  // Add all requests
  const allRequestsWithType = [
    ...data.requestsByType.websiteUpdates.requests.map(r => ({ ...r, type: 'Website Update' })),
    ...data.requestsByType.flyerReviews.requests.map(r => ({ ...r, type: 'Flyer Review' })),
    ...data.requestsByType.graphicDesign.requests.map(r => ({ ...r, type: 'Graphic Design' }))
  ];

  // Sort by submitted date
  allRequestsWithType.sort((a, b) => new Date(a.submittedDate).getTime() - new Date(b.submittedDate).getTime());

  allRequestsWithType.forEach(req => {
    const row = [
      req.type,
      `"${req.name}"`,
      req.email,
      `"${req.description.replace(/"/g, '""')}"`,
      req.submittedDate.split('T')[0],
      req.completedDate ? req.completedDate.split('T')[0] : '',
      req.status,
      req.urgent ? 'Urgent' : (req.priority || 'Standard'),
      req.completionTime?.displayText || ''
    ];
    rows.push(row.join(','));
  });

  return rows.join('\n');
}