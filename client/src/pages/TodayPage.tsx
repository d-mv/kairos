import checkIsMobile from "is-mobile";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import { pageMenuAtom } from "../atoms/pageMenu.atom.js";
import { tasksAtom } from "../atoms/tasks.js";
import { workspaceLoadingAtom } from "../atoms/workspace.js";
import { getTodayTasks } from "../lib/task-views.js";
import { TodayPageDesktopView } from "./views/TodayPageDesktopView.js";
import { TodayPageMobileView } from "./views/TodayPageMobileView.js";

export default function TodayPage() {
  const allTasks = useAtomValue(tasksAtom);
  const isLoading = useAtomValue(workspaceLoadingAtom);
  const setPageMenu = useSetAtom(pageMenuAtom);
  const [showCompleted, setShowCompleted] = useState(false);
  const isMobile = checkIsMobile();

  useEffect(() => {
    setPageMenu([
      {
        label: showCompleted ? "Hide Completed" : "Show Completed",
        onClick: () => setShowCompleted((c) => !c),
      },
    ]);
    return () => setPageMenu([]);
  }, [setPageMenu, showCompleted]);

  const tasks = getTodayTasks(allTasks, new Date().toISOString(), showCompleted);

  const viewProps = {
    tasks,
    isLoading,
    hideCompleted: !showCompleted,
  };

  if (isMobile) {
    return <TodayPageMobileView {...viewProps} />;
  }

  return <TodayPageDesktopView {...viewProps} />;
}
