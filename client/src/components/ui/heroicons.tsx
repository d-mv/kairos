import { forwardRef, type SVGProps } from "react";

type HeroIconProps = SVGProps<SVGSVGElement> & {
  title?: string;
  titleId?: string;
};

// Copied from Heroicons v2.2.0 (MIT).
export const InboxIcon = forwardRef<SVGSVGElement, HeroIconProps>(
  ({ title, titleId, ...props }, ref) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      data-slot="icon"
      ref={ref}
      aria-labelledby={titleId}
      {...props}
    >
      {title ? <title id={titleId}>{title}</title> : null}
      <path
        fillRule="evenodd"
        d="M1 3.5A1.5 1.5 0 0 1 2.5 2h15A1.5 1.5 0 0 1 19 3.5v.528a1.5 1.5 0 0 1-.464 1.082l-5.72 5.498a2.5 2.5 0 0 1-3.632 0l-5.72-5.498A1.5 1.5 0 0 1 3 4.028V3.5Zm0 3.293 5.027 4.83a4 4 0 0 0 5.946 0L17 6.793V15.5A2.5 2.5 0 0 1 14.5 18h-9A2.5 2.5 0 0 1 3 15.5V6.793Z"
        clipRule="evenodd"
      />
    </svg>
  ),
);
InboxIcon.displayName = "InboxIcon";

// Copied from Heroicons v2.2.0 (MIT).
export const CalendarDaysIcon = forwardRef<SVGSVGElement, HeroIconProps>(
  ({ title, titleId, ...props }, ref) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      data-slot="icon"
      ref={ref}
      aria-labelledby={titleId}
      {...props}
    >
      {title ? <title id={titleId}>{title}</title> : null}
      <path
        fillRule="evenodd"
        d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.75A2.25 2.25 0 0 1 18 6.25v9.5A2.25 2.25 0 0 1 15.75 18h-11.5A2.25 2.25 0 0 1 2 15.75v-9.5A2.25 2.25 0 0 1 4.25 4H5V2.75A.75.75 0 0 1 5.75 2Zm10.75 6H3.5v7.75c0 .414.336.75.75.75h11.5a.75.75 0 0 0 .75-.75V8Z"
        clipRule="evenodd"
      />
    </svg>
  ),
);
CalendarDaysIcon.displayName = "CalendarDaysIcon";

// Copied from Heroicons v2.2.0 (MIT).
export const ClockIcon = forwardRef<SVGSVGElement, HeroIconProps>(
  ({ title, titleId, ...props }, ref) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      data-slot="icon"
      ref={ref}
      aria-labelledby={titleId}
      {...props}
    >
      {title ? <title id={titleId}>{title}</title> : null}
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11a.75.75 0 0 0-1.5 0v3.5c0 .2.08.39.22.53l2.25 2.25a.75.75 0 1 0 1.06-1.06l-2.03-2.03V7Z"
        clipRule="evenodd"
      />
    </svg>
  ),
);
ClockIcon.displayName = "ClockIcon";

// Copied from Heroicons v2.2.0 (MIT).
export const CheckCircleIcon = forwardRef<SVGSVGElement, HeroIconProps>(
  ({ title, titleId, ...props }, ref) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      data-slot="icon"
      ref={ref}
      aria-labelledby={titleId}
      {...props}
    >
      {title ? <title id={titleId}>{title}</title> : null}
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.78-9.97a.75.75 0 0 0-1.06-1.06L9.25 10.44 7.78 8.97a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0l4-4Z"
        clipRule="evenodd"
      />
    </svg>
  ),
);
CheckCircleIcon.displayName = "CheckCircleIcon";

// Copied from Heroicons v2.2.0 (MIT).
export const CheckIcon = forwardRef<SVGSVGElement, HeroIconProps>(
  ({ title, titleId, ...props }, ref) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      data-slot="icon"
      ref={ref}
      aria-labelledby={titleId}
      {...props}
    >
      {title ? <title id={titleId}>{title}</title> : null}
      <path
        fillRule="evenodd"
        d="M16.704 5.29a.75.75 0 0 1 .006 1.06l-8 8.091a.75.75 0 0 1-1.074 0l-4-4.046a.75.75 0 0 1 1.068-1.054l3.466 3.505 7.467-7.55a.75.75 0 0 1 1.06-.006Z"
        clipRule="evenodd"
      />
    </svg>
  ),
);
CheckIcon.displayName = "CheckIcon";

// Copied from Heroicons v2.2.0 (MIT).
export const EllipsisVerticalIcon = forwardRef<SVGSVGElement, HeroIconProps>(
  ({ title, titleId, ...props }, ref) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      data-slot="icon"
      ref={ref}
      aria-labelledby={titleId}
      {...props}
    >
      {title ? <title id={titleId}>{title}</title> : null}
      <path d="M10 3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM10 8.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM11.5 15.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Z" />
    </svg>
  ),
);
EllipsisVerticalIcon.displayName = "EllipsisVerticalIcon";

// Copied from Heroicons v2.2.0 (MIT).
export const KeyIcon = forwardRef<SVGSVGElement, HeroIconProps>(
  ({ title, titleId, ...props }, ref) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      data-slot="icon"
      ref={ref}
      aria-labelledby={titleId}
      {...props}
    >
      {title ? <title id={titleId}>{title}</title> : null}
      <path
        fillRule="evenodd"
        d="M8 7a5 5 0 1 1 3.61 4.804l-1.903 1.903A1 1 0 0 1 9 14H8v1a1 1 0 0 1-1 1H6v1a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-2a1 1 0 0 1 .293-.707L8.196 8.39A5.002 5.002 0 0 1 8 7Zm5-3a.75.75 0 0 0 0 1.5A1.5 1.5 0 0 1 14.5 7 .75.75 0 0 0 16 7a3 3 0 0 0-3-3Z"
        clipRule="evenodd"
      />
    </svg>
  ),
);
KeyIcon.displayName = "KeyIcon";

// Copied from Heroicons v2.2.0 (MIT).
export const SunIcon = forwardRef<SVGSVGElement, HeroIconProps>(
  ({ title, titleId, ...props }, ref) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      data-slot="icon"
      ref={ref}
      aria-labelledby={titleId}
      {...props}
    >
      {title ? <title id={titleId}>{title}</title> : null}
      <path d="M10 2a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 2ZM10 15a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 15ZM10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM15.657 5.404a.75.75 0 1 0-1.06-1.06l-1.061 1.06a.75.75 0 0 0 1.06 1.06l1.06-1.06ZM6.464 14.596a.75.75 0 1 0-1.06-1.06l-1.06 1.06a.75.75 0 0 0 1.06 1.06l1.06-1.06ZM18 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 18 10ZM5 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 5 10ZM14.596 15.657a.75.75 0 0 0 1.06-1.06l-1.06-1.061a.75.75 0 1 0-1.06 1.06l1.06 1.06ZM5.404 6.464a.75.75 0 0 0 1.06-1.06l-1.06-1.06a.75.75 0 1 0-1.061 1.06l1.06 1.06Z" />
    </svg>
  ),
);
SunIcon.displayName = "SunIcon";

// Copied from Heroicons v2.2.0 (MIT).
export const MoonIcon = forwardRef<SVGSVGElement, HeroIconProps>(
  ({ title, titleId, ...props }, ref) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      data-slot="icon"
      ref={ref}
      aria-labelledby={titleId}
      {...props}
    >
      {title ? <title id={titleId}>{title}</title> : null}
      <path
        fillRule="evenodd"
        d="M7.455 2.004a.75.75 0 0 1 .26.77 7 7 0 0 0 9.958 7.967.75.75 0 0 1 1.067.853A8.5 8.5 0 1 1 6.647 1.921a.75.75 0 0 1 .808.083Z"
        clipRule="evenodd"
      />
    </svg>
  ),
);
MoonIcon.displayName = "MoonIcon";

export const BellIcon = forwardRef<SVGSVGElement, HeroIconProps>(
  ({ title, titleId, ...props }, ref) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      data-slot="icon"
      ref={ref}
      aria-labelledby={titleId}
      {...props}
    >
      {title ? <title id={titleId}>{title}</title> : null}
      <path
        fillRule="evenodd"
        d="M10 2a5 5 0 0 0-5 5v2.586l-.707.707A1 1 0 0 0 5 12h10a1 1 0 0 0 .707-1.707L15 9.586V7a5 5 0 0 0-5-5ZM8.5 15a1.5 1.5 0 1 0 3 0h-3Z"
        clipRule="evenodd"
      />
    </svg>
  ),
);
BellIcon.displayName = "BellIcon";

export const UserGroupIcon = forwardRef<SVGSVGElement, HeroIconProps>(
  ({ title, titleId, ...props }, ref) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      data-slot="icon"
      ref={ref}
      aria-labelledby={titleId}
      {...props}
    >
      {title ? <title id={titleId}>{title}</title> : null}
      <path d="M4 7a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM14 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
      <path d="M1.5 15.5A3.5 3.5 0 0 1 5 12h4a3.5 3.5 0 0 1 3.5 3.5.5.5 0 0 1-.5.5H2a.5.5 0 0 1-.5-.5ZM12 15.5a4.98 4.98 0 0 0-1.02-3H14a3 3 0 0 1 3 3 .5.5 0 0 1-.5.5H12v-.5Z" />
    </svg>
  ),
);
UserGroupIcon.displayName = "UserGroupIcon";
