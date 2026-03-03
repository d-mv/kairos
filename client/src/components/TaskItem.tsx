import { ProjectDTO, TaskDTO } from "@kairos/shared";
import { type MouseEvent, useMemo } from "react";
import { AtProject } from "./AtProject";
import { Indent } from "./Indent";

const MATCH_PRIORITY_TO_COLOR: Record<number, string> = {
  1: "var(--color-muted-foreground)",
  2: "var(--color-emerald-500)",
  3: "var(--color-orange-500)",
  4: "var(--color-red-500)",
};

type Props = {
  task: TaskDTO;
  project?: ProjectDTO;
  isLast: boolean;
  isActive: boolean;
  isListItem?: boolean;
  isJoined?: boolean;
  handleClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  handleToggleComplete: (e: React.MouseEvent) => void;
};

export function TaskItem({
  task,
  project,
  isLast,
  isListItem,
  isActive = true,
  handleClick,
  handleToggleComplete,
}: Props) {
  const isCompleted = useMemo(() => task.status === "done", [task.status]);

  function renderIcon() {
    const status = (
      <svg height="1rem" width="1rem" xmlns="http://www.w3.org/2000/svg">
        <circle
          r="0.3rem"
          cx="0.5rem"
          cy="0.5rem"
          stroke={MATCH_PRIORITY_TO_COLOR[task.priority]}
          strokeWidth="0.1rem"
          fill="none"
        />
      </svg>
    );

    if (!isCompleted) return status;

    return (
      <div className="grid place-items-center relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="var(--color-gray-400)"
          className="size-8 absolute"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
        {status}
      </div>
    );
  }

  return (
    <li className="group w-full flex items-center justify-start h-16 cursor-pointer">
      <Indent
        className="w-4"
        isListItem={isListItem}
        isLast={isLast}
        isActive={isActive}
        entityId={task.id}
      />
      <div className="flex items-center gap-4 group-hover:bg-accent transition-colors duration-150 pie-2 justify-between h-full w-full">
        <div className="flex items-center h-full w-full">
          <button
            type="button"
            className="cursor-pointer py-4 px-4 hover:bg-gray-200 rounded-md"
            onClick={handleToggleComplete}
          >
            {renderIcon()}
          </button>
          <button type="button" onClick={handleClick} className="text-base cursor-pointer">
            {task.title}
          </button>
        </div>

        <div className="flex items-center gap-2 w-full justify-end h-full">
          <AtProject project={project} />
        </div>
      </div>
    </li>
  );
}
