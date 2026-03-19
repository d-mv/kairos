import { differenceInCalendarDays, format, formatDistance } from "date-fns";

export const toDistance = (v: string) => formatDistance(v, new Date(), { addSuffix: true });

export const toFormat = (v: string) => format(v, "EEEE, MMM d");

export function formatDueDate(dueDate: string): {
  label: string;
  relative: string;
  overdue: boolean;
} {
  const date = new Date(dueDate);
  const today = new Date();
  const diff = differenceInCalendarDays(date, today);

  const label = format(date, "MMM do");

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
