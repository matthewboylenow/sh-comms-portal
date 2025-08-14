// app/components/admin/GraphicDesignCard.tsx

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { 
  ChevronDownIcon, 
  ChevronUpIcon,
  ArrowTopRightOnSquareIcon,
  PencilSquareIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { formatCreatedTime, getAgeIndicator, getAgeIndicatorColor, formatEventDate } from '../../utils/dateUtils';

type GraphicDesignRecord = {
  id: string;
  fields: Record<string, any>;
};

type GraphicDesignCardProps = {
  record: GraphicDesignRecord;
  onToggleCompleted: (tableName: 'graphicDesign', recordId: string, currentValue: boolean) => void;
  onUpdateStatus?: (recordId: string, status: string) => void;
};

export default function GraphicDesignCard({
  record,
  onToggleCompleted,
  onUpdateStatus
}: GraphicDesignCardProps) {
  const [expanded, setExpanded] = useState(false);
  const f = record.fields;
  
  // Age indicators for visual priority
  const ageIndicator = getAgeIndicator(f['Submitted At']);
  const ageColor = getAgeIndicatorColor(ageIndicator);
  
  // Extract relevant fields with fallbacks
  const projectType = f['Project Type'] || 'Unnamed Project';
  const description = f['Project Description'] || 'No description provided.';
  const deadline = f['Deadline'] || '';
  const priority = f['Priority'] || 'Medium';
  const status = f['Status'] || 'Pending';
  const sizeDimensions = f['Required Size/Dimensions'] || '';
  const brandColors = f['Brand Colors Required'] || [];
  const isUrgent = priority === 'Urgent';
  const fileLinks = f['File Links'] || '';
  
  // Generate appropriate badge color based on status
  const getStatusBadge = () => {
    switch(status) {
      case 'Pending':
        return <Badge className="ml-2">Pending</Badge>;
      case 'In Design':
        return <Badge variant="primary" className="ml-2">In Design</Badge>;
      case 'Review':
        return <Badge variant="warning" className="ml-2">Review</Badge>;
      case 'Completed':
        return <Badge variant="success" className="ml-2">Completed</Badge>;
      case 'Canceled':
        return <Badge variant="danger" className="ml-2">Canceled</Badge>;
      default:
        return <Badge className="ml-2">{status}</Badge>;
    }
  };

  // Generate priority badge
  const getPriorityBadge = () => {
    switch(priority) {
      case 'Low':
        return <Badge className="mr-2">Low Priority</Badge>;
      case 'Medium':
        return <Badge variant="primary" className="mr-2">Medium Priority</Badge>;
      case 'High':
        return <Badge variant="warning" className="mr-2">High Priority</Badge>;
      case 'Urgent':
        return <Badge variant="danger" className="mr-2">
          <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
          Urgent
        </Badge>;
      default:
        return null;
    }
  };

  // Note: formatDate moved to dateUtils.ts as formatEventDate

  return (
    <Card className={`mb-4 ${isUrgent ? 'border-l-4 border-l-red-500' : ''}`}>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <div className="flex items-center">
            <CardTitle className="flex items-center">
              <PencilSquareIcon className="h-5 w-5 mr-2 text-gray-500" />
              {projectType}
            </CardTitle>
            {getStatusBadge()}
          </div>
          <div className="flex items-center justify-between text-sm text-gray-500 mt-1">
            <div className="flex items-center">
              <span className="font-medium mr-2">{f.Name || 'No Name'}</span>
              <span>• {f.Ministry || ''}</span>
            </div>
            <div className={`flex items-center text-xs ${ageColor}`}>
              <ClockIcon className="h-3 w-3 mr-1" />
              <span>Submitted {formatCreatedTime(f['Submitted At'])}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              id={`completed-${record.id}`}
              checked={!!f.Completed}
              onChange={() => onToggleCompleted('graphicDesign', record.id, !!f.Completed)}
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
          {getPriorityBadge()}
          
          {deadline && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <CalendarIcon className="h-4 w-4 mr-1" />
              <span>Deadline: {formatEventDate(deadline)}</span>
            </div>
          )}
        </div>

        <div className="relative">
          <div 
            className={`prose prose-sm dark:prose-invert max-w-none ${!expanded && 'max-h-24 overflow-hidden'}`}
          >
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Project Description:</h4>
            <p>{description}</p>
            
            {sizeDimensions && (
              <div className="mt-3">
                <strong>Required Dimensions:</strong> {sizeDimensions}
              </div>
            )}
            
            {brandColors && brandColors.length > 0 && (
              <div className="mt-3">
                <strong>Brand Colors:</strong> {brandColors.join(', ')}
              </div>
            )}
          </div>
          
          {!expanded && description && description.length > 150 && (
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white dark:from-gray-800 to-transparent"></div>
          )}
        </div>

        {description && description.length > 150 && (
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
        
        {/* Status selector if onUpdateStatus is provided */}
        {onUpdateStatus && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Update Status
            </label>
            <select
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-sh-primary focus:border-sh-primary sm:text-sm rounded-md"
              value={status}
              onChange={(e) => onUpdateStatus(record.id, e.target.value)}
            >
              <option value="Pending">Pending</option>
              <option value="In Design">In Design</option>
              <option value="Review">Review</option>
              <option value="Completed">Completed</option>
              <option value="Canceled">Canceled</option>
            </select>
          </div>
        )}
      </CardContent>

      {fileLinks && (
        <CardFooter className="bg-gray-50 dark:bg-gray-800">
          <div className="w-full">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Attachments</h4>
            <div className="space-y-2">
              {fileLinks.split(/\s+/).filter(Boolean).map((link: string, idx: number) => (
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
        </CardFooter>
      )}
    </Card>
  );
}