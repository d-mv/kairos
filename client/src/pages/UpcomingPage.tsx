import type { TaskDTO } from "@kairos/shared";
import checkIsMobile from "is-mobile";
import { useAtomValue } from "jotai";
import { useMemo, useState } from "react";
import { selectedTaskIdAtom, tasksAtom } from "../atoms/tasks.js";
import { workspaceLoadingAtom } from "../atoms/workspace.js";
import { getUpcomingTasks } from "../lib/task-views.js";
import { UpcomingPageDesktopView } from "./views/UpcomingPageDesktopView.js";
import { UpcomingPageMobileView } from "./views/UpcomingPageMobileView.js";

export default function UpcomingPage() {
  const allTasks = useAtomValue(tasksAtom);
  const isLoading = useAtomValue(workspaceLoadingAtom);
  const selectedTaskId = useAtomValue(selectedTaskIdAtom);
  const [showCompleted, setShowCompleted] = useState(false);
  const isMobile = checkIsMobile();
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
    selectedTaskId,
    showCompleted,
    onToggleShowCompleted: () => setShowCompleted((current) => !current),
  };

  if (isMobile) {
    return <UpcomingPageMobileView {...viewProps} />;
  }

  return <UpcomingPageDesktopView {...viewProps} />;
}
