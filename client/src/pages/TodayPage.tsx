import { useAtomValue } from "jotai";
import { selectedTaskIdAtom, todayTasksAtom } from "../atoms/tasks.js";
import { workspaceLoadingAtom } from "../atoms/workspace.js";
import { TaskDetailPanel } from "../components/TaskDetailPanel.js";
import { TaskList } from "../components/TaskList.js";

export default function TodayPage() {
  const tasks = useAtomValue(todayTasksAtom);
  const isLoading = useAtomValue(workspaceLoadingAtom);
  const selectedTaskId = useAtomValue(selectedTaskIdAtom);

  return (
    <div className="flex h-full flex-1">
      <div className={`flex-1 overflow-y-auto ${selectedTaskId ? "lg:mr-[45rem]" : ""}`}>
        <div className="mx-auto max-w-[72rem] px-[2.4rem] py-[4rem] sm:px-[3.2rem] sm:py-[4.8rem]">
          <div className="mb-8">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
              Focus
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Today</h1>
          </div>
          {isLoading ? (
            <div className="panel overflow-hidden rounded-[1.6rem]">
              <div className="skeleton h-[5.6rem] border-b border-border/70" />
              <div className="skeleton h-[5.6rem] border-b border-border/70" />
              <div className="skeleton h-[5.6rem] border-b border-border/70" />
              <div className="skeleton h-[5.6rem]" />
            </div>
          ) : (
            <TaskList
              tasks={tasks}
              emptyMessage="No tasks due today or overdue"
              showNewTaskInput={false}
            />
          )}
        </div>
      </div>
      {selectedTaskId && <TaskDetailPanel />}
    </div>
  );
}
