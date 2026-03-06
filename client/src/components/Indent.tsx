import clsx from "clsx";
import { cn } from "../lib/utils";

type Props = {
  entityId: string;
  isLast: boolean;
  isActive: boolean;
  className?: string;
  isListItem?: boolean;
};

export function Indent({ entityId, isLast, isActive, className, isListItem }: Props) {
  function renderHorizontalIndent() {
    if (!isActive) return null;

    return (
      <span
        id={`indent-h-${entityId}`}
        className="h-[50%] w-full border-b border-border/50"
      />
    );
  }
  function renderVerticalIndent() {
    if (isListItem) return null;

    return (
      <span
        id={`indent-v-${entityId}`}
        className={clsx("border-l border-border/50", isLast ? "h-[50%]" : "h-full")}
      />
    );
  }

  return (
    <div
      id={`indent-container-${entityId}`}
      className={cn("flex items-start h-full w-full", className)}
    >
      {renderVerticalIndent()}
      {renderHorizontalIndent()}
    </div>
  );
}
