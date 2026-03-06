import type { TaskDTO } from "@kairos/shared";
import { PageTaskMenu } from "../../components/PageTaskMenu.js";
import { TaskDetailPanel } from "../../components/TaskDetailPanel/TaskDetailPanel.js";
import { TaskList } from "../../components/TaskList.js";

type InboxPageMobileViewProps = {
  tasks: TaskDTO[];
  isLoading: boolean;
  selectedTaskId: string | null;
  showCompleted: boolean;
  onToggleShowCompleted: () => void;
};

export function InboxPageMobileView({
  tasks,
  isLoading,
  selectedTaskId,
  showCompleted,
  onToggleShowCompleted,
}: InboxPageMobileViewProps) {
  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-5">
        <div>
          <p className="text-[0.95rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Overview
          </p>
          <h1 className="mt-1 text-[3rem] font-semibold tracking-tight">Inbox</h1>
        </div>
        <PageTaskMenu showCompleted={showCompleted} onToggleShowCompleted={onToggleShowCompleted} />
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
            isList
            tasks={tasks}
            emptyMessage="Your inbox is empty"
            hideCompleted={!showCompleted}
          />
        )}
      </div>
      {selectedTaskId && <TaskDetailPanel />}
    </div>
  );
}
