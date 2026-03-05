import { useAtomValue } from "jotai";
import { PropsWithChildren, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { areasAtom } from "../atoms/areas.js";
import { projectsByAreaAtom } from "../atoms/projects.js";
import { EllipsisVerticalIcon } from "./ui/heroicons.js";
import { XIcon } from "./ui/icons.js";

const SYSTEM_ITEMS = [
  { path: "/inbox", label: "Inbox" },
  { path: "/today", label: "Today" },
  { path: "/upcoming", label: "Upcoming" },
  { path: "/completed", label: "Completed" },
] as const;

export function MobileAppLayout({ children }: PropsWithChildren) {
  const location = useLocation();
  const areas = useAtomValue(areasAtom);
  const projectsByArea = useAtomValue(projectsByAreaAtom);
  const [navigationOpen, setNavigationOpen] = useState(false);

  const unassignedProjects = projectsByArea.get(null) ?? [];
  const projectsByAreaEntries = useMemo(
    () => areas.map((area) => ({ area, projects: projectsByArea.get(area.id) ?? [] })),
    [areas, projectsByArea],
  );

  useEffect(() => {
    setNavigationOpen(false);
  }, [location.pathname]);

  return (
    <div id="mobile-app-layout" className="flex h-screen flex-col overflow-hidden bg-background">
      <main className="min-h-0 flex-1 overflow-hidden">{children}</main>

      <nav className="grid h-14 grid-cols-4 border-t border-border bg-background px-1">
        {SYSTEM_ITEMS.slice(0, 3).map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-center rounded-md text-xs font-medium ${
                active ? "text-foreground bg-accent/70" : "text-muted-foreground"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
        <button
          type="button"
          className="flex items-center justify-center rounded-md text-muted-foreground"
          onClick={() => setNavigationOpen(true)}
          aria-label="Open full navigation"
        >
          <EllipsisVerticalIcon className="h-5 w-5 rotate-90" />
        </button>
      </nav>

      {navigationOpen ? (
        <div className="absolute inset-0 z-40 flex flex-col bg-background">
          <div className="flex h-14 items-center justify-between border-b border-border px-3">
            <p className="text-sm font-semibold tracking-wide">Navigation</p>
            <button
              type="button"
              onClick={() => setNavigationOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-foreground"
              aria-label="Close full navigation"
            >
              <XIcon size={16} />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
            <nav className="space-y-1">
              {SYSTEM_ITEMS.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`block rounded-md px-3 py-2 text-sm ${
                      active ? "bg-accent text-accent-foreground" : "text-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {projectsByAreaEntries.length > 0 ? (
              <div className="mt-3 space-y-2">
                <p className="px-2 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Areas
                </p>
                {projectsByAreaEntries.map(({ area, projects }) => (
                  <div key={area.id} className="rounded-md border border-border/60 p-2">
                    <Link to={`/area/${area.id}`} className="block px-1 py-1 text-sm font-medium">
                      {area.name}
                    </Link>
                    <div className="mt-1 space-y-1">
                      {projects.map((project) => (
                        <Link
                          key={project.id}
                          to={`/project/${project.id}`}
                          className="block rounded-md px-2 py-1 text-sm text-muted-foreground"
                        >
                          {project.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {unassignedProjects.length > 0 ? (
              <div className="mt-3 space-y-2">
                <p className="px-2 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Projects
                </p>
                <div className="space-y-1">
                  {unassignedProjects.map((project) => (
                    <Link
                      key={project.id}
                      to={`/project/${project.id}`}
                      className="block rounded-md px-3 py-2 text-sm text-foreground"
                    >
                      {project.name}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
