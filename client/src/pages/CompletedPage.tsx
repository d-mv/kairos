import checkIsMobile from "is-mobile";
import { useAtomValue } from "jotai";
import { completedTasksAtom, selectedTaskIdAtom } from "../atoms/tasks.js";
import { workspaceLoadingAtom } from "../atoms/workspace.js";
import { CompletedPageDesktopView } from "./views/CompletedPageDesktopView.js";
import { CompletedPageMobileView } from "./views/CompletedPageMobileView.js";

export default function CompletedPage() {
  const tasks = useAtomValue(completedTasksAtom);
  const isLoading = useAtomValue(workspaceLoadingAtom);
  const selectedTaskId = useAtomValue(selectedTaskIdAtom);
  const isMobile = checkIsMobile();

  const viewProps = {
    tasks,
    isLoading,
    selectedTaskId,
  };

  if (isMobile) {
    return <CompletedPageMobileView {...viewProps} />;
  }

  return <CompletedPageDesktopView {...viewProps} />;
}
