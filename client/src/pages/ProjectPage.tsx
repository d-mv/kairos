import { useParams, useNavigate } from "react-router-dom";
import { useAtomValue } from "jotai";
import { tasksByProjectAtom, selectedTaskIdAtom } from "../atoms/tasks.js";
import { projectsAtom } from "../atoms/projects.js";
import { areasAtom } from "../atoms/areas.js";
import { workspaceLoadingAtom } from "../atoms/workspace.js";
import { TaskList } from "../components/TaskList.js";
import { TaskDetailPanel } from "../components/TaskDetailPanel.js";
import { api } from "../lib/api.js";
import { useSetAtom } from "jotai";
import { projectsAtom as projAtom } from "../atoms/projects.js";
import { tasksAtom } from "../atoms/tasks.js";
import { Button } from "../components/ui/button.js";
import { RenameEntityButton } from "../components/RenameEntityButton.js";
import { Select } from "../components/ui/select.js";
import { TrashIcon } from "../components/ui/icons.js";
import { useState } from "react";

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const projects = useAtomValue(projectsAtom);
  const areas = useAtomValue(areasAtom);
  const tasksByProject = useAtomValue(tasksByProjectAtom);
  const isLoading = useAtomValue(workspaceLoadingAtom);
  const selectedTaskId = useAtomValue(selectedTaskIdAtom);
  const setProjects = useSetAtom(projAtom);
  const setTasks = useSetAtom(tasksAtom);
  const [renameLoading, setRenameLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [moveLoading, setMoveLoading] = useState(false);
  const [actionState, setActionState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const project = projects.find((p) => p.id === id);
  const tasks = id ? (tasksByProject.get(id) ?? []) : [];
  const projectName = project?.name ?? "Project";

  if (!project && !isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    );
  }

  const handleDemote = async () => {
    if (!id) return;
    try {
      const task = await api.projects.demote(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setTasks((prev) => [...prev.filter((t) => t.projectId !== id), task]);
      window.location.href = "/inbox";
    } catch (err) {
      console.error("Failed to demote project", err);
      alert((err as Error).message);
    }
  };

  const handleRename = async (name: string) => {
    if (!project) return;
    const previousProject = project;
    const optimisticProject = { ...project, name, updatedAt: new Date().toISOString() };
    setRenameLoading(true);
    setActionState("saving");
    setProjects((prev) => prev.map((item) => (item.id === project.id ? optimisticProject : item)));
    try {
      const updated = await api.projects.update(project.id, { name });
      setProjects((prev) => prev.map((item) => (item.id === project.id ? updated : item)));
      setActionState("saved");
    } catch (err) {
      setProjects((prev) => prev.map((item) => (item.id === project.id ? previousProject : item)));
      setActionState("error");
      throw err instanceof Error ? err : new Error("Failed to rename project");
    } finally {
      setRenameLoading(false);
      window.setTimeout(() => setActionState("idle"), 1500);
    }
  };

  const handleDelete = async () => {
    if (!project) return;
    if (!window.confirm(`Delete project "${project.name}"? Tasks will become unassigned.`)) return;

    const previousProject = project;
    const previousTasks = tasks.filter((task) => task.projectId === project.id);
    setDeleteLoading(true);
    setActionState("saving");
    setProjects((prev) => prev.filter((item) => item.id !== project.id));
    setTasks((prev) =>
      prev.map((item) => (item.projectId === project.id ? { ...item, projectId: null } : item)),
    );
    navigate("/inbox");

    try {
      await api.projects.delete(project.id);
    } catch (err) {
      setProjects((prev) => {
        if (prev.some((item) => item.id === previousProject.id)) return prev;
        return [...prev, previousProject];
      });
      setTasks((prev) =>
        prev.map((item) => {
          const previousTask = previousTasks.find((task) => task.id === item.id);
          return previousTask ?? item;
        }),
      );
      navigate(`/project/${project.id}`);
      setActionState("error");
      window.alert(err instanceof Error ? err.message : "Failed to delete project");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleMoveToArea = async (nextAreaId: string) => {
    if (!project) return;

    const areaId = nextAreaId || null;
    if (project.areaId === areaId) return;

    const previousProject = project;
    const optimisticProject = { ...project, areaId, updatedAt: new Date().toISOString() };

    setMoveLoading(true);
    setActionState("saving");
    setProjects((prev) => prev.map((item) => (item.id === project.id ? optimisticProject : item)));

    try {
      const updated = await api.projects.update(project.id, { areaId });
      setProjects((prev) => prev.map((item) => (item.id === project.id ? updated : item)));
      setActionState("saved");
    } catch (err) {
      setProjects((prev) => prev.map((item) => (item.id === project.id ? previousProject : item)));
      setActionState("error");
      window.alert(err instanceof Error ? err.message : "Failed to move project");
    } finally {
      setMoveLoading(false);
      window.setTimeout(() => setActionState("idle"), 1500);
    }
  };

  return (
    <div className="flex h-full flex-1">
      <div className={`flex-1 overflow-y-auto ${selectedTaskId ? "lg:mr-[45rem]" : ""}`}>
        <div className="mx-auto max-w-[72rem] px-5 py-8 sm:px-6 sm:py-[4rem]">
          <div className="mb-8 flex flex-col gap-4 sm:items-start sm:justify-between lg:flex-row">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
                Project
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{projectName}</h1>
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
                Plan the work, group related tasks, and promote or demote structure when needed.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-start">
              <Select
                value={project?.areaId ?? ""}
                onChange={(e) => {
                  void handleMoveToArea(e.target.value);
                }}
                className="min-w-[16rem]"
                disabled={deleteLoading || moveLoading}
              >
                <option value="">Unassigned</option>
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </Select>
              <RenameEntityButton
                currentName={projectName}
                entityLabel="Project"
                loading={renameLoading}
                onRename={handleRename}
                iconOnly
                className="h-[3.4rem] w-[3.4rem] p-0"
              />
              <Button
                onClick={handleDemote}
                variant="outline"
                size="sm"
                className="self-start"
                disabled={deleteLoading}
              >
                Demote to Task
              </Button>
              <Button
                onClick={handleDelete}
                variant="destructive"
                size="icon"
                disabled={deleteLoading}
                aria-label="Delete project"
                className="h-[3.4rem] w-[3.4rem]"
              >
                <TrashIcon size={14} className={deleteLoading ? "opacity-40" : ""} />
              </Button>
            </div>
          </div>
          {isLoading ? (
            <div className="panel overflow-hidden rounded-[1.6rem]">
              <div className="skeleton h-[5.6rem] border-b border-border/70" />
              <div className="skeleton h-[5.6rem] border-b border-border/70" />
              <div className="skeleton h-[5.6rem] border-b border-border/70" />
              <div className="skeleton h-[5.6rem]" />
            </div>
          ) : (
            <TaskList tasks={tasks} projectId={id} emptyMessage="No tasks yet" />
          )}
        </div>
      </div>
      {selectedTaskId && <TaskDetailPanel />}
    </div>
  );
}
