import { type ClassValue, clsx } from "clsx";
import { format, formatDistance } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const toDistance = (v: string) => formatDistance(v, new Date(), { addSuffix: true });

export const toFormat = (v: string) => format(v, "EEEE, MMM d");
