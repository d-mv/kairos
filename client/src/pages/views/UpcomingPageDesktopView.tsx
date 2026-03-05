import type { TaskDTO } from "@kairos/shared";
import { PageTaskMenu } from "../../components/PageTaskMenu.js";
import { TaskDetailPanel } from "../../components/TaskDetailPanel/TaskDetailPanel.js";
import { TaskList } from "../../components/TaskList.js";
import { toDistance, toFormat } from "../../lib/utils.js";

type UpcomingPageDesktopViewProps = {
  groupedTasks: [string, TaskDTO[]][];
  isLoading: boolean;
  selectedTaskId: string | null;
  showCompleted: boolean;
  onToggleShowCompleted: () => void;
};

export function UpcomingPageDesktopView({
  groupedTasks,
  isLoading,
  selectedTaskId,
  showCompleted,
  onToggleShowCompleted,
}: UpcomingPageDesktopViewProps) {
  return (
    <div className="flex h-full flex-1">
      <div className={`flex-1 overflow-y-auto ${selectedTaskId ? "lg:mr-180" : ""}`}>
        <div className="mx-auto max-w-6xl px-[2.4rem] py-16 sm:px-[3.2rem] sm:py-[4.8rem]">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
                Planning
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Upcoming</h1>
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
            <ul className="mt-8">
              {groupedTasks.map(([date, tasks]) => (
                <li key={date} className="my-4 text-sm text-muted-foreground">
                  <div style={{ width: "fit-content" }}>
                    <div className="flex items-center gap-4 py-2">
                      <span className="font-light">{toDistance(date)}</span>
                      <span className="text-xs">({toFormat(date)})</span>
                    </div>
                    <div className="border-b-[0.1rem] border-gray-300" />
                  </div>
                  <div className="h-[.5rem] border-l-[0.1rem] border-gray-300" />
                  <TaskList active tasks={tasks} showNewTaskInput={false} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {selectedTaskId && <TaskDetailPanel />}
    </div>
  );
}
