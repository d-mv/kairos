import { ProjectDTO, TaskDTO } from "@kairos/shared";
import { type MouseEvent } from "react";
import { renderTaskTitleMarkdown } from "../lib/task-title-markdown.js";
import { AtProject } from "./AtProject";
import { Indent } from "./Indent";
import { Priority } from "./Priority";

type Props = {
  task: TaskDTO;
  project?: ProjectDTO;
  isLast: boolean;
  isActive: boolean;
  appearance?: "desktop" | "mobile";
  isListItem?: boolean;
  handleClick?: (e: MouseEvent<HTMLElement>) => void;
  handleToggleComplete: (e: React.MouseEvent) => void;
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
  if (appearance === "mobile") {
    return (
      <li
        className="group w-full cursor-pointer rounded-[1rem] border border-border/70 bg-background/80"
        onClick={handleClick}
      >
        <div className="flex min-h-[4.8rem] items-center gap-3 px-3 py-2">
          <Priority task={task} handleToggleComplete={handleToggleComplete} />
          <div className="min-w-0 flex-1">
            <span
              className={`block truncate whitespace-nowrap text-base ${
                task.status === "done" ? "text-muted-foreground line-through" : ""
              }`}
            >
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
      className="group w-full flex items-center justify-start h-16 cursor-pointer"
      onClick={handleClick}
    >
      <Indent
        className="w-4"
        isListItem={isListItem}
        isLast={isLast}
        isActive={isActive}
        entityId={task.id}
      />
      <div className="flex items-center gap-4 group-hover:bg-accent transition-colors duration-150 pie-2 justify-between h-full w-full">
        <div className="flex items-center h-full w-full">
          <Priority task={task} handleToggleComplete={handleToggleComplete} />
          <span
            className={`text-base cursor-pointer truncate whitespace-nowrap ${
              task.status === "done" ? "text-muted-foreground line-through" : ""
            }`}
          >
            {renderTaskTitleMarkdown(task.title)}
          </span>
        </div>

        <div className="flex items-center gap-2 w-full justify-end h-full">
          <AtProject project={project} />
        </div>
      </div>
    </li>
  );
}
