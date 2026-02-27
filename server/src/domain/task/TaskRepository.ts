import type { Task } from './Task.js';

export interface TaskRepository {
  findById(id: string, userId: string): Promise<Task | null>;
  findAll(userId: string): Promise<Task[]>;
  findByProjectId(projectId: string, userId: string): Promise<Task[]>;
  findByAreaId(areaId: string, userId: string): Promise<Task[]>;
  findInbox(userId: string): Promise<Task[]>;
  findSubtasks(parentTaskId: string, userId: string): Promise<Task[]>;
  save(task: Task): Promise<void>;
  delete(id: string, userId: string): Promise<void>;
}
