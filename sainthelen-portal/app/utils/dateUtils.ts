// app/utils/dateUtils.ts

/**
 * Utility functions for consistent date/time formatting across the admin interface
 *
 * Date format: Thursday, January 22, 2026
 * Time format: 7:00pm or 8:15am
 */

/**
 * Extract timestamp from record fields with multiple fallbacks
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

/**
 * Format a date as "Thursday, January 22, 2026"
 */
export function formatFullDate(dateStr: string | null): string {
  if (!dateStr) return 'Date TBD';

  try {
    let date: Date;

    // Handle YYYY-MM-DD format
    if (dateStr.includes('-') && !dateStr.includes('T')) {
      const [year, month, day] = dateStr.split('-').map(Number);
      date = new Date(year, month - 1, day);
    }
    // Handle MM/DD/YY or MM/DD/YYYY format
    else if (dateStr.includes('/')) {
      const parts = dateStr.split('/').map(Number);
      let [month, day, year] = parts;
      if (year < 100) year += 2000;
      date = new Date(year, month - 1, day);
    }
    // Handle ISO format or other
    else {
      date = new Date(dateStr);
    }

    if (isNaN(date.getTime())) return dateStr;

    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    return dateStr;
  }
}

/**
 * Format a time as "7:00pm" or "8:15am"
 */
export function formatTime(timeStr: string | null): string {
  if (!timeStr) return '';

  try {
    // Already in correct format like "7:00pm"
    if (/^\d{1,2}:\d{2}\s?(am|pm)$/i.test(timeStr.trim())) {
      return timeStr.trim().toLowerCase().replace(' ', '');
    }

    // Handle "7:00 PM" format
    if (/^\d{1,2}:\d{2}\s?(AM|PM)$/i.test(timeStr.trim())) {
      return timeStr.trim().toLowerCase().replace(/\s+/g, '');
    }

    // Handle 24-hour format like "19:00"
    if (/^\d{1,2}:\d{2}$/.test(timeStr.trim())) {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const period = hours >= 12 ? 'pm' : 'am';
      const hour12 = hours % 12 || 12;
      return `${hour12}:${minutes.toString().padStart(2, '0')}${period}`;
    }

    // Handle ISO datetime
    if (timeStr.includes('T')) {
      const date = new Date(timeStr);
      if (!isNaN(date.getTime())) {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const period = hours >= 12 ? 'pm' : 'am';
        const hour12 = hours % 12 || 12;
        return `${hour12}:${minutes.toString().padStart(2, '0')}${period}`;
      }
    }

    return timeStr;
  } catch (e) {
    return timeStr;
  }
}

/**
 * Format date and time together: "Thursday, January 22, 2026 at 7:00pm"
 */
export function formatDateTime(dateStr: string | null, timeStr: string | null): string {
  const formattedDate = formatFullDate(dateStr);
  const formattedTime = formatTime(timeStr);

  if (formattedDate === 'Date TBD') return formattedDate;
  if (!formattedTime) return formattedDate;

  return `${formattedDate} at ${formattedTime}`;
}

/**
 * Format date for short display: "Jan 22" or "Jan 22, 2026" if different year
 */
export function formatShortDate(dateStr: string | null): string {
  if (!dateStr) return 'TBD';

  try {
    let date: Date;

    if (dateStr.includes('-') && !dateStr.includes('T')) {
      const [year, month, day] = dateStr.split('-').map(Number);
      date = new Date(year, month - 1, day);
    } else if (dateStr.includes('/')) {
      const parts = dateStr.split('/').map(Number);
      let [month, day, year] = parts;
      if (year < 100) year += 2000;
      date = new Date(year, month - 1, day);
    } else {
      date = new Date(dateStr);
    }

    if (isNaN(date.getTime())) return dateStr;

    const now = new Date();
    const sameYear = date.getFullYear() === now.getFullYear();

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: sameYear ? undefined : 'numeric'
    });
  } catch (e) {
    return dateStr;
  }
}

/**
 * Format created/submitted time relative to now
 */
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
    case 'new': return 'text-emerald-600 dark:text-emerald-400';
    case 'recent': return 'text-sky-600 dark:text-sky-400';
    case 'aging': return 'text-amber-600 dark:text-amber-400';
    case 'old': return 'text-gray-500 dark:text-gray-400';
    default: return 'text-gray-500 dark:text-gray-400';
  }
}

/**
 * Legacy function - kept for backward compatibility
 */
export function formatEventDate(dateStr: string): string {
  return formatShortDate(dateStr);
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

/**
 * Get the current week's date range for bulletin/email cycle
 * Week starts on Wednesday (email day) and ends on Sunday (bulletin day)
 */
export function getCurrentWeekRange(): { start: Date; end: Date; label: string } {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 3 = Wednesday

  // Find this Wednesday
  let wednesday = new Date(now);

  // If today is Wed-Sun, use this Wednesday as start
  // If today is Mon-Tue, use last Wednesday
  if (day >= 3 || day === 0) {
    // It's Wed-Sat, or Sunday
    if (day === 0) {
      // Sunday - this is the end of the current cycle
      wednesday.setDate(now.getDate() - 4);
    } else {
      // Wed-Sat
      wednesday.setDate(now.getDate() - (day - 3));
    }
  } else {
    // Mon-Tue, use last Wednesday
    wednesday.setDate(now.getDate() - (day + 4));
  }

  wednesday.setHours(0, 0, 0, 0);

  // Sunday is 4 days after Wednesday
  const sunday = new Date(wednesday);
  sunday.setDate(wednesday.getDate() + 4);
  sunday.setHours(23, 59, 59, 999);

  const startLabel = wednesday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endLabel = sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return {
    start: wednesday,
    end: sunday,
    label: `${startLabel} – ${endLabel}`
  };
}

/**
 * Check if a date falls within a given week range
 */
export function isDateInRange(dateStr: string | null, start: Date, end: Date): boolean {
  if (!dateStr) return false;

  try {
    let date: Date;

    if (dateStr.includes('-') && !dateStr.includes('T')) {
      const [year, month, day] = dateStr.split('-').map(Number);
      date = new Date(year, month - 1, day);
    } else if (dateStr.includes('/')) {
      const parts = dateStr.split('/').map(Number);
      let [month, day, year] = parts;
      if (year < 100) year += 2000;
      date = new Date(year, month - 1, day);
    } else {
      date = new Date(dateStr);
    }

    return date >= start && date <= end;
  } catch (e) {
    return false;
  }
}
