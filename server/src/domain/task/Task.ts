import type { TaskStatus, TaskPriority, TaskDurationUnit } from "@kairos/shared";
import { Entity, UniqueId, Result } from "../shared/index.js";
import {
  TaskCreated,
  TaskCompleted,
  TaskReopened,
  TaskUpdated,
  TaskAssignedToProject,
  TaskAssignedToArea,
  TaskMovedToInbox,
} from "./TaskDomainEvents.js";

interface TaskProps {
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  parentTaskId: string | null;
  projectId: string | null;
  areaId: string | null;
  userId: string;
  dueDate: Date | null;
  duration: number | null;
  durationUnit: TaskDurationUnit | null;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Task extends Entity<TaskProps> {
  private constructor(props: TaskProps, id?: UniqueId) {
    super(props, id);
  }

  static create(
    title: string,
    userId: string,
    opts: {
      description?: string;
      priority?: TaskPriority;
      projectId?: string;
      areaId?: string;
      parentTaskId?: string;
      dueDate?: Date;
      duration?: number;
      durationUnit?: TaskDurationUnit;
      id?: string;
    } = {},
  ): Result<Task, string> {
    const trimmed = title.trim();
    if (trimmed.length === 0) {
      return Result.fail("Task title cannot be empty");
    }
    // A subtask cannot also own a project or area
    if (opts.parentTaskId && (opts.projectId || opts.areaId)) {
      return Result.fail("A subtask cannot be directly assigned to a project or area");
    }
    // A task cannot belong to both a project and an area
    if (opts.projectId && opts.areaId) {
      return Result.fail("A task cannot belong to both a project and an area");
    }
    if ((opts.duration === undefined) !== (opts.durationUnit === undefined)) {
      return Result.fail("Duration and duration unit must be provided together");
    }
    if (opts.duration !== undefined && (!Number.isInteger(opts.duration) || opts.duration <= 0)) {
      return Result.fail("Duration must be a positive integer");
    }

    const task = new Task(
      {
        title: trimmed,
        description: opts.description ?? null,
        status: "todo",
        priority: opts.priority ?? 4,
        parentTaskId: opts.parentTaskId ?? null,
        projectId: opts.projectId ?? null,
        areaId: opts.areaId ?? null,
        userId,
        dueDate: opts.dueDate ?? null,
        duration: opts.duration ?? null,
        durationUnit: opts.durationUnit ?? null,
        position: Date.now() / 1000,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      opts.id ? new UniqueId(opts.id) : undefined,
    );
    task.addDomainEvent(new TaskCreated(task.id, trimmed, userId));
    return Result.ok(task);
  }

  static reconstitute(id: string, props: TaskProps): Task {
    return new Task(props, new UniqueId(id));
  }

  // ── Getters ──────────────────────────────────────────────────────────
  get title(): string {
    return this.props.title;
  }
  get description(): string | null {
    return this.props.description;
  }
  get status(): TaskStatus {
    return this.props.status;
  }
  get priority(): TaskPriority {
    return this.props.priority;
  }
  get parentTaskId(): string | null {
    return this.props.parentTaskId;
  }
  get projectId(): string | null {
    return this.props.projectId;
  }
  get areaId(): string | null {
    return this.props.areaId;
  }
  get userId(): string {
    return this.props.userId;
  }
  get dueDate(): Date | null {
    return this.props.dueDate;
  }
  get duration(): number | null {
    return this.props.duration;
  }
  get durationUnit(): TaskDurationUnit | null {
    return this.props.durationUnit;
  }
  get position(): number {
    return this.props.position;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // ── Domain Queries ────────────────────────────────────────────────────
  isSubtask(): boolean {
    return this.props.parentTaskId !== null;
  }

  isInInbox(): boolean {
    return (
      this.props.parentTaskId === null &&
      this.props.projectId === null &&
      this.props.areaId === null
    );
  }

  // ── Commands ──────────────────────────────────────────────────────────
  complete(): Result<void, string> {
    if (this.props.status === "done") {
      return Result.fail("Task is already completed");
    }
    this.props.status = "done";
    this.props.updatedAt = new Date();
    this.addDomainEvent(new TaskCompleted(this.id));
    return Result.ok(undefined);
  }

  reopen(): Result<void, string> {
    if (this.props.status !== "done") {
      return Result.fail("Task is not completed");
    }
    this.props.status = "todo";
    this.props.updatedAt = new Date();
    this.addDomainEvent(new TaskReopened(this.id));
    return Result.ok(undefined);
  }

  updateTitle(title: string): Result<void, string> {
    const trimmed = title.trim();
    if (trimmed.length === 0) {
      return Result.fail("Task title cannot be empty");
    }
    this.props.title = trimmed;
    this.props.updatedAt = new Date();
    this.addDomainEvent(new TaskUpdated(this.id));
    return Result.ok(undefined);
  }

  updateDescription(description: string | null): void {
    this.props.description = description;
    this.props.updatedAt = new Date();
    this.addDomainEvent(new TaskUpdated(this.id));
  }

  updatePriority(priority: TaskPriority): void {
    this.props.priority = priority;
    this.props.updatedAt = new Date();
    this.addDomainEvent(new TaskUpdated(this.id));
  }

  updateDueDate(dueDate: Date | null): void {
    this.props.dueDate = dueDate;
    this.props.updatedAt = new Date();
    this.addDomainEvent(new TaskUpdated(this.id));
  }

  updateDuration(
    duration: number | null,
    durationUnit: TaskDurationUnit | null,
  ): Result<void, string> {
    if ((duration === null) !== (durationUnit === null)) {
      return Result.fail("Duration and duration unit must be provided together");
    }
    if (duration !== null && (!Number.isInteger(duration) || duration <= 0)) {
      return Result.fail("Duration must be a positive integer");
    }

    this.props.duration = duration;
    this.props.durationUnit = durationUnit;
    this.props.updatedAt = new Date();
    this.addDomainEvent(new TaskUpdated(this.id));
    return Result.ok(undefined);
  }

  assignToProject(projectId: string): Result<void, string> {
    if (this.isSubtask()) {
      return Result.fail("A subtask cannot be directly assigned to a project");
    }
    this.props.projectId = projectId;
    this.props.areaId = null;
    this.props.updatedAt = new Date();
    this.addDomainEvent(new TaskAssignedToProject(this.id, projectId));
    return Result.ok(undefined);
  }

  assignToArea(areaId: string): Result<void, string> {
    if (this.isSubtask()) {
      return Result.fail("A subtask cannot be directly assigned to an area");
    }
    this.props.areaId = areaId;
    this.props.projectId = null;
    this.props.updatedAt = new Date();
    this.addDomainEvent(new TaskAssignedToArea(this.id, areaId));
    return Result.ok(undefined);
  }

  moveToInbox(): Result<void, string> {
    if (this.isSubtask()) {
      return Result.fail("A subtask cannot be moved to inbox — remove it from its parent first");
    }
    this.props.projectId = null;
    this.props.areaId = null;
    this.props.updatedAt = new Date();
    this.addDomainEvent(new TaskMovedToInbox(this.id));
    return Result.ok(undefined);
  }

  setPosition(position: number): void {
    this.props.position = position;
    this.props.updatedAt = new Date();
    this.addDomainEvent(new TaskUpdated(this.id));
  }

  /**
   * Validates that this task CAN be a parent (i.e. it is not itself a subtask).
   * The actual subtask creation is done via Task.create() with parentTaskId.
   * This method is used by the application layer before persisting.
   */
  canHaveSubtask(): Result<void, string> {
    if (this.isSubtask()) {
      return Result.fail("Subtasks cannot have children — only one level of nesting is allowed");
    }
    return Result.ok(undefined);
  }
}
