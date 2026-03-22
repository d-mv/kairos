import checkIsMobile from "is-mobile";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import { pageMenuAtom } from "../atoms/pageMenu.atom.js";
import { inboxTasksAtom } from "../atoms/tasks.js";
import { workspaceLoadingAtom } from "../atoms/workspace.js";
import { usePageTasks } from "../hooks/usePageTasks.js";
import { InboxPageDesktopView } from "./views/InboxPageDesktopView.js";
import { InboxPageMobileView } from "./views/InboxPageMobileView.js";

export default function InboxPage() {
  const tasks = useAtomValue(inboxTasksAtom);
  const isWorkspaceLoading = useAtomValue(workspaceLoadingAtom);
  const isPageLoading = usePageTasks({ kind: "inbox" });
  const setPageMenu = useSetAtom(pageMenuAtom);
  const [showCompleted, setShowCompleted] = useState(false);
  const isMobile = checkIsMobile();
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

  const topLevelTasks = tasks.filter(
    (t) => !t.parentTaskId && (showCompleted || t.status !== "done"),
  );

  const viewProps = {
    tasks: topLevelTasks,
    isLoading,
    hideCompleted: !showCompleted,
  };

  if (isMobile) {
    return <InboxPageMobileView {...viewProps} />;
  }

  return <InboxPageDesktopView {...viewProps} />;
}
