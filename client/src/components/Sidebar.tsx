import type { EntityType, TaskDTO } from "@kairos/shared";
import { useAtomValue, useSetAtom } from "jotai";
import { Fragment, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { areasAtom } from "../atoms/areas.js";
import { projectsAtom, projectsByAreaAtom } from "../atoms/projects.js";
import { renameEntityAtom } from "../atoms/renameEntity.atom.js";
import { tasksAtom } from "../atoms/tasks.js";
import { workspaceLoadingAtom } from "../atoms/workspace.js";
import { api } from "../lib/api.js";
import { AddNewButton } from "./AddNewButton.js";
import { Menu } from "./Menu/Menu.js";
import { ProjectItem } from "./ProjectItem.js";
import { RenameEntityButton } from "./RenameEntityButton.js";
import { RenameEntityDialog } from "./RenameEntityDialog.js";
import { SectionLabel } from "./SectionLabel.js";
import { Button } from "./ui/button.js";
import { ClipboardListIcon, TrashIcon } from "./ui/icons.js";

export function Sidebar() {
  const areas = useAtomValue(areasAtom);
  const projectsByArea = useAtomValue(projectsByAreaAtom);
  const isLoading = useAtomValue(workspaceLoadingAtom);
  const setProjects = useSetAtom(projectsAtom);
  const setTasks = useSetAtom(tasksAtom);
  const location = useLocation();
  const navigate = useNavigate();
  const [busyProjectId, setBusyProjectId] = useState<string | null>(null);
  const setRenameEntityState = useSetAtom(renameEntityAtom);

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
    setRenameEntityState((s) => ({ ...s!, loading: true }));

    setProjects((prev) => prev.map((item) => (item.id === projectId ? optimisticProject : item)));

    try {
      const updated = await api.projects.update(projectId, { name });
      setProjects((prev) => prev.map((item) => (item.id === projectId ? updated : item)));
      setRenameEntityState(null);
    } catch (err) {
      setProjects((prev) => prev.map((item) => (item.id === projectId ? previousProject : item)));
      setRenameEntityState((s) => ({
        ...s!,
        loading: false,
        errorMessage: err instanceof Error ? err.message : "Failed to rename project",
      }));
      // TODO: remove?
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

  async function handleRename(name: string, entityId: string, type: EntityType) {
    if (type === "project") {
      return handleRenameProject(entityId, name);
    }
  }

  function handleAddNew() {}

  function renderSkeleton() {
    return (
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
    );
  }

  return (
    <>
      <aside className="py-6 px-6 flex min-h-0 flex-col gap-6 text-[var(--color-sidebar-foreground)] relative w-[30rem]">
        <p className="text-[1.1rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          Workspace
        </p>
        <Menu />
        <nav className={`overflow-y-auto flex flex-col gap-6`}>
          {isLoading ? (
            renderSkeleton()
          ) : (
            <>
              <Link
                to="/inbox"
                className={`flex items-center gap-3 rounded-2xl pie-3 text-sm font-medium transition-colors ${
                  isActive("/inbox")
                    ? "bg-[var(--color-sidebar-accent)] text-accent-foreground"
                    : "text-[var(--color-sidebar-foreground)] hover:bg-[var(--color-sidebar-accent)] hover:text-accent-foreground"
                }`}
              >
                Inbox
              </Link>

              {areas.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between pie-3 pb-1">
                    <SectionLabel>Areas</SectionLabel>
                    <AddNewButton type="area" label="Area">
                      + New area
                    </AddNewButton>
                  </div>
                  {!areas.length && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Create your first area to group related projects.
                    </p>
                  )}
                  {areas.map((area) => {
                    const areaProjects = projectsByArea.get(area.id) ?? [];
                    return (
                      <Fragment key={area.id}>
                        <Link
                          to={`/area/${area.id}`}
                          className={`flex items-center gap-3 px-3 py-2 text-sm font-semibold transition-colors ${
                            isActive(`/area/${area.id}`)
                              ? "bg-[var(--color-sidebar-accent)] text-accent-foreground"
                              : "text-[var(--color-sidebar-foreground)] hover:bg-[var(--color-sidebar-accent)] hover:text-accent-foreground"
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
                      </Fragment>
                    );
                  })}
                </div>
              )}
              {areas.length === 0 && (
                <div className="soft-panel rounded-[1.35rem] p-3">
                  <SectionLabel>Areas</SectionLabel>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Create your first area to group related projects.
                  </p>
                  <AddNewButton type="project" label="Project">
                    + New project
                  </AddNewButton>
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-center justify-between pie-3 pb-1">
                  <SectionLabel>Projects</SectionLabel>
                  <AddNewButton type="project" label="Project">
                    + New project
                  </AddNewButton>
                </div>
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
                        <ClipboardListIcon size={20} />
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
            </>
          )}
        </nav>
      </aside>
      <RenameEntityDialog onRename={handleRename} />
    </>
  );
}
