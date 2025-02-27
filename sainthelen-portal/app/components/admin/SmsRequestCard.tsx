// app/components/admin/SmsRequestCard.tsx

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { 
  CalendarIcon,
  ChatBubbleLeftEllipsisIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';

type SmsRequestRecord = {
  id: string;
  fields: Record<string, any>;
};

type SmsRequestCardProps = {
  record: SmsRequestRecord;
  summarizeMap: Record<string, boolean>;
  onToggleSummarize: (recordId: string, isChecked: boolean) => void;
  onToggleCompleted: (tableName: 'smsRequests', recordId: string, currentValue: boolean) => void;
};

// Helper function to format date
const formatDate = (dateStr: string) => {
  if (!dateStr) return 'N/A';
  
  // If it's already in MM/DD/YY format
  if (dateStr.includes('/')) return dateStr;
  
  // If it's in YYYY-MM-DD format
  try {
    const [year, month, day] = dateStr.split('-');
    return `${month}/${day}/${year.substring(2)}`;
  } catch (e) {
    return dateStr;
  }
};

export default function SmsRequestCard({
  record,
  summarizeMap,
  onToggleSummarize,
  onToggleCompleted
}: SmsRequestCardProps) {
  const f = record.fields;
  const isSummarize = summarizeMap[record.id] || false;
  
  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center">
            <ChatBubbleLeftEllipsisIcon className="h-5 w-5 mr-2 text-gray-500" />
            {f.Name || 'Unnamed Request'}
          </CardTitle>
          <div className="flex items-center text-sm text-gray-500 mt-1">
            <span className="font-medium mr-2">{f.Ministry || 'No Ministry'}</span>
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
          <div className="flex items-center">
            <input
              type="checkbox"
              id={`completed-${record.id}`}
              checked={!!f.Completed}
              onChange={() => onToggleCompleted('smsRequests', record.id, !!f.Completed)}
              className="h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
            />
            <label htmlFor={`completed-${record.id}`} className="ml-2 text-sm text-gray-600 dark:text-gray-300">
              Completed
            </label>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {f['Requested Date'] && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mb-3">
            <CalendarIcon className="h-4 w-4 mr-1" />
            <span>Requested Date: {formatDate(f['Requested Date'])}</span>
          </div>
        )}

        <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md mb-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">SMS Message:</h3>
          <p className="text-sm text-gray-800 dark:text-gray-200">
            {f['SMS Message'] || 'No message provided.'}
          </p>
        </div>

        {f['Additional Info'] && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Additional Information:</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {f['Additional Info']}
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="bg-gray-50 dark:bg-gray-800">
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
      </CardFooter>
    </Card>
  );
}