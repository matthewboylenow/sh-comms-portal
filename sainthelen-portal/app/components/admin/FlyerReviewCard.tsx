// app/components/admin/FlyerReviewCard.tsx

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { 
  ChevronDownIcon, 
  ChevronUpIcon,
  CheckIcon,
  ArrowTopRightOnSquareIcon,
  DocumentTextIcon,
  CalendarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

type FlyerReviewRecord = {
  id: string;
  fields: Record<string, any>;
};

type FlyerReviewCardProps = {
  record: FlyerReviewRecord;
  onToggleCompleted: (tableName: 'flyerReviews', recordId: string, currentValue: boolean) => void;
};

export default function FlyerReviewCard({
  record,
  onToggleCompleted
}: FlyerReviewCardProps) {
  const [expanded, setExpanded] = useState(false);
  const f = record.fields;
  const isUrgent = f.Urgency === 'urgent';
  
  // Format date if available
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

  return (
    <Card className={`mb-4 ${isUrgent ? 'border-l-4 border-l-red-500' : ''}`}>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <div className="flex items-center">
            <CardTitle className="flex items-center">
              <DocumentTextIcon className="h-5 w-5 mr-2 text-gray-500" />
              {f['Event Name'] || 'Unnamed Flyer'}
            </CardTitle>
            {isUrgent && (
              <Badge variant="danger" className="ml-2">
                <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                Urgent
              </Badge>
            )}
          </div>
          <div className="flex items-center text-sm text-gray-500 mt-1">
            <span className="font-medium mr-2">{f.Ministry || 'No Ministry'}</span>
            <span>• {f['Target Audience'] || 'No Target Audience'}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              id={`completed-${record.id}`}
              checked={!!f.Completed}
              onChange={() => onToggleCompleted('flyerReviews', record.id, !!f.Completed)}
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
          {f['Event Date'] && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mr-4">
              <CalendarIcon className="h-4 w-4 mr-1" />
              <span>Event Date: {formatDate(f['Event Date'])}</span>
            </div>
          )}
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium">Purpose: {f['Purpose'] || 'Not specified'}</span>
          </div>
        </div>

        <div className="relative">
          <div 
            className={`prose prose-sm dark:prose-invert max-w-none ${!expanded && 'max-h-24 overflow-hidden'}`}
          >
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Feedback Needed:</h4>
            <p>{f['Feedback Needed'] || 'No specific feedback requested.'}</p>
            
            {f['Reviewer Notes'] && (
              <>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 mt-4">Reviewer Notes:</h4>
                <p>{f['Reviewer Notes']}</p>
              </>
            )}
          </div>
          
          {!expanded && f['Feedback Needed'] && f['Feedback Needed'].length > 150 && (
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white dark:from-gray-800 to-transparent"></div>
          )}
        </div>

        {f['Feedback Needed'] && f['Feedback Needed'].length > 150 && (
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
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Flyer Files</h4>
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
                  {link.split('/').pop() || `File ${idx + 1}`}
                </a>
              ))}
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}