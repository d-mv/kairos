import { ProjectDTO } from "@kairos/shared";
import clsx from "clsx";
import { useSetAtom } from "jotai";
import { useLocation } from "react-router-dom";
import { renameEntityAtom } from "../atoms/renameEntity.atom";
import { InlineButton } from "./InlineButton";
import { ProjectIndent } from "./ProjectIndent";
import { SidebarItem } from "./SidebarItem";

type Props = {
  project: ProjectDTO;
  isLast: boolean;
  busyProjectId: string | null;
  handleDeleteProject: (projectId: string) => Promise<void>;
  showIndent?: boolean;
};

export function ProjectItem({
  project,
  isLast,
  busyProjectId,
  handleDeleteProject,
  showIndent = true,
}: Props) {
  const setRenameEntityDialog = useSetAtom(renameEntityAtom);

  const location = useLocation();

  function handleRename() {
    setRenameEntityDialog({
      entityId: project.id,
      entityLabel: "Project",
      currentName: project.name,
      type: "project",
    });
  }

  function renderHoverActions() {
    return (
      <div className="flex shrink-0 items-center gap-1 pr-2 opacity-0 pointer-events-none transition-opacity duration-200 ease-out [transition-delay:0ms] group-hover:opacity-100 group-hover:pointer-events-auto group-hover:[transition-delay:1000ms]">
        <InlineButton
          id={`rename-project-${project.id}`}
          disabled={busyProjectId === project.id}
          onClick={handleRename}
        >
          edit
        </InlineButton>
        <InlineButton
          id={`delete-project-${project.id}`}
          disabled={busyProjectId === project.id}
          onClick={() => {
            void handleDeleteProject(project.id);
          }}
          className="text-destructive hover:text-destructive "
        >
          del
        </InlineButton>
      </div>
    );
  }

  const isActiveProject = location.pathname === `/project/${project.id}`;

  return (
    <div
      className={clsx(
        "group grid h-[3rem] rounded-lg transition-colors",
        showIndent ? "grid-cols-[1rem_1fr_auto]" : "grid-cols-[1fr_auto]",
        isActiveProject
          ? "bg-accent text-accent-foreground"
          : "text-sidebar-foreground hover:bg-accent/70 hover:text-accent-foreground",
      )}
    >
      {showIndent ? (
        <ProjectIndent projectId={project.id} isLast={isLast} isActive={isActiveProject} />
      ) : null}
      <SidebarItem
        path={`/project/${project.id}`}
        className="bg-transparent px-3 py-1.5 hover:bg-transparent"
      >
        {project.name}
      </SidebarItem>
      {renderHoverActions()}
    </div>
  );
}
