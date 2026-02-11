// app/lib/church-calendar.ts

/**
 * Church Calendar Helpers
 * Utilities for working with liturgical calendar and parish schedule
 */

import { format, addDays, startOfWeek, endOfWeek, isSameDay, isWithinInterval } from 'date-fns';

// Liturgical seasons
export type LiturgicalSeason =
  | 'advent'
  | 'christmas'
  | 'ordinary_time_1'
  | 'lent'
  | 'triduum'
  | 'easter'
  | 'ordinary_time_2';

// Liturgical colors
export const seasonColors: Record<LiturgicalSeason, string> = {
  advent: 'purple',
  christmas: 'white',
  ordinary_time_1: 'green',
  lent: 'purple',
  triduum: 'red',
  easter: 'white',
  ordinary_time_2: 'green',
};

// Major feast days (fixed dates)
export const fixedFeasts: Record<string, string> = {
  '01-01': 'Solemnity of Mary, Mother of God',
  '01-06': 'Epiphany of the Lord',
  '02-02': 'Presentation of the Lord',
  '03-19': "Solemnity of St. Joseph",
  '03-25': 'Annunciation of the Lord',
  '06-24': "Nativity of St. John the Baptist",
  '06-29': 'Solemnity of Sts. Peter and Paul',
  '08-06': 'Transfiguration of the Lord',
  '08-15': 'Assumption of the Blessed Virgin Mary',
  '09-08': "Nativity of the Blessed Virgin Mary",
  '09-14': 'Exaltation of the Holy Cross',
  '10-07': 'Our Lady of the Rosary',
  '11-01': 'All Saints Day',
  '11-02': 'All Souls Day',
  '12-08': 'Immaculate Conception',
  '12-25': 'Christmas Day',
  '12-26': 'St. Stephen',
  '12-27': 'St. John the Apostle',
  '12-28': 'Holy Innocents',
};

/**
 * Get the fixed feast for a given date
 */
export function getFixedFeast(date: Date): string | null {
  const monthDay = format(date, 'MM-dd');
  return fixedFeasts[monthDay] || null;
}

/**
 * Check if a date is a major feast day
 */
export function isMajorFeast(date: Date): boolean {
  return getFixedFeast(date) !== null;
}

/**
 * Get upcoming feasts within a date range
 */
export function getUpcomingFeasts(startDate: Date, days: number): Array<{ date: Date; name: string }> {
  const feasts: Array<{ date: Date; name: string }> = [];

  for (let i = 0; i < days; i++) {
    const checkDate = addDays(startDate, i);
    const feast = getFixedFeast(checkDate);
    if (feast) {
      feasts.push({ date: checkDate, name: feast });
    }
  }

  return feasts;
}

/**
 * Saint Helen Parish Schedule Constants
 */
export const parishSchedule = {
  // Mass times
  masses: {
    saturday: { time: '05:00 PM', label: 'Vigil Mass' },
    sunday: [
      { time: '07:30 AM', label: 'Early Mass' },
      { time: '09:30 AM', label: 'Family Mass' },
      { time: '11:30 AM', label: 'Late Mass' },
    ],
    weekday: { time: '08:30 AM', label: 'Daily Mass' },
  },

  // Weekly deadlines
  deadlines: {
    emailBlast: { day: 3, time: '11:30', label: 'Wednesday Email Blast' },
    bulletin: { day: 6, time: '09:00', label: 'Saturday Bulletin Print' },
  },

  // Social media posting times
  socialMediaTimes: {
    morning: { time: '09:00', label: 'Morning Post' },
    afternoon: { time: '14:00', label: 'Afternoon Post' },
  },
};

/**
 * Check if today is a deadline day
 */
export function isDeadlineDay(date: Date = new Date()): boolean {
  const dayOfWeek = date.getDay();
  return (
    dayOfWeek === parishSchedule.deadlines.emailBlast.day ||
    dayOfWeek === parishSchedule.deadlines.bulletin.day
  );
}

/**
 * Get deadline info for today if applicable
 */
export function getTodayDeadline(date: Date = new Date()): { time: string; label: string } | null {
  const dayOfWeek = date.getDay();

  if (dayOfWeek === parishSchedule.deadlines.emailBlast.day) {
    return {
      time: parishSchedule.deadlines.emailBlast.time,
      label: parishSchedule.deadlines.emailBlast.label,
    };
  }

  if (dayOfWeek === parishSchedule.deadlines.bulletin.day) {
    return {
      time: parishSchedule.deadlines.bulletin.time,
      label: parishSchedule.deadlines.bulletin.label,
    };
  }

  return null;
}

/**
 * Get the next Sunday's date
 */
export function getNextSunday(fromDate: Date = new Date()): Date {
  const dayOfWeek = fromDate.getDay();
  const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek;
  return addDays(fromDate, daysUntilSunday);
}

/**
 * Get the liturgical week number
 * Note: This is a simplified version. A full implementation would need
 * to account for moveable feasts like Easter.
 */
export function getOrdinaryTimeWeek(date: Date): number {
  // Simplified calculation - would need Easter date for accurate results
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const weeksSinceStart = Math.floor(
    (date.getTime() - startOfYear.getTime()) / (7 * 24 * 60 * 60 * 1000)
  );
  return (weeksSinceStart % 34) + 1;
}

/**
 * Format a time string for display
 */
export function formatMassTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}
