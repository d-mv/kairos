import { useParams } from "react-router-dom";
import { useAtomValue } from "jotai";
import { tasksByProjectAtom, selectedTaskIdAtom } from "../atoms/tasks.js";
import { projectsAtom } from "../atoms/projects.js";
import { TaskList } from "../components/TaskList.js";
import { TaskDetailPanel } from "../components/TaskDetailPanel.js";
import { api } from "../lib/api.js";
import { useSetAtom } from "jotai";
import { projectsAtom as projAtom } from "../atoms/projects.js";
import { tasksAtom } from "../atoms/tasks.js";
import { Button } from "../components/ui/button.js";

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const projects = useAtomValue(projectsAtom);
  const tasksByProject = useAtomValue(tasksByProjectAtom);
  const selectedTaskId = useAtomValue(selectedTaskIdAtom);
  const setProjects = useSetAtom(projAtom);
  const setTasks = useSetAtom(tasksAtom);

  const project = projects.find((p) => p.id === id);
  const tasks = id ? (tasksByProject.get(id) ?? []) : [];

  if (!project) {
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

  return (
    <div className="flex h-full flex-1">
      <div className={`flex-1 overflow-y-auto ${selectedTaskId ? "mr-[28rem]" : ""}`}>
        <div className="mx-auto max-w-4xl px-6 py-10">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
                Project
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight">{project.name}</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Plan the work, group related tasks, and promote or demote structure when needed.
              </p>
            </div>
            <Button onClick={handleDemote} variant="outline" size="sm">
              Demote to Task
            </Button>
          </div>
          <TaskList tasks={tasks} projectId={id} emptyMessage="No tasks yet" />
        </div>
      </div>
      {selectedTaskId && <TaskDetailPanel />}
    </div>
  );
}
