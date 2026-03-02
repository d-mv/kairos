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
};

export function ProjectItem({ project, isLast, busyProjectId, handleDeleteProject }: Props) {
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
      <div className="shrink-0 items-center gap-2 hidden group-hover:flex text-xs font-light group-hover:bg-accent">
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
      className={clsx("group transition-colors grid grid-cols-[1rem_1fr_6rem] grid-rows-[3rem]")}
    >
      <ProjectIndent projectId={project.id} isLast={isLast} isActive={isActiveProject} />
      <SidebarItem path={`/project/${project.id}`}>{project.name}</SidebarItem>
      {renderHoverActions()}
    </div>
  );
}
