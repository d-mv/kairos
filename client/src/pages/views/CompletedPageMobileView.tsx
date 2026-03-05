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
      <div className="px-4 pb-2 pt-4">
        <p className="text-[0.66rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          Archive
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Completed</h1>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-6">
        {isLoading ? (
          <div className="panel overflow-hidden rounded-[1.2rem]">
            <div className="skeleton h-[4.8rem] border-b border-border/70" />
            <div className="skeleton h-[4.8rem] border-b border-border/70" />
            <div className="skeleton h-[4.8rem] border-b border-border/70" />
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
