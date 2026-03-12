import checkIsMobile from "is-mobile";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import { pageMenuAtom } from "../atoms/pageMenu.atom.js";
import { inboxTasksAtom } from "../atoms/tasks.js";
import { workspaceLoadingAtom } from "../atoms/workspace.js";
import { InboxPageDesktopView } from "./views/InboxPageDesktopView.js";
import { InboxPageMobileView } from "./views/InboxPageMobileView.js";

export default function InboxPage() {
  const tasks = useAtomValue(inboxTasksAtom);
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
