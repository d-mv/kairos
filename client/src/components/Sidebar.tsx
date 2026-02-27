import { Link, useLocation } from "react-router-dom";
import { useAtomValue } from "jotai";
import { areasAtom } from "../atoms/areas.js";
import { projectsByAreaAtom } from "../atoms/projects.js";
import { supabase } from "../lib/supabase.js";
import { CreateProjectButton } from "./CreateProjectButton.js";
import { ThemeToggle } from "./ThemeToggle.js";
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
    <aside className="m-3 flex h-[calc(100vh-1.5rem)] w-72 flex-col rounded-[1.6rem] border border-[var(--color-sidebar-border)] bg-[var(--color-sidebar)] text-[var(--color-sidebar-foreground)] shadow-[var(--shadow-panel)] backdrop-blur-xl">
      <div className="border-b border-[var(--color-sidebar-border)] px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[0.95rem] font-semibold tracking-[0.28em] text-muted-foreground uppercase">
              Workspace
            </p>
            <h1 className="mt-2 text-[2.2rem] font-semibold tracking-tight">Kairos</h1>
            <p className="mt-1 text-sm text-muted-foreground">Tasks, projects, and timing in one place.</p>
          </div>
          <ThemeToggle className="shrink-0" />
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        <Link
          to="/inbox"
          className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
            isActive("/inbox")
              ? "bg-[var(--color-sidebar-accent)] text-accent-foreground"
              : "text-[var(--color-sidebar-foreground)] hover:bg-[var(--color-sidebar-accent)] hover:text-accent-foreground"
          }`}
        >
          <NavIcon src="/icons/inbox.svg" alt="Inbox" />
          <span>Inbox</span>
        </Link>

        <div className="space-y-1">
          <div className="flex items-center justify-between px-3 pb-1">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Projects
            </p>
          </div>
          <CreateProjectButton
            label="+ New project"
            className="w-full justify-start rounded-2xl px-4 py-3 text-left text-sm"
            navigateToProject
            size="sm"
          />

          {unassignedProjects.map((project) => (
            <Link
              key={project.id}
              to={`/project/${project.id}`}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-colors ${
                isActive(`/project/${project.id}`)
                  ? "bg-[var(--color-sidebar-accent)] text-accent-foreground"
                  : "text-[var(--color-sidebar-foreground)] hover:bg-[var(--color-sidebar-accent)] hover:text-accent-foreground"
              }`}
            >
              <NavIcon src="/icons/clipboard-document-list.svg" alt="Project" />
              <span className="truncate">{project.name}</span>
            </Link>
          ))}
        </div>

        {areas.length > 0 && (
          <div className="space-y-2">
            <div className="px-3 pb-1">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                Areas
              </p>
            </div>
            {areas.map((area) => {
              const areaProjects = projectsByArea.get(area.id) ?? [];
              return (
                <div key={area.id} className="soft-panel rounded-[1.35rem] p-2">
                  <Link
                    to={`/area/${area.id}`}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition-colors ${
                      isActive(`/area/${area.id}`)
                        ? "bg-[var(--color-sidebar-accent)] text-accent-foreground"
                        : "text-[var(--color-sidebar-foreground)] hover:bg-[var(--color-sidebar-accent)] hover:text-accent-foreground"
                    }`}
                  >
                    <NavIcon src="/icons/folder.svg" alt="Area" />
                    <span className="truncate">{area.name}</span>
                  </Link>

                  {areaProjects.map((project) => (
                    <Link
                      key={project.id}
                      to={`/project/${project.id}`}
                      className={`mt-1 flex items-center gap-3 rounded-2xl px-3 py-2.5 pl-9 text-sm transition-colors ${
                        isActive(`/project/${project.id}`)
                          ? "bg-[var(--color-sidebar-accent)] text-accent-foreground"
                          : "text-muted-foreground hover:bg-[var(--color-sidebar-accent)] hover:text-accent-foreground"
                      }`}
                    >
                      <NavIcon src="/icons/clipboard-document-list.svg" alt="Project" />
                      <span className="truncate">{project.name}</span>
                    </Link>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </nav>

      <div className="border-t border-[var(--color-sidebar-border)] p-4">
        <Button
          onClick={() => supabase.auth.signOut()}
          variant="ghost"
          className="w-full justify-start rounded-2xl px-4 py-3 text-sm"
        >
          <NavIcon src="/icons/arrow-right-on-rectangle.svg" alt="" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
