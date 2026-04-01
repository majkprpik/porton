/**
 * Checks if the given date is today.
 * @param date - Date string or Date object to check
 * @returns true if the date is today, false otherwise
 */
export function isToday(date: string | Date): boolean {
  const checkDate = new Date(date);
  const today = new Date();

  return checkDate.getFullYear() === today.getFullYear() &&
         checkDate.getMonth() === today.getMonth() &&
         checkDate.getDate() === today.getDate();
}

/**
 * Checks if two date strings represent the same day (by comparing day part only).
 * @param date1 - First date string in ISO format
 * @param date2 - Second date string in ISO format
 * @returns true if both dates are on the same day, false otherwise
 */
export function areDaysEqual(date1: string | undefined, date2: string | undefined): boolean {
  if (!date1 || !date2) return false;
  return date1.slice(0, 10).split('-')[2] === date2.slice(0, 10).split('-')[2];
}
