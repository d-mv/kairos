import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { areasAtom } from "../atoms/areas.js";
import { projectsAtom, projectsByAreaAtom } from "../atoms/projects.js";
import { selectedTaskIdAtom, tasksAtom, tasksByAreaAtom } from "../atoms/tasks.js";
import { workspaceLoadingAtom } from "../atoms/workspace.js";
import { AreaSettingsMenu } from "../components/AreaSettingsMenu.js";
import { NewProjectInput } from "../components/NewProjectInput.js";
import { TaskDetailPanel } from "../components/TaskDetailPanel/TaskDetailPanel.js";
import { TaskList } from "../components/TaskList.js";
import { ClipboardListIcon } from "../components/ui/icons.js";
import { api } from "../lib/api.js";

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
  const [actionState, setActionState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const actionResetTimeoutRef = useRef<number | null>(null);

  const scheduleActionReset = () => {
    if (actionResetTimeoutRef.current) {
      window.clearTimeout(actionResetTimeoutRef.current);
    }
    actionResetTimeoutRef.current = window.setTimeout(() => {
      setActionState("idle");
      actionResetTimeoutRef.current = null;
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (actionResetTimeoutRef.current) {
        window.clearTimeout(actionResetTimeoutRef.current);
      }
    };
  }, []);

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
      scheduleActionReset();
    }
  };

  const handleDelete = async () => {
    if (!area) return;
    const hasContents = projects.length > 0 || tasks.length > 0;
    if (
      hasContents &&
      !window.confirm(
        `Delete area "${area.name}"? Projects will become unassigned and direct area tasks will move to inbox.`,
      )
    ) {
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

  return (
    <div className="flex h-full flex-1">
      <div className={`flex-1 overflow-y-auto ${selectedTaskId ? "lg:mr-[46rem]" : ""}`}>
        <div className="mx-auto max-w-[98rem] px-8 py-10 sm:px-12">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[1rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">Area</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <h1 className="text-[3.2rem] font-semibold tracking-tight sm:text-[4.2rem]">
                  {areaName}
                </h1>
                {actionState !== "idle" && (
                  <span
                    className={`rounded-full px-3 py-1 text-[1rem] leading-none ${
                      actionState === "saving"
                        ? "bg-muted text-foreground"
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
            </div>
            <AreaSettingsMenu
              areaName={areaName}
              renameLoading={renameLoading}
              deleteLoading={deleteLoading}
              onRename={handleRename}
              onDelete={handleDelete}
            />
          </div>

          <div className="mb-8">
            <h2 className="mb-3 text-[2rem] font-semibold tracking-tight">Projects</h2>
            {isLoading ? (
              <div className="panel overflow-hidden rounded-2xl">
                <div className="skeleton h-[5.6rem]" />
                <div className="skeleton h-[5.6rem]" />
                <div className="skeleton h-[5.6rem]" />
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  {projects.map((project) => (
                    <Link
                      key={project.id}
                      to={`/project/${project.id}`}
                      className="soft-panel flex min-h-[4.8rem] items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-accent/40"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground/70">
                        <ClipboardListIcon size={16} />
                      </span>
                      <span className="truncate text-[1.55rem]">{project.name}</span>
                    </Link>
                  ))}
                </div>
                {projects.length === 0 ? (
                  <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No projects in this area
                  </p>
                ) : null}
                <div className="mt-3">
                  <NewProjectInput areaId={id} />
                </div>
              </>
            )}
          </div>

          <div>
            <h2 className="mb-3 text-[2rem] font-semibold tracking-tight">Tasks</h2>
            {isLoading ? (
              <div className="panel overflow-hidden rounded-2xl">
                <div className="skeleton h-[5.6rem]" />
                <div className="skeleton h-[5.6rem]" />
                <div className="skeleton h-[5.6rem]" />
                <div className="skeleton h-[5.6rem]" />
              </div>
            ) : (
              <TaskList tasks={tasks} areaId={id} emptyMessage="No tasks in this area" hideCompleted />
            )}
          </div>
        </div>
      </div>
      {selectedTaskId && <TaskDetailPanel />}
    </div>
  );
}
