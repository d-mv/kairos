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
      <div className={`flex-1 overflow-y-auto ${selectedTaskId ? "lg:mr-[46rem]" : ""}`}>
        <div className="mx-auto max-w-[98rem] px-8 py-10 sm:px-12">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <p className="text-[1rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Planning
              </p>
              <h1 className="mt-2 text-[3.2rem] font-semibold tracking-tight sm:text-[4.2rem]">
                Upcoming
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
            <ul className="mt-6 space-y-5">
              {groupedTasks.map(([date, groupTasks]) => (
                <li key={date} className="rounded-xl bg-card/70 p-3 text-[1.3rem] text-muted-foreground shadow-sm">
                  <div className="mb-2 flex items-center gap-2 px-1">
                    <span className="font-medium text-foreground">{toDistance(date)}</span>
                    <span className="text-[1.1rem]">({toFormat(date)})</span>
                  </div>
                  <TaskList
                    active
                    tasks={groupTasks}
                    showNewTaskInput={false}
                    hideCompleted={!showCompleted}
                  />
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
