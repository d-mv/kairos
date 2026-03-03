import { ProjectDTO } from "@kairos/shared";
import { Link } from "react-router-dom";

interface AtProjectProps {
  project?: ProjectDTO | null;
}

export function AtProject({ project }: AtProjectProps) {
  if (!project) return null;

  return (
    <Link
      to={`/project/${project.id}`}
      className="text-sm font-light text-muted-foreground text-nowrap text-ellipsis overflow-hidden bg-accent px-2 py-1 rounded-md group-hover:bg-accent-foreground group-hover:text-accent"
    >
      @ {project.name}
    </Link>
  );
}
