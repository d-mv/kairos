import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { areasAtom } from '../atoms/areas.js';
import { projectsByAreaAtom } from '../atoms/projects.js';
import { tasksByAreaAtom, selectedTaskIdAtom } from '../atoms/tasks.js';
import { TaskList } from '../components/TaskList.js';
import { TaskDetailPanel } from '../components/TaskDetailPanel.js';

export default function AreaPage() {
  const { id } = useParams<{ id: string }>();
  const areas = useAtomValue(areasAtom);
  const projectsByArea = useAtomValue(projectsByAreaAtom);
  const tasksByArea = useAtomValue(tasksByAreaAtom);
  const selectedTaskId = useAtomValue(selectedTaskIdAtom);

  const area = areas.find(a => a.id === id);
  const projects = id ? (projectsByArea.get(id) ?? []) : [];
  const tasks = id ? (tasksByArea.get(id) ?? []) : [];

  if (!area) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Area not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 h-full">
      <div className={`flex-1 overflow-y-auto ${selectedTaskId ? 'mr-96' : ''}`}>
        <div className="max-w-2xl mx-auto py-8 px-4">
          <h1 className="text-2xl font-bold mb-6">{area.name}</h1>

          {/* Projects in this area */}
          {projects.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-3">Projects</h2>
              <div className="grid gap-2">
                {projects.map(project => (
                  <Link
                    key={project.id}
                    to={`/project/${project.id}`}
                    className="flex items-center gap-3 p-3 border border-border rounded-md hover:bg-accent transition-colors"
                  >
                    <span>📋</span>
                    <span className="font-medium">{project.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Tasks directly in this area */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Tasks</h2>
            <TaskList tasks={tasks} areaId={id} emptyMessage="No tasks in this area" />
          </div>
        </div>
      </div>
      {selectedTaskId && <TaskDetailPanel />}
    </div>
  );
}
