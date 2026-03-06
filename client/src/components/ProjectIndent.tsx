import clsx from "clsx";
import { cn } from "../lib/utils";

type Props = {
  projectId: string;
  isLast: boolean;
  isActive: boolean;
  className?: string;
};

export function ProjectIndent({ projectId, isLast, isActive, className }: Props) {
  function renderHorizontalIndent() {
    if (!isActive) return null;

    return (
      <span
        id={`indent-h-${projectId}`}
        className="h-[50%] w-full border-b border-border/50"
      />
    );
  }
  function renderVerticalIndent() {
    return (
      <span
        id={`indent-v-${projectId}`}
        className={clsx("border-l border-border/50", isLast ? "h-[50%]" : "h-full")}
      />
    );
  }

  return (
    <div className={cn("flex items-start h-full w-full", className)}>
      {renderVerticalIndent()}
      {renderHorizontalIndent()}
    </div>
  );
}
