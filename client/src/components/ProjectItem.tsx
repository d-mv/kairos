import { ProjectDTO } from "@kairos/shared";
import clsx from "clsx";
import { useSetAtom } from "jotai";
import { Link, useLocation } from "react-router-dom";
import { renameEntityAtom } from "../atoms/renameEntity.atom";
import { ProjectIndent } from "./ProjectIndent";
import { Button } from "./ui/button";

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
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={busyProjectId === project.id}
          aria-label="Delete project"
          className="h-[3rem] w-[3rem] rounded-[1rem] text-xs font-light hover:underline underline-offset-[0.3rem] decoration-[0.1rem] cursor-pointer"
          onClick={handleRename}
        >
          edit
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={busyProjectId === project.id}
          aria-label="Delete project"
          className="h-[3rem] w-[3rem] rounded-[1rem] text-destructive hover:text-destructive text-xs font-light hover:underline underline-offset-[0.3rem] decoration-[0.1rem] cursor-pointer"
          onClick={() => {
            void handleDeleteProject(project.id);
          }}
        >
          del
        </Button>
      </div>
    );
  }

  const isActiveProject = location.pathname === `/project/${project.id}`;

  const maybeActiveContainerClass = isActiveProject
    ? "text-accent-foreground font-medium"
    : "text-muted-foreground";

  return (
    <div
      className={clsx("group transition-colors grid grid-cols-[1rem_1fr_6rem] grid-rows-[3rem]")}
    >
      <ProjectIndent projectId={project.id} isLast={isLast} isActive={isActiveProject} />
      <Link
        to={`/project/${project.id}`}
        className={clsx(
          "flex min-w-0 flex-1 items-center gap-2 rounded-[1 rem] px-2 text-base transition-colors group-hover:bg-accent group-hover:underline underline-offset-[0.3rem] decoration-[0.1rem]",
          maybeActiveContainerClass,
        )}
      >
        <span className="truncate">{project.name}</span>
      </Link>
      {renderHoverActions()}
    </div>
  );
}
