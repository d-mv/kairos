import type { TaskDTO } from "@kairos/shared";
import { useAtomValue, useSetAtom } from "jotai";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { areasAtom } from "../atoms/areas.js";
import { projectsAtom, projectsByAreaAtom } from "../atoms/projects.js";
import { tasksAtom } from "../atoms/tasks.js";
import { workspaceLoadingAtom } from "../atoms/workspace.js";
import { api } from "../lib/api.js";
import { supabase } from "../lib/supabase.js";
import { CreateAreaButton } from "./CreateAreaButton.js";
import { CreateProjectButton } from "./CreateProjectButton.js";
import { RenameEntityButton } from "./RenameEntityButton.js";
import { ThemeToggle } from "./ThemeToggle.js";
import { Button } from "./ui/button.js";
import { TrashIcon } from "./ui/icons.js";

function NavIcon({ src, alt }: { src: string; alt: string }) {
  return (
    <img src={src} alt={alt} className="h-4 w-4 shrink-0 opacity-70 dark:invert dark:opacity-90" />
  );
}

export function Sidebar() {
  const areas = useAtomValue(areasAtom);
  const projectsByArea = useAtomValue(projectsByAreaAtom);
  const isLoading = useAtomValue(workspaceLoadingAtom);
  const setProjects = useSetAtom(projectsAtom);
  const setTasks = useSetAtom(tasksAtom);
  const location = useLocation();
  const navigate = useNavigate();
  const [busyProjectId, setBusyProjectId] = useState<string | null>(null);

  const isActive = (path: string) => location.pathname === path;

  const unassignedProjects = projectsByArea.get(null) ?? [];
  const allProjects = [
    unassignedProjects,
    ...areas.map((area) => projectsByArea.get(area.id) ?? []),
  ].flat();

  const handleRenameProject = async (projectId: string, name: string) => {
    const currentProject = allProjects.find((project) => project.id === projectId);
    if (!currentProject) return;

    const previousProject = currentProject;
    const optimisticProject = { ...currentProject, name, updatedAt: new Date().toISOString() };
    setBusyProjectId(projectId);
    setProjects((prev) => prev.map((item) => (item.id === projectId ? optimisticProject : item)));

    try {
      const updated = await api.projects.update(projectId, { name });
      setProjects((prev) => prev.map((item) => (item.id === projectId ? updated : item)));
    } catch (err) {
      setProjects((prev) => prev.map((item) => (item.id === projectId ? previousProject : item)));
      throw err instanceof Error ? err : new Error("Failed to rename project");
    } finally {
      setBusyProjectId((current) => (current === projectId ? null : current));
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    const currentProject = allProjects.find((project) => project.id === projectId);
    if (!currentProject) return;
    if (!window.confirm(`Delete project "${currentProject.name}"? Tasks will become unassigned.`))
      return;

    const previousProject = currentProject;
    const previousTasks: TaskDTO[] = [];
    const wasOnProjectPage = isActive(`/project/${projectId}`);
    setBusyProjectId(projectId);
    setProjects((prev) => prev.filter((item) => item.id !== projectId));
    setTasks((prev) => {
      const relatedTasks = prev.filter((item) => item.projectId === projectId);
      previousTasks.push(...relatedTasks);
      return prev.map((item) =>
        item.projectId === projectId ? { ...item, projectId: null } : item,
      );
    });

    const activePath = `/project/${projectId}`;
    if (wasOnProjectPage) navigate("/inbox");

    try {
      await api.projects.delete(projectId);
    } catch (err) {
      setProjects((prev) => {
        if (prev.some((item) => item.id === previousProject.id)) return prev;
        return [...prev, previousProject];
      });
      setTasks((prev) =>
        prev.map((item) => previousTasks.find((task) => task.id === item.id) ?? item),
      );
      if (wasOnProjectPage) {
        navigate(activePath);
      }
      window.alert(err instanceof Error ? err.message : "Failed to delete project");
    } finally {
      setBusyProjectId((current) => (current === projectId ? null : current));
    }
  };

  return (
    <aside className="mx-3 mb-0 mt-3 flex max-h-[calc(100vh-1.2rem)] min-h-0 flex-col overflow-hidden rounded-[1.6rem] border border-[var(--color-sidebar-border)] bg-[var(--color-sidebar)] text-[var(--color-sidebar-foreground)] shadow-[var(--shadow-panel)] backdrop-blur-xl lg:m-3 lg:h-[calc(100vh-1.5rem)] lg:w-[28rem]">
      <div className="border-b border-[var(--color-sidebar-border)] px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[0.95rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Workspace
            </p>
            <h1 className="mt-2 text-[2.4rem] font-semibold tracking-tight">Kairos</h1>
            <p className="mt-1 max-w-[22rem] text-sm text-muted-foreground">
              Tasks, projects, and timing in one place.
            </p>
          </div>
          <ThemeToggle className="shrink-0" />
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {isLoading ? (
          <>
            <div className="skeleton h-[4.6rem] rounded-2xl" />
            <div className="space-y-2">
              <div className="skeleton h-[1.2rem] w-[8rem] rounded-full" />
              <div className="skeleton h-[4.4rem] rounded-2xl" />
              <div className="skeleton h-[4.4rem] rounded-2xl" />
            </div>
            <div className="space-y-2">
              <div className="skeleton h-[1.2rem] w-[6rem] rounded-full" />
              <div className="soft-panel rounded-[1.35rem] p-2">
                <div className="skeleton h-[4.4rem] rounded-2xl" />
                <div className="mt-2 skeleton h-[4rem] rounded-2xl" />
              </div>
            </div>
          </>
        ) : (
          <>
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
                label="New project"
                className="w-full justify-start rounded-2xl px-4 py-3 text-left text-sm"
                navigateToProject
                size="sm"
              />

              {unassignedProjects.map((project) => (
                <div
                  key={project.id}
                  className={`rounded-2xl transition-colors ${
                    isActive(`/project/${project.id}`)
                      ? "bg-[var(--color-sidebar-accent)] text-accent-foreground"
                      : "text-[var(--color-sidebar-foreground)] hover:bg-[var(--color-sidebar-accent)] hover:text-accent-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2 px-2 py-2">
                    <Link
                      to={`/project/${project.id}`}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-[1.2rem] px-2 py-2 text-sm transition-colors"
                    >
                      <NavIcon src="/icons/clipboard-document-list.svg" alt="Project" />
                      <span className="truncate">{project.name}</span>
                    </Link>
                    <div className="flex shrink-0 items-center gap-2">
                      <RenameEntityButton
                        currentName={project.name}
                        entityLabel="Project"
                        loading={busyProjectId === project.id}
                        onRename={(name) => handleRenameProject(project.id, name)}
                        iconOnly
                        size="sm"
                        variant="ghost"
                        className="h-[3rem] w-[3rem] rounded-[1rem] p-0"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={busyProjectId === project.id}
                        aria-label="Delete project"
                        className="h-[3rem] w-[3rem] rounded-[1rem] text-destructive hover:text-destructive"
                        onClick={() => {
                          void handleDeleteProject(project.id);
                        }}
                      >
                        <TrashIcon
                          size={14}
                          className={busyProjectId === project.id ? "opacity-40" : ""}
                        />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {areas.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-3 pb-1">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                    Areas
                  </p>
                  <CreateAreaButton label="Area" size="sm" className="h-7 px-2 text-[1.1rem]" />
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
                        <div
                          key={project.id}
                          className={`mt-1 rounded-2xl transition-colors ${
                            isActive(`/project/${project.id}`)
                              ? "bg-[var(--color-sidebar-accent)] text-accent-foreground"
                              : "text-muted-foreground hover:bg-[var(--color-sidebar-accent)] hover:text-accent-foreground"
                          }`}
                        >
                          <div className="flex items-center gap-2 px-2 py-2 pl-[2.4rem]">
                            <Link
                              to={`/project/${project.id}`}
                              className="flex min-w-0 flex-1 items-center gap-3 rounded-[1.2rem] px-2 py-2 text-sm transition-colors"
                            >
                              <NavIcon src="/icons/clipboard-document-list.svg" alt="Project" />
                              <span className="truncate">{project.name}</span>
                            </Link>
                            <div className="flex shrink-0 items-center gap-2">
                              <RenameEntityButton
                                currentName={project.name}
                                entityLabel="Project"
                                loading={busyProjectId === project.id}
                                onRename={(name) => handleRenameProject(project.id, name)}
                                iconOnly
                                size="sm"
                                variant="ghost"
                                className="h-[3rem] w-[3rem] rounded-[1rem] p-0"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                disabled={busyProjectId === project.id}
                                aria-label="Delete project"
                                className="h-[3rem] w-[3rem] rounded-[1rem] text-destructive hover:text-destructive"
                                onClick={() => {
                                  void handleDeleteProject(project.id);
                                }}
                              >
                                <TrashIcon
                                  size={14}
                                  className={busyProjectId === project.id ? "opacity-40" : ""}
                                />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
            {areas.length === 0 && (
              <div className="soft-panel rounded-[1.35rem] p-3">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                  Areas
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Create your first area to group related projects.
                </p>
                <CreateAreaButton
                  label="Create Area"
                  navigateToArea
                  className="mt-3 w-full justify-start rounded-2xl px-4 py-3 text-sm"
                />
              </div>
            )}
          </>
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
