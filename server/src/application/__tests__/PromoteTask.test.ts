import { describe, it, expect, beforeEach } from 'vitest';
import { PromoteTask } from '../task/PromoteTask.js';
import { CreateTask } from '../task/CreateTask.js';
import { InMemoryTaskRepository, InMemoryProjectRepository, SpyEventBus } from './mocks.js';

describe('PromoteTask use case', () => {
  let taskRepo: InMemoryTaskRepository;
  let projectRepo: InMemoryProjectRepository;
  let eventBus: SpyEventBus;
  let promoteTask: PromoteTask;
  let createTask: CreateTask;

  beforeEach(() => {
    taskRepo = new InMemoryTaskRepository();
    projectRepo = new InMemoryProjectRepository();
    eventBus = new SpyEventBus();
    promoteTask = new PromoteTask(taskRepo, projectRepo, eventBus);
    createTask = new CreateTask(taskRepo, eventBus);
  });

  it('promotes a task to a project', async () => {
    const taskResult = await createTask.execute({ title: 'Epic feature', userId: 'u1' });
    const taskId = taskResult.value.id;
    eventBus.reset();

    const result = await promoteTask.execute(taskId, 'u1');
    expect(result.isOk).toBe(true);
    const project = result.value;
    expect(project.name).toBe('Epic feature');
  });

  it('removes the original task', async () => {
    const taskResult = await createTask.execute({ title: 'T', userId: 'u1' });
    const taskId = taskResult.value.id;
    await promoteTask.execute(taskId, 'u1');
    const found = taskRepo.store.get(taskId);
    expect(found).toBeUndefined();
  });

  it('converts subtasks to project tasks', async () => {
    const parentResult = await createTask.execute({ title: 'Epic', userId: 'u1' });
    const parentId = parentResult.value.id;
    await createTask.execute({ title: 'Sub A', userId: 'u1', parentTaskId: parentId });
    await createTask.execute({ title: 'Sub B', userId: 'u1', parentTaskId: parentId });

    const result = await promoteTask.execute(parentId, 'u1');
    const projectId = result.value.id;

    const projectTasks = [...taskRepo.store.values()].filter(
      t => t.projectId === projectId,
    );
    expect(projectTasks).toHaveLength(2);
    expect(projectTasks.map(t => t.title).sort()).toEqual(['Sub A', 'Sub B']);
  });

  it('keeps duration fields when converting subtasks', async () => {
    const parentResult = await createTask.execute({ title: 'Epic', userId: 'u1' });
    const parentId = parentResult.value.id;
    await createTask.execute({
      title: 'Sub A',
      userId: 'u1',
      parentTaskId: parentId,
      duration: 2,
      durationUnit: 'd',
    });

    const result = await promoteTask.execute(parentId, 'u1');
    const projectId = result.value.id;
    const projectTask = [...taskRepo.store.values()].find(t => t.projectId === projectId);
    expect(projectTask?.duration).toBe(2);
    expect(projectTask?.durationUnit).toBe('d');
  });

  it('fails if task not found', async () => {
    const result = await promoteTask.execute('nonexistent', 'u1');
    expect(result.isErr).toBe(true);
  });

  it('fails if task is a subtask', async () => {
    const parent = await createTask.execute({ title: 'Parent', userId: 'u1' });
    const subtask = await createTask.execute({
      title: 'Sub',
      userId: 'u1',
      parentTaskId: parent.value.id,
    });
    const result = await promoteTask.execute(subtask.value.id, 'u1');
    expect(result.isErr).toBe(true);
  });
});
