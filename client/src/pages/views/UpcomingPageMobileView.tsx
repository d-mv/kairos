import type { TaskDTO } from "@kairos/shared";
import { PageTaskMenu } from "../../components/PageTaskMenu.js";
import { TaskDetailPanel } from "../../components/TaskDetailPanel/TaskDetailPanel.js";
import { TaskList } from "../../components/TaskList.js";
import { toDistance, toFormat } from "../../lib/utils.js";

type UpcomingPageMobileViewProps = {
  groupedTasks: [string, TaskDTO[]][];
  isLoading: boolean;
  selectedTaskId: string | null;
  showCompleted: boolean;
  onToggleShowCompleted: () => void;
};

export function UpcomingPageMobileView({
  groupedTasks,
  isLoading,
  selectedTaskId,
  showCompleted,
  onToggleShowCompleted,
}: UpcomingPageMobileViewProps) {
  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-5">
        <div>
          <p className="text-[0.95rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Planning
          </p>
          <h1 className="mt-1 text-[3rem] font-semibold tracking-tight">Upcoming</h1>
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
          <ul className="mt-2 space-y-3">
            {groupedTasks.map(([date, tasks]) => (
              <li key={date} className="rounded-xl bg-card/70 p-2 shadow-sm">
                <div className="px-2 pb-1 pt-1 text-[1.3rem] text-muted-foreground">
                  <span className="font-medium text-foreground">{toDistance(date)}</span>
                  <span className="ml-2 text-[1.1rem]">({toFormat(date)})</span>
                </div>
                <div className="rounded-lg bg-background/70">
                  <TaskList
                    active
                    tasks={tasks}
                    showNewTaskInput={false}
                    appearance="mobile"
                    hideCompleted={!showCompleted}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {selectedTaskId && <TaskDetailPanel />}
    </div>
  );
}
