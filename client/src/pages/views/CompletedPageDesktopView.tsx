import type { TaskDTO } from "@kairos/shared";
import { TaskDetailPanel } from "../../components/TaskDetailPanel/TaskDetailPanel.js";
import { TaskList } from "../../components/TaskList.js";

type CompletedPageDesktopViewProps = {
  tasks: TaskDTO[];
  isLoading: boolean;
  selectedTaskId: string | null;
};

export function CompletedPageDesktopView({
  tasks,
  isLoading,
  selectedTaskId,
}: CompletedPageDesktopViewProps) {
  return (
    <div className="flex h-full flex-1">
      <div className={`flex-1 overflow-y-auto ${selectedTaskId ? "lg:mr-[46rem]" : ""}`}>
        <div className="mx-auto max-w-[98rem] px-8 py-10 sm:px-12">
          <div className="mb-8">
            <p className="text-[1rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Archive
            </p>
            <h1 className="mt-2 text-[3.2rem] font-semibold tracking-tight sm:text-[4.2rem]">
              Completed
            </h1>
          </div>
          {isLoading ? (
            <div className="panel overflow-hidden rounded-2xl">
              <div className="skeleton h-[5.6rem]" />
              <div className="skeleton h-[5.6rem]" />
              <div className="skeleton h-[5.6rem]" />
              <div className="skeleton h-[5.6rem]" />
            </div>
          ) : (
            <TaskList tasks={tasks} emptyMessage="No completed tasks" showNewTaskInput={false} />
          )}
        </div>
      </div>
      {selectedTaskId && <TaskDetailPanel />}
    </div>
  );
}
