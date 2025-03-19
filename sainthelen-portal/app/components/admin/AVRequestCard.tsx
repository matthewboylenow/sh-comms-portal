// app/components/admin/AVRequestCard.tsx

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { 
  ChevronDownIcon, 
  ChevronUpIcon,
  CheckIcon,
  ArrowTopRightOnSquareIcon,
  VideoCameraIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

type AVRequestRecord = {
  id: string;
  fields: Record<string, any>;
};

type AVRequestCardProps = {
  record: AVRequestRecord;
  onToggleCompleted: (tableName: 'avRequests', recordId: string, currentValue: boolean) => void;
};

export default function AVRequestCard({
  record,
  onToggleCompleted
}: AVRequestCardProps) {
  const [expanded, setExpanded] = useState(false);
  const f = record.fields;
  const needsLivestream = !!f['Needs Livestream'];
  
  return (
    <Card className={`mb-4 ${needsLivestream ? 'border-l-4 border-l-red-500' : ''}`}>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <div className="flex items-center">
            <CardTitle className="flex items-center">
              <VideoCameraIcon className="h-5 w-5 mr-2 text-gray-500" />
              {f['Event Name'] || 'Unnamed Event'}
            </CardTitle>
            {needsLivestream && (
              <Badge variant="danger" className="ml-2">Livestream</Badge>
            )}
          </div>
          <div className="flex items-center text-sm text-gray-500 mt-1">
            <span className="font-medium mr-2">{f.Ministry || 'No Ministry'}</span>
            <span>• {f.Location || 'No Location'}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              id={`completed-${record.id}`}
              checked={!!f.Completed}
              onChange={() => onToggleCompleted('avRequests', record.id, !!f.Completed)}
              className="h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
            />
            <label htmlFor={`completed-${record.id}`} className="ml-2 text-sm text-gray-600 dark:text-gray-300">
              Completed
            </label>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {f['Event Dates and Times'] && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mb-3">
            <CalendarIcon className="h-4 w-4 mr-1" />
            <span className="whitespace-pre-line">{f['Event Dates and Times']}</span>
          </div>
        )}

        <div className="relative">
          <div 
            className={`prose prose-sm dark:prose-invert max-w-none ${!expanded && 'max-h-24 overflow-hidden'}`}
          >
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Event Description:</h4>
            <p>{f['Description'] || 'No description provided.'}</p>
            
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 mt-4">A/V Needs:</h4>
            <p>{f['A/V Needs'] || 'No A/V needs specified.'}</p>
            
            {f['Expected Attendees'] && (
              <div className="mt-3">
                <strong>Expected Attendees:</strong> {f['Expected Attendees']}
              </div>
            )}
            
            {f['Additional Notes'] && (
              <div className="mt-3">
                <strong>Additional Notes:</strong> {f['Additional Notes']}
              </div>
            )}
          </div>
          
          {!expanded && (
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white dark:from-gray-800 to-transparent"></div>
          )}
        </div>

        {(f['Description'] || f['A/V Needs']) && (
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