import checkIsMobile from "is-mobile";
import { useAtomValue } from "jotai";
import { useState } from "react";
import { selectedTaskIdAtom, tasksAtom } from "../atoms/tasks.js";
import { workspaceLoadingAtom } from "../atoms/workspace.js";
import { getTodayTasks } from "../lib/task-views.js";
import { TodayPageDesktopView } from "./views/TodayPageDesktopView.js";
import { TodayPageMobileView } from "./views/TodayPageMobileView.js";

export default function TodayPage() {
  const allTasks = useAtomValue(tasksAtom);
  const isLoading = useAtomValue(workspaceLoadingAtom);
  const selectedTaskId = useAtomValue(selectedTaskIdAtom);
  const [showCompleted, setShowCompleted] = useState(false);
  const isMobile = checkIsMobile();
  const tasks = getTodayTasks(allTasks, new Date().toISOString(), showCompleted);

  const viewProps = {
    tasks,
    isLoading,
    selectedTaskId,
    showCompleted,
    onToggleShowCompleted: () => setShowCompleted((current) => !current),
  };

  if (isMobile) {
    return <TodayPageMobileView {...viewProps} />;
  }

  return <TodayPageDesktopView {...viewProps} />;
}
