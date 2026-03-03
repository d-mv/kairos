import { AreaDTO } from "@kairos/shared";
import { useAtomValue } from "jotai";
import { Link } from "react-router-dom";
import { projectsByAreaAtom } from "../atoms/projects";
import { useIsActive } from "../lib/useIsActive";
import { ProjectItem } from "./ProjectItem";

type Props = {
  area: AreaDTO;
  busyProjectId: string | null;
  handleDeleteProject: (projectId: string) => Promise<void>;
};

export function AreaItem({ area, busyProjectId, handleDeleteProject }: Props) {
  const projectsByArea = useAtomValue(projectsByAreaAtom);

  const isActive = useIsActive();

  const areaProjects = projectsByArea.get(area.id) ?? [];
  return (
    <div className="flex flex-col">
      <Link
        to={`/area/${area.id}`}
        className={`flex items-center gap-3 px-3 py-[1rem] text-sm font-semibold transition-colors ${
          isActive(`/area/${area.id}`)
            ? "bg-(--color-sidebar-accent) text-accent-foreground"
            : "text-sidebar-foreground hover:bg-(--color-sidebar-accent) hover:text-accent-foreground"
        }`}
      >
        <span className="truncate">{area.name}</span>
      </Link>
      <div className={"border-gray-300 border-b-[0.1rem]"} />
      {areaProjects.map((project, index) => (
        <ProjectItem
          key={project.id}
          project={project}
          isLast={index === areaProjects.length - 1}
          busyProjectId={busyProjectId}
          handleDeleteProject={handleDeleteProject}
        />
      ))}
    </div>
  );
}
