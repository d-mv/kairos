import { useParams, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useAtomValue, useSetAtom } from "jotai";
import { areasAtom } from "../atoms/areas.js";
import { projectsByAreaAtom } from "../atoms/projects.js";
import { tasksByAreaAtom, selectedTaskIdAtom } from "../atoms/tasks.js";
import { workspaceLoadingAtom } from "../atoms/workspace.js";
import { TaskList } from "../components/TaskList.js";
import { TaskDetailPanel } from "../components/TaskDetailPanel.js";
import { CreateProjectButton } from "../components/CreateProjectButton.js";
import { RenameEntityButton } from "../components/RenameEntityButton.js";
import { projectsAtom } from "../atoms/projects.js";
import { tasksAtom } from "../atoms/tasks.js";
import { api } from "../lib/api.js";
import { Button } from "../components/ui/button.js";
import { TrashIcon } from "../components/ui/icons.js";
import { useState } from "react";

export default function AreaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const areas = useAtomValue(areasAtom);
  const projectsByArea = useAtomValue(projectsByAreaAtom);
  const tasksByArea = useAtomValue(tasksByAreaAtom);
  const isLoading = useAtomValue(workspaceLoadingAtom);
  const selectedTaskId = useAtomValue(selectedTaskIdAtom);
  const setAreas = useSetAtom(areasAtom);
  const setProjects = useSetAtom(projectsAtom);
  const setTasks = useSetAtom(tasksAtom);
  const [renameLoading, setRenameLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [busyProjectId, setBusyProjectId] = useState<string | null>(null);
  const [actionState, setActionState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const area = areas.find((a) => a.id === id);
  const projects = id ? (projectsByArea.get(id) ?? []) : [];
  const tasks = id ? (tasksByArea.get(id) ?? []) : [];
  const areaName = area?.name ?? "Area";

  if (!area && !isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Area not found</p>
      </div>
    );
  }

  const handleRename = async (name: string) => {
    if (!area) return;
    const previousArea = area;
    const optimisticArea = { ...area, name, updatedAt: new Date().toISOString() };
    setRenameLoading(true);
    setActionState("saving");
    setAreas((prev) => prev.map((item) => (item.id === area.id ? optimisticArea : item)));
    try {
      const updated = await api.areas.update(area.id, name);
      setAreas((prev) => prev.map((item) => (item.id === area.id ? updated : item)));
      setActionState("saved");
    } catch (err) {
      setAreas((prev) => prev.map((item) => (item.id === area.id ? previousArea : item)));
      setActionState("error");
      throw err instanceof Error ? err : new Error("Failed to rename area");
    } finally {
      setRenameLoading(false);
      window.setTimeout(() => setActionState("idle"), 1500);
    }
  };

  const handleDelete = async () => {
    if (!area) return;
    if (!window.confirm(`Delete area "${area.name}"? Projects and tasks will become unassigned.`)) {
      return;
    }

    const previousArea = area;
    const previousProjects = projects.filter((project) => project.areaId === area.id);
    const previousTasks = tasks.filter((task) => task.areaId === area.id);
    setDeleteLoading(true);
    setActionState("saving");
    setAreas((prev) => prev.filter((item) => item.id !== area.id));
    setProjects((prev) =>
      prev.map((item) => (item.areaId === area.id ? { ...item, areaId: null } : item)),
    );
    setTasks((prev) =>
      prev.map((item) => (item.areaId === area.id ? { ...item, areaId: null } : item)),
    );
    navigate("/inbox");

    try {
      await api.areas.delete(area.id);
    } catch (err) {
      setAreas((prev) => {
        if (prev.some((item) => item.id === previousArea.id)) return prev;
        return [...prev, previousArea];
      });
      setProjects((prev) =>
        prev.map((item) => previousProjects.find((project) => project.id === item.id) ?? item),
      );
      setTasks((prev) =>
        prev.map((item) => previousTasks.find((task) => task.id === item.id) ?? item),
      );
      navigate(`/area/${area.id}`);
      setActionState("error");
      window.alert(err instanceof Error ? err.message : "Failed to delete area");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleRenameProject = async (projectId: string, name: string) => {
    const project = projects.find((item) => item.id === projectId);
    if (!project) return;

    const previousProject = project;
    const optimisticProject = { ...project, name, updatedAt: new Date().toISOString() };
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
    const project = projects.find((item) => item.id === projectId);
    if (!project) return;
    if (!window.confirm(`Delete project "${project.name}"? Tasks will become unassigned.`)) return;

    const previousProject = project;
    const previousTasks = tasks.filter((task) => task.projectId === projectId);
    setBusyProjectId(projectId);
    setProjects((prev) => prev.filter((item) => item.id !== projectId));
    setTasks((prev) =>
      prev.map((item) => (item.projectId === projectId ? { ...item, projectId: null } : item)),
    );

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
      window.alert(err instanceof Error ? err.message : "Failed to delete project");
    } finally {
      setBusyProjectId((current) => (current === projectId ? null : current));
    }
  };

  return (
    <div className="flex h-full flex-1">
      <div className={`flex-1 overflow-y-auto ${selectedTaskId ? "lg:mr-[45rem]" : ""}`}>
        <div className="mx-auto max-w-[72rem] px-5 py-8 sm:px-6 sm:py-[4rem]">
          <div className="mb-8 flex flex-col gap-4 sm:items-start sm:justify-between lg:flex-row">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
                Area
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{areaName}</h1>
                {actionState !== "idle" && (
                  <span
                    className={`rounded-full px-[1rem] py-[0.5rem] text-[1.1rem] leading-none ${
                      actionState === "saving"
                        ? "bg-sky-500/15 text-sky-700 dark:text-sky-300"
                        : actionState === "saved"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                          : "bg-destructive/15 text-destructive"
                    }`}
                  >
                    {actionState === "saving"
                      ? "Updating"
                      : actionState === "saved"
                        ? "Updated"
                        : "Not saved"}
                  </span>
                )}
              </div>
              <p className="mt-2 max-w-[42rem] text-sm text-muted-foreground">
                Organize related projects and direct area-level work without losing visibility.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-start">
              <RenameEntityButton
                currentName={areaName}
                entityLabel="Area"
                loading={renameLoading}
                onRename={handleRename}
                iconOnly
                className="h-[3.4rem] w-[3.4rem] p-0"
              />
              <CreateProjectButton label="New Project" areaId={id} variant="outline" size="sm" />
              <Button
                onClick={handleDelete}
                variant="destructive"
                size="icon"
                disabled={deleteLoading}
                aria-label="Delete area"
                className="h-[3.4rem] w-[3.4rem]"
              >
                <TrashIcon size={14} className={deleteLoading ? "opacity-40" : ""} />
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="mb-8">
              <h2 className="mb-3 text-lg font-semibold">Projects</h2>
              <div className="grid gap-3 lg:grid-cols-2">
                <div className="skeleton h-[8.8rem] rounded-[1.4rem]" />
                <div className="skeleton h-[8.8rem] rounded-[1.4rem]" />
              </div>
            </div>
          ) : (
            projects.length > 0 && (
              <div className="mb-8">
                <h2 className="mb-3 text-lg font-semibold">Projects</h2>
                <div className="grid gap-3 lg:grid-cols-2">
                  {projects.map((project) => (
                    <div key={project.id} className="soft-panel rounded-[1.4rem] p-4">
                      <div className="flex items-start justify-between gap-4">
                        <Link
                          to={`/project/${project.id}`}
                          className="flex min-w-0 flex-1 items-center gap-3 transition-colors hover:text-accent-foreground"
                        >
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
                            <img
                              src="/icons/clipboard-document-list.svg"
                              alt=""
                              className="h-4 w-4 opacity-70 dark:invert dark:opacity-90"
                            />
                          </span>
                          <span className="truncate font-medium">{project.name}</span>
                        </Link>
                        <div className="flex flex-wrap items-center gap-2">
                          <RenameEntityButton
                            currentName={project.name}
                            entityLabel="Project"
                            loading={busyProjectId === project.id}
                            onRename={(name) => handleRenameProject(project.id, name)}
                            iconOnly
                            size="sm"
                            variant="outline"
                            className="h-[3.4rem] w-[3.4rem] p-0"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            disabled={busyProjectId === project.id}
                            aria-label="Delete project"
                            className="h-[3.4rem] w-[3.4rem]"
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
              </div>
            )
          )}

          <div>
            <h2 className="mb-3 text-lg font-semibold">Tasks</h2>
            {isLoading ? (
              <div className="panel overflow-hidden rounded-[1.6rem]">
                <div className="skeleton h-[5.6rem] border-b border-border/70" />
                <div className="skeleton h-[5.6rem] border-b border-border/70" />
                <div className="skeleton h-[5.6rem] border-b border-border/70" />
                <div className="skeleton h-[5.6rem]" />
              </div>
            ) : (
              <TaskList tasks={tasks} areaId={id} emptyMessage="No tasks in this area" />
            )}
          </div>
        </div>
      </div>
      {selectedTaskId && <TaskDetailPanel />}
    </div>
  );
}
