import { TaskDTO } from "@kairos/shared";
import { MouseEvent } from "react";

const MATCH_PRIORITY_TO_COLOR: Record<number, string> = {
  1: "var(--color-red-500)",
  2: "var(--color-orange-500)",
  3: "var(--color-emerald-500)",
  4: "var(--color-muted-foreground)",
};

type Props = {
  task: TaskDTO;
  handleToggleComplete: (e: MouseEvent<HTMLButtonElement>) => void;
};

export function Priority({ task, handleToggleComplete }: Props) {
  const isCompleted = task.status === "done";

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
    <button
      type="button"
      className="cursor-pointer py-4 px-4 hover:bg-gray-200 rounded-md"
      onClick={handleToggleComplete}
    >
      {renderIcon()}
    </button>
  );
}
