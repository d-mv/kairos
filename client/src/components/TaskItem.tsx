import { ProjectDTO, TaskDTO } from "@kairos/shared";
import { type MouseEvent } from "react";
import { renderTaskTitleMarkdown } from "../lib/task-title-markdown.js";
import { AtProject } from "./AtProject";
import { Indent } from "./Indent";
import { Priority } from "./Priority";

const MATCH_PRIORITY_TO_COLOR: Record<number, string> = {
  1: "var(--color-red-500)",
  2: "var(--color-orange-500)",
  3: "var(--color-emerald-500)",
  4: "var(--color-muted-foreground)",
};

type Props = {
  task: TaskDTO;
  project?: ProjectDTO;
  isLast: boolean;
  isActive: boolean;
  appearance?: "desktop" | "mobile";
  isListItem?: boolean;
  handleClick?: (e: MouseEvent<HTMLElement>) => void;
  handleToggleComplete: () => void;
};

export function TaskItem({
  task,
  project,
  isLast,
  isListItem,
  isActive = true,
  appearance = "desktop",
  handleClick,
  handleToggleComplete,
}: Props) {
  const titleClassName = `block truncate whitespace-nowrap text-[1.55rem] leading-tight underline decoration-2 underline-offset-[0.22em] ${
    task.status === "done"
      ? "text-muted-foreground line-through [&_*]:text-inherit [&_*]:line-through [&_a]:decoration-current [&_a:hover]:text-inherit"
      : ""
  }`;
  const titleStyle = { textDecorationColor: MATCH_PRIORITY_TO_COLOR[task.priority] };

  if (appearance === "mobile") {
    return (
      <li
        className="group w-full cursor-pointer rounded-xl border border-border/70 bg-card/80 shadow-[0_1px_0_rgb(255_255_255_/_0.07)_inset]"
        onClick={handleClick}
      >
        <div className="flex min-h-[5rem] items-center gap-3 px-3 py-2">
          <Priority task={task} handleToggleComplete={handleToggleComplete} />
          <div className="min-w-0 flex-1">
            <span className={titleClassName} style={titleStyle}>
              {renderTaskTitleMarkdown(task.title)}
            </span>
          </div>
          <div className="min-w-0 shrink-0">
            <AtProject project={project} />
          </div>
        </div>
      </li>
    );
  }

  return (
    <li
      className="group flex h-[5.2rem] w-full cursor-pointer items-center justify-start rounded-lg px-1"
      onClick={handleClick}
    >
      <Indent
        className="w-4"
        isListItem={isListItem}
        isLast={isLast}
        isActive={isActive}
        entityId={task.id}
      />
      <div className="flex h-full w-full items-center justify-between gap-4 rounded-lg px-2 transition-colors duration-150 group-hover:bg-accent/60">
        <div className="flex h-full w-full items-center gap-2">
          <Priority task={task} handleToggleComplete={handleToggleComplete} />
          <span className={titleClassName} style={titleStyle}>
            {renderTaskTitleMarkdown(task.title)}
          </span>
        </div>

        <div className="flex h-full w-full items-center justify-end gap-2">
          <AtProject project={project} />
        </div>
      </div>
    </li>
  );
}
