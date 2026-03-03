import { ProjectDTO, TaskDTO } from "@kairos/shared";
import { makeMatch } from "@mv-d/toolbelt";
import { useAtomValue } from "jotai";
import { Fragment, useMemo } from "react";
import { projectsAtom } from "../atoms/projects.js";
import { selectedTaskIdAtom, upcomingTasksAtom } from "../atoms/tasks.js";
import { workspaceLoadingAtom } from "../atoms/workspace.js";
import { ProjectIndent } from "../components/ProjectIndent.js";
import { TaskDetailPanel } from "../components/TaskDetailPanel.js";
import { toDistance, toFormat } from "../lib/utils.js";

const MATCH_PRIORITY_TO_COLOR = makeMatch(
  {
    "1": "oklch(70.4% 0.191 22.216)",
    "2": "oklch(82.8% 0.189 84.429)",
    "3": "oklch(76.8% 0.233 130.85)",
    // "4": "oklch(71.5% 0.143 215.221)",
  },
  "oklch(72.3% 0.014 214.4)",
);

export default function UpcomingPage() {
  const tasks = useAtomValue(upcomingTasksAtom);
  const projects = useAtomValue(projectsAtom);
  const isLoading = useAtomValue(workspaceLoadingAtom);
  const selectedTaskId = useAtomValue(selectedTaskIdAtom);

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
                      <div className="flex items-center gap-4">
                        <span className="font-light">{toDistance(date)}</span>
                        <span className="text-xs">({toFormat(date)})</span>
                      </div>
                      <div className={"border-gray-300 border-b-[0.1rem]"} />
                    </div>
                    <div className={"border-gray-300 border-l-[0.1rem] h-[.5rem]"} />
                    <ol>
                      {tasks.map((t, i) => (
                        <li
                          key={t.task.id}
                          className="group w-full flex items-center justify-start h-16"
                        >
                          <ProjectIndent
                            className="w-4"
                            isLast={i === tasks.length - 1}
                            isActive={true}
                            projectId={t.project?.id}
                          />
                          <div className="flex items-center gap-4 group-hover:bg-accent transition-colors duration-150 px-2 justify-between h-full w-full">
                            <div className="flex items-center gap-4 h-full w-full">
                              <svg height="1rem" width="1rem" xmlns="http://www.w3.org/2000/svg">
                                <circle
                                  r="0.3rem"
                                  cx="0.5rem"
                                  cy="0.5rem"
                                  stroke={MATCH_PRIORITY_TO_COLOR[t.task.priority]}
                                  strokeWidth="0.1rem"
                                  fill="none"
                                />
                              </svg>
                              <span className="text-base">{t.task.title}</span>
                            </div>

                            <div className="flex items-center gap-2 w-full justify-end h-full">
                              {t.project && (
                                <span className="text-sm font-light text-muted-foreground text-nowrap text-ellipsis overflow-hidden">
                                  @ {t.project.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ol>
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
