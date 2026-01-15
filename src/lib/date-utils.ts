import { format } from "date-fns";

/**
 * Formats a Date object or ISO string to HH:mm, ignoring timezone (using UTC values).
 * This is useful when the DB stores "08:00" as "1970-01-01T08:00:00.000Z" and we want to prevent
 * the client/server local timezone from shifting it to 09:00 (CET).
 */
export function formatTimeUTC(dateOrString: Date | string): string {
    const d = typeof dateOrString === 'string' ? new Date(dateOrString) : dateOrString;
    // Extract UTC hours and minutes directly
    const hours = d.getUTCHours().toString().padStart(2, '0');
    const minutes = d.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * Parses a Date or string and returns a formatted date string (DD.MM.YYYY)
 * Uses local time for Date, because dates usually cover 24h and are less sensitive to 1h shifts 
 * unless it's close to midnight. Ideally, we should treat dates as UTC too if they are "Face Value".
 */
export function formatDateGerman(dateOrString: Date | string): string {
    return format(new Date(dateOrString), "dd.MM.yyyy"); // Keep existing behavior for Date for now
}
