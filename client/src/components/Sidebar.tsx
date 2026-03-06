import type { EntityType, TaskDTO } from "@kairos/shared";
import { useAtomValue, useSetAtom } from "jotai";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { areasAtom } from "../atoms/areas.js";
import { projectsAtom, projectsByAreaAtom } from "../atoms/projects.js";
import { renameEntityAtom } from "../atoms/renameEntity.atom.js";
import { tasksAtom } from "../atoms/tasks.js";
import { workspaceLoadingAtom } from "../atoms/workspace.js";
import { api } from "../lib/api.js";
import { useIsActive } from "../lib/useIsActive.js";
import { AddNewButton } from "./AddNewButton.js";
import { AddNewEntityDialog } from "./AddEntityDialog.js";
import { AreaItem } from "./AreaItem.js";
import { Menu } from "./Menu/Menu.js";
import { RenameEntityDialog } from "./RenameEntityDialog.js";
import { ProjectItem } from "./ProjectItem.js";
import { SectionLabel } from "./SectionLabel.js";
import { SystemSidebarItem } from "./SystemSidebarItem.js";
import { SYSTEM_SIDEBAR_ITEMS } from "./data.js";

export function Sidebar() {
  const areas = useAtomValue(areasAtom);
  const projectsByArea = useAtomValue(projectsByAreaAtom);
  const isLoading = useAtomValue(workspaceLoadingAtom);
  const setProjects = useSetAtom(projectsAtom);
  const setTasks = useSetAtom(tasksAtom);
  const navigate = useNavigate();
  const [busyProjectId, setBusyProjectId] = useState<string | null>(null);
  const setRenameEntityState = useSetAtom(renameEntityAtom);

  const isActive = useIsActive();

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
      <aside className="relative flex min-h-0 w-[31rem] flex-col gap-5 border-r border-sidebar-border/80 bg-sidebar/90 px-5 py-5 text-[var(--color-sidebar-foreground)] backdrop-blur">
        <Menu />
        <nav className={`overflow-y-auto flex flex-col gap-6`}>
          {isLoading ? (
            renderSkeleton()
          ) : (
            <>
              <div className="flex flex-col">
                {SYSTEM_SIDEBAR_ITEMS.map((item) => (
                  <SystemSidebarItem key={item.path} path={item.path}>
                    {item.label}
                  </SystemSidebarItem>
                ))}
              </div>

              {areas.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between pb-1 pe-3">
                    <SectionLabel>Areas</SectionLabel>
                    <AddNewButton type="area" label="Area">
                      + New area
                    </AddNewButton>
                  </div>
                  {areas.map((area) => (
                    <AreaItem
                      key={area.id}
                      area={area}
                      busyProjectId={busyProjectId}
                      handleDeleteProject={handleDeleteProject}
                    />
                  ))}
                </div>
              )}
              {areas.length === 0 && (
                <div className="soft-panel rounded-xl p-3">
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
                <div className="flex items-center justify-between pb-1 pe-3">
                  <SectionLabel>Projects</SectionLabel>
                  <AddNewButton type="project" label="Project">
                    + New project
                  </AddNewButton>
                </div>
                {unassignedProjects.map((project, index) => (
                  <ProjectItem
                    key={project.id}
                    project={project}
                    isLast={index === unassignedProjects.length - 1}
                    busyProjectId={busyProjectId}
                    handleDeleteProject={handleDeleteProject}
                    showIndent={false}
                  />
                ))}
              </div>
            </>
          )}
        </nav>
      </aside>
      <AddNewEntityDialog />
      <RenameEntityDialog onRename={handleRename} />
    </>
  );
}
