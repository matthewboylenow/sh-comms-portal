// app/components/admin/WebsiteUpdateCard.tsx

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { 
  ChevronDownIcon, 
  ChevronUpIcon,
  ArrowTopRightOnSquareIcon,
  GlobeAltIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

type WebsiteUpdateRecord = {
  id: string;
  fields: Record<string, any>;
};

type WebsiteUpdateCardProps = {
  record: WebsiteUpdateRecord;
  onToggleCompleted: (tableName: 'websiteUpdates', recordId: string, currentValue: boolean) => void;
};

export default function WebsiteUpdateCard({
  record,
  onToggleCompleted
}: WebsiteUpdateCardProps) {
  const [expanded, setExpanded] = useState(false);
  const f = record.fields;
  const isUrgent = f['Urgent'] === 'Yes';
  
  return (
    <Card className={`mb-4 ${isUrgent ? 'border-l-4 border-l-red-500' : ''}`}>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <div className="flex items-center">
            <CardTitle>{f['Page to Update'] || 'Unnamed Page'}</CardTitle>
            {isUrgent && (
              <Badge variant="danger" className="ml-2">
                <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                Urgent
              </Badge>
            )}
          </div>
          <div className="flex items-center text-sm text-gray-500 mt-1">
            <span className="font-medium">{f.Name || 'No Name'}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              id={`completed-${record.id}`}
              checked={!!f.Completed}
              onChange={() => onToggleCompleted('websiteUpdates', record.id, !!f.Completed)}
              className="h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
            />
            <label htmlFor={`completed-${record.id}`} className="ml-2 text-sm text-gray-600 dark:text-gray-300">
              Completed
            </label>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="relative">
          <div 
            className={`prose prose-sm dark:prose-invert max-w-none ${!expanded && 'max-h-24 overflow-hidden'}`}
          >
            {f['Description'] || 'No description provided.'}
          </div>
          
          {!expanded && f['Description'] && f['Description'].length > 150 && (
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white dark:from-gray-800 to-transparent"></div>
          )}
        </div>

        {f['Description'] && f['Description'].length > 150 && (
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

        {f['Sign-Up URL'] && (
          <div className="mt-4">
            <a
              href={f['Sign-Up URL']}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              <GlobeAltIcon className="h-4 w-4 mr-1" />
              Sign-Up URL
            </a>
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