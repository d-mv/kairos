import { ProjectDTO, TaskDTO } from "@kairos/shared";
import { useAtomValue, useSetAtom } from "jotai";
import { Fragment, useMemo } from "react";
import { projectsAtom } from "../atoms/projects.js";
import { selectedTaskIdAtom, upcomingTasksAtom } from "../atoms/tasks.js";
import { workspaceLoadingAtom } from "../atoms/workspace.js";
import { TaskDetailPanel } from "../components/TaskDetailPanel.js";
import { TaskList } from "../components/TaskList.js";
import { toDistance, toFormat } from "../lib/utils.js";

export default function UpcomingPage() {
  const tasks = useAtomValue(upcomingTasksAtom);
  const projects = useAtomValue(projectsAtom);
  const isLoading = useAtomValue(workspaceLoadingAtom);
  const selectedTaskId = useAtomValue(selectedTaskIdAtom);
  const setSelectedTaskId = useSetAtom(selectedTaskIdAtom);

  const groupedTasks = useMemo(
    () =>
      tasks.reduce(
        (acc, task) => {
          const date = task.dueDate ?? "";
          if (!acc[date]) {
            acc[date] = [];
          }
          acc[date].push({ task, project: projects.find((p) => p.id === task.projectId)! });
          return acc;
        },
        {} as Record<string, { task: TaskDTO; project: ProjectDTO }[]>,
      ),
    [tasks],
  );

  return (
    <div className="flex h-full flex-1">
      <div className={`flex-1 overflow-y-auto ${selectedTaskId ? "lg:mr-180" : ""}`}>
        <div className="mx-auto max-w-6xl px-[2.4rem] py-16 sm:px-[3.2rem] sm:py-[4.8rem]">
          <div className="mb-8">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
              Planning
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Upcoming</h1>
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
              {Object.entries(groupedTasks).map(([date, tasks]) => (
                <Fragment key={date}>
                  <li className="text-muted-foreground text-sm my-4">
                    <div style={{ width: "fit-content" }}>
                      <div className="flex items-center gap-4 py-2">
                        <span className="font-light">{toDistance(date)}</span>
                        <span className="text-xs">({toFormat(date)})</span>
                      </div>
                      <div className={"border-gray-300 border-b-[0.1rem]"} />
                    </div>
                    <div className={"border-gray-300 border-l-[0.1rem] h-[.5rem]"} />
                    <TaskList active tasks={tasks.map((t) => t.task)} />
                  </li>
                </Fragment>
              ))}
            </ul>
          )}
        </div>
      </div>
      {selectedTaskId && <TaskDetailPanel />}
    </div>
  );
}
