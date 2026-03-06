import type { TaskDTO } from "@kairos/shared";
import { TaskDetailPanel } from "../../components/TaskDetailPanel/TaskDetailPanel.js";
import { TaskList } from "../../components/TaskList.js";

type CompletedPageMobileViewProps = {
  tasks: TaskDTO[];
  isLoading: boolean;
  selectedTaskId: string | null;
};

export function CompletedPageMobileView({
  tasks,
  isLoading,
  selectedTaskId,
}: CompletedPageMobileViewProps) {
  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <div className="px-4 pb-3 pt-5">
        <p className="text-[0.95rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Archive
        </p>
        <h1 className="mt-1 text-[3rem] font-semibold tracking-tight">Completed</h1>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-6">
        {isLoading ? (
          <div className="panel overflow-hidden rounded-2xl">
            <div className="skeleton h-[4.8rem]" />
            <div className="skeleton h-[4.8rem]" />
            <div className="skeleton h-[4.8rem]" />
            <div className="skeleton h-[4.8rem]" />
          </div>
        ) : (
          <TaskList
            tasks={tasks}
            emptyMessage="No completed tasks"
            showNewTaskInput={false}
            appearance="mobile"
          />
        )}
      </div>
      {selectedTaskId && <TaskDetailPanel />}
    </div>
  );
}
