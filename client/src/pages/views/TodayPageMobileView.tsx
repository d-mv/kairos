import type { TaskDTO } from "@kairos/shared";
import { PageTaskMenu } from "../../components/PageTaskMenu.js";
import { TaskDetailPanel } from "../../components/TaskDetailPanel/TaskDetailPanel.js";
import { TaskList } from "../../components/TaskList.js";

type TodayPageMobileViewProps = {
  tasks: TaskDTO[];
  isLoading: boolean;
  selectedTaskId: string | null;
  showCompleted: boolean;
  onToggleShowCompleted: () => void;
};

export function TodayPageMobileView({
  tasks,
  isLoading,
  selectedTaskId,
  showCompleted,
  onToggleShowCompleted,
}: TodayPageMobileViewProps) {
  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <div className="flex items-start justify-between gap-3 px-4 pb-2 pt-4">
        <div>
          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Focus
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Today</h1>
        </div>
        <PageTaskMenu showCompleted={showCompleted} onToggleShowCompleted={onToggleShowCompleted} />
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
            emptyMessage="No tasks due today or overdue"
            showNewTaskInput={false}
            appearance="mobile"
          />
        )}
      </div>
      {selectedTaskId && <TaskDetailPanel />}
    </div>
  );
}
