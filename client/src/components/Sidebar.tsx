import { Link, useLocation } from "react-router-dom";
import { useAtomValue } from "jotai";
import { areasAtom } from "../atoms/areas.js";
import { projectsByAreaAtom } from "../atoms/projects.js";
import { supabase } from "../lib/supabase.js";
import { CreateProjectButton } from "./CreateProjectButton.js";
import { Button } from "./ui/button.js";

function NavIcon({ src, alt }: { src: string; alt: string }) {
  return <img src={src} alt={alt} className="h-4 w-4 shrink-0" />;
}

export function Sidebar() {
  const areas = useAtomValue(areasAtom);
  const projectsByArea = useAtomValue(projectsByAreaAtom);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const unassignedProjects = projectsByArea.get(null) ?? [];

  return (
    <aside className="w-60 border-r border-border h-full flex flex-col bg-background">
      <div className="p-4 border-b border-border">
        <h1 className="text-xl font-bold">Kairos</h1>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* Inbox */}
        <Link
          to="/inbox"
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            isActive("/inbox")
              ? "bg-accent text-accent-foreground"
              : "text-foreground hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          <NavIcon src="/icons/inbox.svg" alt="Inbox" />
          <span>Inbox</span>
        </Link>

        {/* Unassigned projects */}
        <div className="mt-2">
          <CreateProjectButton
            label="+ New project"
            className="w-full text-left px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            navigateToProject
            size="sm"
          />

          {unassignedProjects.length > 0 && (
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Projects
            </p>
          )}
          {unassignedProjects.map((project) => (
            <Link
              key={project.id}
              to={`/project/${project.id}`}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive(`/project/${project.id}`)
                  ? "bg-accent text-accent-foreground"
                  : "text-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <NavIcon src="/icons/clipboard-document-list.svg" alt="Project" />
              <span className="truncate">{project.name}</span>
            </Link>
          ))}
        </div>

        {/* Areas and their projects */}
        {areas.map((area) => {
          const areaProjects = projectsByArea.get(area.id) ?? [];
          return (
            <div key={area.id} className="mt-2">
              <Link
                to={`/area/${area.id}`}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
                  isActive(`/area/${area.id}`)
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <NavIcon src="/icons/folder.svg" alt="Area" />
                <span className="truncate">{area.name}</span>
              </Link>

              {areaProjects.map((project) => (
                <Link
                  key={project.id}
                  to={`/project/${project.id}`}
                  className={`flex items-center gap-2 pl-8 pr-3 py-2 rounded-md text-sm transition-colors ${
                    isActive(`/project/${project.id}`)
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <NavIcon src="/icons/clipboard-document-list.svg" alt="Project" />
                  <span className="truncate">{project.name}</span>
                </Link>
              ))}
            </div>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="p-4 border-t border-border">
        <Button
          onClick={() => supabase.auth.signOut()}
          variant="ghost"
          className="w-full justify-start text-sm text-muted-foreground hover:text-foreground"
        >
          <NavIcon src="/icons/arrow-right-on-rectangle.svg" alt="" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
