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
      className="overflow-hidden text-ellipsis whitespace-nowrap rounded-md border border-border bg-muted/60 px-2 py-1 text-[1.1rem] font-medium text-muted-foreground transition-colors group-hover:bg-accent group-hover:text-foreground"
      onClick={(event) => event.stopPropagation()}
    >
      @ {project.name}
    </Link>
  );
}
