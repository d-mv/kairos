import { useParams } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { tasksByProjectAtom, selectedTaskIdAtom } from '../atoms/tasks.js';
import { projectsAtom } from '../atoms/projects.js';
import { TaskList } from '../components/TaskList.js';
import { TaskDetailPanel } from '../components/TaskDetailPanel.js';
import { api } from '../lib/api.js';
import { useSetAtom } from 'jotai';
import { projectsAtom as projAtom } from '../atoms/projects.js';
import { tasksAtom } from '../atoms/tasks.js';

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const projects = useAtomValue(projectsAtom);
  const tasksByProject = useAtomValue(tasksByProjectAtom);
  const selectedTaskId = useAtomValue(selectedTaskIdAtom);
  const setProjects = useSetAtom(projAtom);
  const setTasks = useSetAtom(tasksAtom);

  const project = projects.find(p => p.id === id);
  const tasks = id ? (tasksByProject.get(id) ?? []) : [];

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    );
  }

  const handleDemote = async () => {
    if (!id) return;
    try {
      const task = await api.projects.demote(id);
      setProjects(prev => prev.filter(p => p.id !== id));
      setTasks(prev => [...prev.filter(t => t.projectId !== id), task]);
      window.location.href = '/inbox';
    } catch (err) {
      console.error('Failed to demote project', err);
      alert((err as Error).message);
    }
  };

  return (
    <div className="flex flex-1 h-full">
      <div className={`flex-1 overflow-y-auto ${selectedTaskId ? 'mr-96' : ''}`}>
        <div className="max-w-2xl mx-auto py-8 px-4">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <button
              onClick={handleDemote}
              className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-3 py-1"
            >
              Demote to Task
            </button>
          </div>
          <TaskList tasks={tasks} projectId={id} emptyMessage="No tasks yet" />
        </div>
      </div>
      {selectedTaskId && <TaskDetailPanel />}
    </div>
  );
}
