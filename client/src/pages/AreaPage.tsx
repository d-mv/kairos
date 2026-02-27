import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { useAtomValue } from "jotai";
import { areasAtom } from "../atoms/areas.js";
import { projectsByAreaAtom } from "../atoms/projects.js";
import { tasksByAreaAtom, selectedTaskIdAtom } from "../atoms/tasks.js";
import { TaskList } from "../components/TaskList.js";
import { TaskDetailPanel } from "../components/TaskDetailPanel.js";
import { CreateProjectButton } from "../components/CreateProjectButton.js";

export default function AreaPage() {
  const { id } = useParams<{ id: string }>();
  const areas = useAtomValue(areasAtom);
  const projectsByArea = useAtomValue(projectsByAreaAtom);
  const tasksByArea = useAtomValue(tasksByAreaAtom);
  const selectedTaskId = useAtomValue(selectedTaskIdAtom);

  const area = areas.find((a) => a.id === id);
  const projects = id ? (projectsByArea.get(id) ?? []) : [];
  const tasks = id ? (tasksByArea.get(id) ?? []) : [];

  if (!area) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Area not found</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1">
      <div className={`flex-1 overflow-y-auto ${selectedTaskId ? "mr-[28rem]" : ""}`}>
        <div className="mx-auto max-w-4xl px-6 py-10">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
                Area
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight">{area.name}</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Organize related projects and direct area-level work without losing visibility.
              </p>
            </div>
            <CreateProjectButton label="New Project" areaId={id} variant="outline" size="sm" />
          </div>

          {projects.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-3 text-lg font-semibold">Projects</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {projects.map((project) => (
                  <Link
                    key={project.id}
                    to={`/project/${project.id}`}
                    className="soft-panel flex items-center gap-3 rounded-[1.4rem] p-4 transition-colors hover:bg-accent/70"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-base">
                      #
                    </span>
                    <span className="font-medium">{project.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="mb-3 text-lg font-semibold">Tasks</h2>
            <TaskList tasks={tasks} areaId={id} emptyMessage="No tasks in this area" />
          </div>
        </div>
      </div>
      {selectedTaskId && <TaskDetailPanel />}
    </div>
  );
}
