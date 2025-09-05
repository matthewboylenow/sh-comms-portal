// app/components/admin/AnnouncementCard.tsx

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import CommentsSection from './CommentsSection';
import { 
  ChatBubbleOvalLeftEllipsisIcon, 
  CalendarIcon, 
  ChevronDownIcon, 
  ChevronUpIcon,
  CheckIcon,
  ArrowTopRightOnSquareIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { formatCreatedTime, getAgeIndicator, getAgeIndicatorColor, formatEventDate, extractTimestamp } from '../../utils/dateUtils';

type AnnouncementRecord = {
  id: string;
  fields: Record<string, any>;
};

type AnnouncementCardProps = {
  record: AnnouncementRecord;
  summarizeMap: Record<string, boolean>;
  calendarMap?: Record<string, boolean>; // New prop for calendar selection
  onToggleSummarize: (recordId: string, isChecked: boolean) => void;
  onToggleCalendar?: (recordId: string, isChecked: boolean) => void; // New handler
  onOverrideStatus: (recordId: string, newStatus: string) => void;
  onToggleCompleted: (tableName: 'announcements', recordId: string, currentValue: boolean) => void;
};

// Note: formatDate moved to dateUtils.ts as formatEventDate

export default function AnnouncementCard({
  record,
  summarizeMap,
  calendarMap = {}, // Default to empty object if not provided
  onToggleSummarize,
  onToggleCalendar,
  onOverrideStatus,
  onToggleCompleted
}: AnnouncementCardProps) {
  const [expanded, setExpanded] = useState(false);
  const f = record.fields;
  const isSummarize = summarizeMap[record.id] || false;
  const isCalendarSelected = calendarMap[record.id] || false;
  
  // Extract timestamp with fallbacks
  const timestamp = extractTimestamp(f, record);
  
  // Age indicators for visual priority
  const ageIndicator = getAgeIndicator(timestamp);
  const ageColor = getAgeIndicatorColor(ageIndicator);
  
  // Determine badge color based on platforms
  const getPlatformBadge = (platform: string) => {
    switch(platform) {
      case 'Email Blast':
        return <Badge variant="primary" className="mr-1">{platform}</Badge>;
      case 'Bulletin':
        return <Badge variant="success" className="mr-1">{platform}</Badge>;
      case 'Church Screens':
        return <Badge variant="warning" className="mr-1">{platform}</Badge>;
      default:
        return <Badge className="mr-1">{platform}</Badge>;
    }
  };

  // Determine badge for override status
  const getOverrideBadge = () => {
    switch(f.overrideStatus) {
      case 'forceInclude':
        return <Badge variant="success">Force Include</Badge>;
      case 'forceExclude':
        return <Badge variant="danger">Force Exclude</Badge>;
      case 'defer':
        return <Badge variant="warning">Defer</Badge>;
      default:
        return null;
    }
  };

  // Check if calendar functions are available
  const hasCalendarFeature = typeof onToggleCalendar === 'function';

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>{f.Name || 'Unnamed Announcement'}</CardTitle>
          <div className="flex items-center justify-between text-sm text-gray-500 mt-1">
            <div className="flex items-center">
              <span className="font-medium mr-2">{f.Ministry || 'No Ministry'}</span>
              {getOverrideBadge()}
            </div>
            <div className={`flex items-center text-xs ${ageColor}`}>
              <ClockIcon className="h-3 w-3 mr-1" />
              <span>Submitted {formatCreatedTime(timestamp)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              id={`summarize-${record.id}`}
              checked={isSummarize}
              onChange={(e) => onToggleSummarize(record.id, e.target.checked)}
              className="h-4 w-4 text-sh-primary rounded border-gray-300 focus:ring-sh-primary"
            />
            <label htmlFor={`summarize-${record.id}`} className="ml-2 text-sm text-gray-600 dark:text-gray-300">
              Summarize
            </label>
          </div>
          
          {/* New Calendar Checkbox */}
          {hasCalendarFeature && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id={`calendar-${record.id}`}
                checked={isCalendarSelected}
                onChange={(e) => onToggleCalendar?.(record.id, e.target.checked)}
                className="h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
              />
              <label htmlFor={`calendar-${record.id}`} className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                Calendar
              </label>
            </div>
          )}
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id={`completed-${record.id}`}
              checked={!!f.Completed}
              onChange={() => onToggleCompleted('announcements', record.id, !!f.Completed)}
              className="h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
            />
            <label htmlFor={`completed-${record.id}`} className="ml-2 text-sm text-gray-600 dark:text-gray-300">
              Completed
            </label>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex flex-wrap gap-2 mb-3">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mr-4">
            <CalendarIcon className="h-4 w-4 mr-1" />
            <span>Event: {formatEventDate(f['Date of Event'] || '')} {f['Time of Event'] || ''}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <ClockIcon className="h-4 w-4 mr-1" />
            <span>Promo Start: {formatEventDate(f['Promotion Start Date'] || '')}</span>
          </div>
        </div>

        <div className="mb-3">
          {(f.Platforms || []).map((platform: string, index: number) => (
            <span key={index}>{getPlatformBadge(platform)}</span>
          ))}
        </div>

        <div className="relative">
          <div 
            className={`prose prose-sm dark:prose-invert max-w-none ${!expanded && 'max-h-24 overflow-hidden'}`}
          >
            {f['Announcement Body'] || 'No announcement text provided.'}
          </div>
          
          {!expanded && f['Announcement Body'] && f['Announcement Body'].length > 150 && (
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white dark:from-gray-800 to-transparent"></div>
          )}
        </div>

        {f['Announcement Body'] && f['Announcement Body'].length > 150 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center text-sm font-medium text-sh-primary dark:text-blue-400 mt-2"
          >
            {expanded ? (
              <>
                <ChevronUpIcon className="h-4 w-4 mr-1" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDownIcon className="h-4 w-4 mr-1" />
                Show More
              </>
            )}
          </button>
        )}
      </CardContent>

      <CardFooter className="flex flex-col items-start space-y-3 bg-gray-50 dark:bg-gray-800">
        <div className="w-full flex items-center justify-between">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Override Status</label>
            <select
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-sh-primary focus:border-sh-primary sm:text-sm rounded-md"
              value={f.overrideStatus || 'none'}
              onChange={(e) => onOverrideStatus(record.id, e.target.value)}
            >
              <option value="none">None</option>
              <option value="forceExclude">Force Exclude</option>
              <option value="forceInclude">Force Include</option>
              <option value="defer">Defer</option>
            </select>
          </div>
        </div>

        {f['File Links'] && (
          <div className="w-full">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Attachments</h4>
            <div className="space-y-2">
              {f['File Links'].split(/\s+/).filter(Boolean).map((link: string, idx: number) => (
                <a
                  key={idx}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-1" />
                  {link.split('/').pop() || `Attachment ${idx + 1}`}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Comments Section */}
        <CommentsSection
          recordId={record.id}
          tableName="announcements"
          requesterEmail={f.Email}
          requesterName={f.Name}
        />
      </CardFooter>
    </Card>
  );
}