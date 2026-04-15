import { differenceInCalendarDays, format, formatDistance } from "date-fns";

export const toDistance = (v: string) => formatDistance(v, new Date(), { addSuffix: true });

export const toFormat = (v: string) => format(v, "EEEE, MMM d");

/**
 * Formats an ISO date string to YYYY-MM-DD for date input.
 */
export function toInputDate(isoString: string | null): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "";
  return format(date, "yyyy-MM-dd");
}

/**
 * Formats an ISO date string to HH:mm for time input.
 */
export function toInputTime(isoString: string | null): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "";

  // If it's just a date (00:00:00.000), return empty time
  const isDateOnly = isoString.length <= 10 || isoString.includes("T00:00:00");
  if (isDateOnly) return "";

  return format(date, "HH:mm");
}

/**
 * Combines date and time values from separate inputs into an ISO string.
 */
export function fromSplitDateTime(dateValue: string, timeValue: string): string | null {
  if (!dateValue) return null;
  const combined = timeValue ? `${dateValue}T${timeValue}` : dateValue;
  const date = new Date(combined);
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
