import { useAtomValue, useSetAtom } from "jotai";
import { areasAtom } from "../atoms/areas.js";
import { inboxTasksAtom } from "../atoms/tasks.js";
import { workspaceLoadingAtom } from "../atoms/workspace.js";
import { CreateAreaButton } from "../components/CreateAreaButton.js";
import { RenameEntityButton } from "../components/RenameEntityButton.js";
import { TaskList } from "../components/TaskList.js";
import { TaskDetailPanel } from "../components/TaskDetailPanel.js";
import { selectedTaskIdAtom } from "../atoms/tasks.js";
import { Link } from "react-router-dom";
import { projectsAtom } from "../atoms/projects.js";
import { tasksAtom } from "../atoms/tasks.js";
import { api } from "../lib/api.js";
import { Button } from "../components/ui/button.js";
import { FolderIcon, TrashIcon } from "../components/ui/icons.js";
import { useState } from "react";

export default function InboxPage() {
  const areas = useAtomValue(areasAtom);
  const tasks = useAtomValue(inboxTasksAtom);
  const isLoading = useAtomValue(workspaceLoadingAtom);
  const selectedTaskId = useAtomValue(selectedTaskIdAtom);
  const setAreas = useSetAtom(areasAtom);
  const setProjects = useSetAtom(projectsAtom);
  const setTasks = useSetAtom(tasksAtom);
  const [busyAreaId, setBusyAreaId] = useState<string | null>(null);

  const handleRenameArea = async (areaId: string, name: string) => {
    const area = areas.find((item) => item.id === areaId);
    if (!area) return;

    const previousArea = area;
    const optimisticArea = { ...area, name, updatedAt: new Date().toISOString() };
    setBusyAreaId(areaId);
    setAreas((prev) => prev.map((item) => (item.id === areaId ? optimisticArea : item)));

    try {
      const updated = await api.areas.update(areaId, name);
      setAreas((prev) => prev.map((item) => (item.id === areaId ? updated : item)));
    } catch (err) {
      setAreas((prev) => prev.map((item) => (item.id === areaId ? previousArea : item)));
      throw err instanceof Error ? err : new Error("Failed to rename area");
    } finally {
      setBusyAreaId((current) => (current === areaId ? null : current));
    }
  };

  const handleDeleteArea = async (areaId: string) => {
    const area = areas.find((item) => item.id === areaId);
    if (!area) return;
    if (!window.confirm(`Delete area "${area.name}"? Projects and tasks will become unassigned.`)) {
      return;
    }

    const previousArea = area;
    const previousProjects: Array<{ id: string; areaId: string | null }> = [];
    const previousTasks: Array<{ id: string; areaId: string | null }> = [];

    setBusyAreaId(areaId);
    setAreas((prev) => prev.filter((item) => item.id !== areaId));
    setProjects((prev) =>
      prev.map((item) => {
        if (item.areaId !== areaId) return item;
        previousProjects.push({ id: item.id, areaId: item.areaId });
        return { ...item, areaId: null };
      }),
    );
    setTasks((prev) =>
      prev.map((item) => {
        if (item.areaId !== areaId) return item;
        previousTasks.push({ id: item.id, areaId: item.areaId });
        return { ...item, areaId: null };
      }),
    );

    try {
      await api.areas.delete(areaId);
    } catch (err) {
      setAreas((prev) => {
        if (prev.some((item) => item.id === previousArea.id)) return prev;
        return [...prev, previousArea];
      });
      setProjects((prev) =>
        prev.map((item) => {
          const previousProject = previousProjects.find((project) => project.id === item.id);
          return previousProject ? { ...item, areaId: previousProject.areaId } : item;
        }),
      );
      setTasks((prev) =>
        prev.map((item) => {
          const previousTask = previousTasks.find((task) => task.id === item.id);
          return previousTask ? { ...item, areaId: previousTask.areaId } : item;
        }),
      );
      window.alert(err instanceof Error ? err.message : "Failed to delete area");
    } finally {
      setBusyAreaId((current) => (current === areaId ? null : current));
    }
  };

  return (
    <div className="flex h-full flex-1">
      <div className={`flex-1 overflow-y-auto ${selectedTaskId ? "lg:mr-[45rem]" : ""}`}>
        <div className="mx-auto max-w-[72rem] px-[2.4rem] py-[4rem] sm:px-[3.2rem] sm:py-[4.8rem]">
          <div className="mb-8">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
              Overview
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Inbox</h1>
            <p className="mt-2 max-w-[42rem] text-sm text-muted-foreground">
              Capture fast, sort later, and keep the next action close to the top.
            </p>
          </div>

          <div className="mb-8">
            <div className="mb-3 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold tracking-tight">Areas</h2>
              <CreateAreaButton label="New Area" navigateToArea variant="outline" size="sm" />
            </div>
            {isLoading ? (
              <div className="grid gap-3 lg:grid-cols-2">
                <div className="skeleton h-[8.8rem] rounded-[1.4rem]" />
                <div className="skeleton h-[8.8rem] rounded-[1.4rem]" />
              </div>
            ) : areas.length > 0 ? (
              <div className="grid gap-3 lg:grid-cols-2">
                {areas.map((area) => (
                  <div key={area.id} className="soft-panel rounded-[1.4rem] p-4">
                    <div className="flex items-start justify-between gap-4">
                      <Link
                        to={`/area/${area.id}`}
                        className="flex min-w-0 flex-1 items-center gap-3 transition-colors hover:text-accent-foreground"
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-foreground/70">
                          <FolderIcon size={16} />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{area.name}</p>
                          <p className="mt-1 text-sm text-muted-foreground">Open area workspace</p>
                        </div>
                      </Link>
                      <div className="flex flex-wrap items-center gap-2">
                        <RenameEntityButton
                          currentName={area.name}
                          entityLabel="Area"
                          loading={busyAreaId === area.id}
                          onRename={(name) => handleRenameArea(area.id, name)}
                          iconOnly
                          size="sm"
                          variant="outline"
                          className="h-[3.4rem] w-[3.4rem] p-0"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          disabled={busyAreaId === area.id}
                          aria-label="Delete area"
                          className="h-[3.4rem] w-[3.4rem]"
                          onClick={() => {
                            void handleDeleteArea(area.id);
                          }}
                        >
                          <TrashIcon
                            size={14}
                            className={busyAreaId === area.id ? "opacity-40" : ""}
                          />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="soft-panel rounded-[1.4rem] p-5">
                <p className="text-sm text-muted-foreground">
                  No areas yet. Create one to group projects outside the inbox.
                </p>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="panel overflow-hidden rounded-[1.6rem]">
              <div className="skeleton h-[5.6rem] border-b border-border/70" />
              <div className="skeleton h-[5.6rem] border-b border-border/70" />
              <div className="skeleton h-[5.6rem] border-b border-border/70" />
              <div className="skeleton h-[5.6rem]" />
            </div>
          ) : (
            <TaskList tasks={tasks} emptyMessage="Your inbox is empty" />
          )}
        </div>
      </div>
      {selectedTaskId && <TaskDetailPanel />}
    </div>
  );
}
