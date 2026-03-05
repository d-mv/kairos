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
      <div className={`flex-1 overflow-y-auto ${selectedTaskId ? "lg:mr-180" : ""}`}>
        <div className="mx-auto max-w-6xl px-[2.4rem] py-16 sm:px-[3.2rem] sm:py-[4.8rem]">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
                Overview
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Inbox</h1>
            </div>
            <PageTaskMenu
              showCompleted={showCompleted}
              onToggleShowCompleted={onToggleShowCompleted}
            />
          </div>
          {isLoading ? (
            <div className="panel overflow-hidden rounded-[1.6rem]">
              <div className="skeleton h-[5.6rem] border-b border-border/70" />
              <div className="skeleton h-[5.6rem] border-b border-border/70" />
              <div className="skeleton h-[5.6rem] border-b border-border/70" />
              <div className="skeleton h-[5.6rem]" />
            </div>
          ) : (
            <TaskList isList tasks={tasks} emptyMessage="Your inbox is empty" />
          )}
        </div>
      </div>
      {selectedTaskId && <TaskDetailPanel />}
    </div>
  );
}
