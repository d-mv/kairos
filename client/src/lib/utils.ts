import { differenceInCalendarDays, format, formatDistance } from "date-fns";

export const toDistance = (v: string) => formatDistance(v, new Date(), { addSuffix: true });

export const toFormat = (v: string) => format(v, "EEEE, MMM d");

/**
 * Formats an ISO date string to YYYY-MM-DDTHH:mm for datetime-local input.
 * If only a date is provided, it returns YYYY-MM-DD.
 */
export function toInputDateTime(isoString: string | null): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "";

  // Check if it's just a date (00:00:00.000)
  const isDateOnly = isoString.length <= 10 || isoString.includes("T00:00:00");
  if (isDateOnly) {
    return format(date, "yyyy-MM-dd");
  }

  return format(date, "yyyy-MM-dd'T'HH:mm");
}

/**
 * Parses a value from datetime-local input into an ISO string.
 */
export function fromInputDateTime(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function formatDueDate(dueDate: string): {
  label: string;
  relative: string;
  overdue: boolean;
} {
  const date = new Date(dueDate);
  const today = new Date();
  const diff = differenceInCalendarDays(date, today);

  // If it has time, include it in the label
  const hasTime = !dueDate.endsWith("T00:00:00.000Z") && dueDate.includes("T");
  const label = hasTime ? format(date, "MMM do, HH:mm") : format(date, "MMM do");

  let relative: string;
  if (diff === 0) relative = "";
  else if (diff === 1) relative = "tomorrow";
  else if (diff === -1) relative = "yesterday";
  else if (diff > 0 && diff < 7) relative = `in ${diff}d`;
  else if (diff >= 7 && diff < 30) relative = `in ${Math.round(diff / 7)}w`;
  else if (diff >= 30) relative = `in ${Math.round(diff / 30)}mo`;
  else if (diff > -7) relative = `${-diff}d ago`;
  else if (diff > -30) relative = `${Math.round(-diff / 7)}w ago`;
  else relative = `${Math.round(-diff / 30)}mo ago`;

  return { label, relative, overdue: diff < 0 };
}
