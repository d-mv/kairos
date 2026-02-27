export { Task } from './Task.js';
export type { TaskRepository } from './TaskRepository.js';
export {
  TaskCreated,
  TaskCompleted,
  TaskReopened,
  TaskUpdated,
  TaskAssignedToProject,
  TaskAssignedToArea,
  TaskMovedToInbox,
  SubtaskAdded,
} from './TaskDomainEvents.js';
