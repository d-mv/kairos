import { PropsWithChildren } from "react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";

type Props = {
  disabled: boolean;
  onClick: () => void;
  className?: string;
  id: string;
};

export function InlineButton({
  id,
  disabled,
  onClick,
  className,
  children,
}: PropsWithChildren<Props>) {
  return (
    <Button
      id={id}
      type="button"
      variant="ghost"
      size="sm"
      disabled={disabled}
      aria-label="Delete project"
      className={cn(
        "h-7 rounded-md px-2 text-[1.1rem] font-medium hover:bg-accent/80 hover:no-underline",
        className,
      )}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
