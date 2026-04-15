import { ProjectDTO } from "@kairos/shared";
import { Link } from "react-router-dom";

interface AtProjectProps {
  project?: ProjectDTO | null;
}

export function AtProject({ project }: AtProjectProps) {
  if (!project) return null;

  return (
    <Link to={`/project/${project.id}`} onClick={(event) => event.stopPropagation()}>
      @ {project.name}
    </Link>
  );
}
