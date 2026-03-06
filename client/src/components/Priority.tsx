import { TaskDTO } from "@kairos/shared";

type Props = {
  task: TaskDTO;
  handleToggleComplete: () => void;
};

export function Priority({ task, handleToggleComplete }: Props) {
  return (
    <input
      type="checkbox"
      checked={task.status === "done"}
      readOnly
      aria-label={task.status === "done" ? "Mark as not done" : "Mark as done"}
      className="h-[1.6rem] w-[1.6rem] cursor-pointer rounded border border-border bg-background accent-primary"
      onClick={(e) => {
        e.stopPropagation();
      }}
      onChange={() => {
        handleToggleComplete();
      }}
    />
  );
}
