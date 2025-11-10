import { formatInTimeZone } from 'date-fns-tz';

const TIME_ZONE = 'Asia/Kolkata';

export const formatIST = (date: Date | string | number, formatString: string): string => {
    return formatInTimeZone(date, TIME_ZONE, formatString);
};

/**
 * Converts a date string or Date object to an IST Date object, preventing timezone shifts in the browser.
 * @param dateString The date to convert.
 * @returns A new Date object correctly representing the date in IST.
 */
export function toIST(dateString: string | Date) {
  const d = new Date(dateString);

  return new Date(
    d.toLocaleString("en-US", {
      timeZone: "Asia/Kolkata"
    })
  );
}

/**
 * Parses a YYYY-MM-DD date string as an IST date.
 * @param dateString The date string to parse.
 * @returns A new Date object.
 */
export function parseISTDate(dateString: string) {
  const [y, m, d] = dateString.split("-");
  return new Date(`${y}-${m}-${d}T00:00:00+05:30`);
}
