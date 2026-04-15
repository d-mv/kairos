import checkIsMobile from "is-mobile";
import { useAtomValue } from "jotai";
import { completedProjectsAtom } from "../atoms/projects.js";
import { completedTasksAtom } from "../atoms/tasks.js";
import { workspaceLoadingAtom } from "../atoms/workspace.js";
import { usePageTasks } from "../hooks/usePageTasks.js";
import { CompletedPageDesktopView } from "./views/CompletedPageDesktopView.js";
import { CompletedPageMobileView } from "./views/CompletedPageMobileView.js";

export default function CompletedPage() {
  const projects = useAtomValue(completedProjectsAtom);
  const tasks = useAtomValue(completedTasksAtom);
  const isWorkspaceLoading = useAtomValue(workspaceLoadingAtom);
  const isMobile = checkIsMobile();
  const isPageLoading = usePageTasks({ kind: "completed" });
  const isLoading = isWorkspaceLoading || isPageLoading;

  const viewProps = {
    projects,
    tasks,
    isLoading,
  };

  if (isMobile) {
    return <CompletedPageMobileView {...viewProps} />;
  }

  return <CompletedPageDesktopView {...viewProps} />;
}
