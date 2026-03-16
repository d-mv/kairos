import checkIsMobile from "is-mobile";
import { useAtomValue } from "jotai";
import { completedProjectsAtom } from "../atoms/projects.js";
import { completedTasksAtom } from "../atoms/tasks.js";
import { workspaceLoadingAtom } from "../atoms/workspace.js";
import { CompletedPageDesktopView } from "./views/CompletedPageDesktopView.js";
import { CompletedPageMobileView } from "./views/CompletedPageMobileView.js";

export default function CompletedPage() {
  const projects = useAtomValue(completedProjectsAtom);
  const tasks = useAtomValue(completedTasksAtom);
  const isLoading = useAtomValue(workspaceLoadingAtom);
  const isMobile = checkIsMobile();

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
