import checkIsMobile from "is-mobile";
import { useAtomValue, useAtom } from "jotai";
import { showCompletedTasksAtom } from "../atoms/pagePrefs.js";
import { inboxTasksAtom, selectedTaskIdAtom } from "../atoms/tasks.js";
import { workspaceLoadingAtom } from "../atoms/workspace.js";
import { InboxPageDesktopView } from "./views/InboxPageDesktopView.js";
import { InboxPageMobileView } from "./views/InboxPageMobileView.js";

export default function InboxPage() {
  const tasks = useAtomValue(inboxTasksAtom);
  const isLoading = useAtomValue(workspaceLoadingAtom);
  const selectedTaskId = useAtomValue(selectedTaskIdAtom);
  const [showCompleted, setShowCompleted] = useAtom(showCompletedTasksAtom);
  const isMobile = checkIsMobile();

  const topLevelTasks = tasks.filter(
    (t) => !t.parentTaskId && (showCompleted || t.status !== "done"),
  );

  const viewProps = {
    tasks: topLevelTasks,
    isLoading,
    selectedTaskId,
    showCompleted,
    onToggleShowCompleted: () => setShowCompleted((current) => !current),
  };

  if (isMobile) {
    return <InboxPageMobileView {...viewProps} />;
  }

  return <InboxPageDesktopView {...viewProps} />;
}
