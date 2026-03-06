import type { TaskDTO } from "@kairos/shared";
import { PageTaskMenu } from "../../components/PageTaskMenu.js";
import { TaskDetailPanel } from "../../components/TaskDetailPanel/TaskDetailPanel.js";
import { TaskList } from "../../components/TaskList.js";

type InboxPageDesktopViewProps = {
  tasks: TaskDTO[];
  isLoading: boolean;
  selectedTaskId: string | null;
  showCompleted: boolean;
  onToggleShowCompleted: () => void;
};

export function InboxPageDesktopView({
  tasks,
  isLoading,
  selectedTaskId,
  showCompleted,
  onToggleShowCompleted,
}: InboxPageDesktopViewProps) {
  return (
    <div className="flex h-full flex-1">
      <div className={`flex-1 overflow-y-auto ${selectedTaskId ? "lg:mr-[46rem]" : ""}`}>
        <div className="mx-auto max-w-[98rem] px-8 py-10 sm:px-12">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <p className="text-[1rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Overview
              </p>
              <h1 className="mt-2 text-[3.2rem] font-semibold tracking-tight sm:text-[4.2rem]">
                Inbox
              </h1>
            </div>
            <PageTaskMenu
              showCompleted={showCompleted}
              onToggleShowCompleted={onToggleShowCompleted}
            />
          </div>
          {isLoading ? (
            <div className="panel overflow-hidden rounded-2xl">
              <div className="skeleton h-[5.6rem]" />
              <div className="skeleton h-[5.6rem]" />
              <div className="skeleton h-[5.6rem]" />
              <div className="skeleton h-[5.6rem]" />
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
      </div>
      {selectedTaskId && <TaskDetailPanel />}
    </div>
  );
}
