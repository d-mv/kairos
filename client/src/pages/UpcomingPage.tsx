import type { TaskDTO } from "@kairos/shared";
import checkIsMobile from "is-mobile";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useMemo, useState } from "react";
import { pageMenuAtom } from "../atoms/pageMenu.atom.js";
import { tasksAtom } from "../atoms/tasks.js";
import { workspaceLoadingAtom } from "../atoms/workspace.js";
import { usePageTasks } from "../hooks/usePageTasks.js";
import { getUpcomingTasks } from "../lib/task-views.js";
import { UpcomingPageDesktopView } from "./views/UpcomingPageDesktopView.js";
import { UpcomingPageMobileView } from "./views/UpcomingPageMobileView.js";

export default function UpcomingPage() {
  const allTasks = useAtomValue(tasksAtom);
  const isWorkspaceLoading = useAtomValue(workspaceLoadingAtom);
  const setPageMenu = useSetAtom(pageMenuAtom);
  const [showCompleted, setShowCompleted] = useState(false);
  const isMobile = checkIsMobile();
  const isPageLoading = usePageTasks({ kind: "upcoming" });
  const isLoading = isWorkspaceLoading || isPageLoading;

  useEffect(() => {
    setPageMenu([
      {
        label: showCompleted ? "Hide Completed" : "Show Completed",
        onClick: () => setShowCompleted((c) => !c),
      },
    ]);
    return () => setPageMenu([]);
  }, [setPageMenu, showCompleted]);

  const tasks = getUpcomingTasks(allTasks, new Date().toISOString(), showCompleted);

  const groupedTasks = useMemo(
    () =>
      tasks.reduce(
        (acc, task) => {
          const date = task.dueDate ?? "";
          if (!acc[date]) {
            acc[date] = [];
          }
          acc[date].push(task);
          return acc;
        },
        {} as Record<string, TaskDTO[]>,
      ),
    [tasks],
  );

  const viewProps = {
    groupedTasks: Object.entries(groupedTasks),
    isLoading,
    hideCompleted: !showCompleted,
  };

  if (isMobile) {
    return <UpcomingPageMobileView {...viewProps} />;
  }

  return <UpcomingPageDesktopView {...viewProps} />;
}
