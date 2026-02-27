import { describe, it, expect, beforeEach } from 'vitest';
import { CreateTask } from '../task/CreateTask.js';
import { InMemoryTaskRepository, SpyEventBus } from './mocks.js';

describe('CreateTask use case', () => {
  let taskRepo: InMemoryTaskRepository;
  let eventBus: SpyEventBus;
  let createTask: CreateTask;

  beforeEach(() => {
    taskRepo = new InMemoryTaskRepository();
    eventBus = new SpyEventBus();
    createTask = new CreateTask(taskRepo, eventBus);
  });

  it('creates a task in inbox', async () => {
    const result = await createTask.execute({ title: 'Buy milk', userId: 'u1' });
    expect(result.isOk).toBe(true);
    const dto = result.value;
    expect(dto.title).toBe('Buy milk');
    expect(dto.projectId).toBeNull();
    expect(dto.areaId).toBeNull();
    expect(dto.parentTaskId).toBeNull();
  });

  it('creates task with duration fields', async () => {
    const result = await createTask.execute({
      title: 'Estimate',
      userId: 'u1',
      duration: 4,
      durationUnit: 'h',
    });
    expect(result.isOk).toBe(true);
    expect(result.value.duration).toBe(4);
    expect(result.value.durationUnit).toBe('h');
  });

  it('persists the task', async () => {
    const result = await createTask.execute({ title: 'T', userId: 'u1' });
    const stored = taskRepo.store.get(result.value.id);
    expect(stored).toBeDefined();
  });

  it('publishes domain events', async () => {
    await createTask.execute({ title: 'T', userId: 'u1' });
    expect(eventBus.published).toHaveLength(1);
    expect(eventBus.published[0]!.eventName).toBe('task.created');
  });

  it('fails on empty title', async () => {
    const result = await createTask.execute({ title: '', userId: 'u1' });
    expect(result.isErr).toBe(true);
  });

  it('creates a subtask when parent exists', async () => {
    const parentResult = await createTask.execute({ title: 'Parent', userId: 'u1' });
    const parentId = parentResult.value.id;

    eventBus.reset();
    const subtaskResult = await createTask.execute({
      title: 'Subtask',
      userId: 'u1',
      parentTaskId: parentId,
    });
    expect(subtaskResult.isOk).toBe(true);
    expect(subtaskResult.value.parentTaskId).toBe(parentId);
  });

  it('rejects subtask creation if parent is itself a subtask', async () => {
    const parent = await createTask.execute({ title: 'Parent', userId: 'u1' });
    const subtask = await createTask.execute({
      title: 'Subtask',
      userId: 'u1',
      parentTaskId: parent.value.id,
    });

    const deepSubtask = await createTask.execute({
      title: 'Deep',
      userId: 'u1',
      parentTaskId: subtask.value.id,
    });
    expect(deepSubtask.isErr).toBe(true);
  });

  it('fails if parentTaskId not found', async () => {
    const result = await createTask.execute({
      title: 'T',
      userId: 'u1',
      parentTaskId: 'nonexistent',
    });
    expect(result.isErr).toBe(true);
    expect(result.error).toMatch(/not found/);
  });
});
