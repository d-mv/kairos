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
      size="icon"
      disabled={disabled}
      aria-label="Delete project"
      className={cn(
        "h-12 w-12 rounded-2xl text-xs font-light hover:underline underline-offset-[0.3rem] decoration-[0.1rem] cursor-pointer",
        className,
      )}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
