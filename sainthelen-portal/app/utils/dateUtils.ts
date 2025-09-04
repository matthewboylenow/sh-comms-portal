// app/utils/dateUtils.ts

/**
 * Utility functions for consistent date/time formatting across the admin interface
 */

/**
 * Extract timestamp from Airtable record fields with multiple fallbacks
 */
export function extractTimestamp(fields: Record<string, any>, rawRecord?: any): string | null {
  // Try multiple possible field names in order of preference
  const possibleFields = [
    'Submitted At',
    'Created Time', 
    'Created',
    'createdTime',
    'created'
  ];
  
  for (const field of possibleFields) {
    if (fields[field]) {
      return fields[field];
    }
  }
  
  // Try the raw record createdTime as fallback
  if (rawRecord?._rawJson?.createdTime) {
    return rawRecord._rawJson.createdTime;
  }
  
  if (rawRecord?.createdTime) {
    return rawRecord.createdTime;
  }
  
  return null;
}

export function formatCreatedTime(createdTime: string | null): string {
  if (!createdTime) return 'Date Unknown';
  
  try {
    const date = new Date(createdTime);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInHours / 24;
    
    // If less than 1 hour ago
    if (diffInHours < 1) {
      const minutes = Math.floor(diffInMs / (1000 * 60));
      return minutes <= 1 ? 'Just now' : `${minutes}m ago`;
    }
    
    // If less than 24 hours ago
    if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours}h ago`;
    }
    
    // If less than 7 days ago
    if (diffInDays < 7) {
      const days = Math.floor(diffInDays);
      return `${days}d ago`;
    }
    
    // Otherwise show the actual date
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  } catch (e) {
    return 'Invalid date';
  }
}

export function getAgeIndicator(createdTime: string | null): 'new' | 'recent' | 'aging' | 'old' {
  if (!createdTime) return 'old';
  
  try {
    const date = new Date(createdTime);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 2) return 'new';        // Less than 2 hours
    if (diffInHours < 24) return 'recent';    // Less than 1 day  
    if (diffInHours < 72) return 'aging';     // Less than 3 days
    return 'old';                             // 3+ days
  } catch (e) {
    return 'old';
  }
}

export function getAgeIndicatorColor(age: ReturnType<typeof getAgeIndicator>): string {
  switch (age) {
    case 'new': return 'text-green-600 dark:text-green-400';
    case 'recent': return 'text-blue-600 dark:text-blue-400';  
    case 'aging': return 'text-yellow-600 dark:text-yellow-400';
    case 'old': return 'text-red-600 dark:text-red-400';
    default: return 'text-gray-600 dark:text-gray-400';
  }
}

export function formatEventDate(dateStr: string): string {
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
}

export function isUrgentByAge(createdTime: string, thresholdHours: number = 72): boolean {
  if (!createdTime) return false;
  
  try {
    const date = new Date(createdTime);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    return diffInHours > thresholdHours;
  } catch (e) {
    return false;
  }
}