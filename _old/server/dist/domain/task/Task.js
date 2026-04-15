import { Entity, UniqueId, Result } from "../shared/index.js";
import { TaskCreated, TaskCompleted, TaskReopened, TaskUpdated, TaskAssignedToProject, TaskAssignedToArea, TaskMovedToInbox, } from "./TaskDomainEvents.js";
export class Task extends Entity {
    constructor(props, id) {
        super(props, id);
    }
    static create(title, userId, opts = {}) {
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
        const task = new Task({
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
            tags: opts.tags ? [...opts.tags] : [],
            position: Date.now() / 1000,
            createdAt: new Date(),
            updatedAt: new Date(),
        }, opts.id ? new UniqueId(opts.id) : undefined);
        task.addDomainEvent(new TaskCreated(task.id, trimmed, userId));
        return Result.ok(task);
    }
    static reconstitute(id, props) {
        return new Task(props, new UniqueId(id));
    }
    // ── Getters ──────────────────────────────────────────────────────────
    get title() {
        return this.props.title;
    }
    get description() {
        return this.props.description;
    }
    get status() {
        return this.props.status;
    }
    get priority() {
        return this.props.priority;
    }
    get parentTaskId() {
        return this.props.parentTaskId;
    }
    get projectId() {
        return this.props.projectId;
    }
    get areaId() {
        return this.props.areaId;
    }
    get userId() {
        return this.props.userId;
    }
    get dueDate() {
        return this.props.dueDate;
    }
    get duration() {
        return this.props.duration;
    }
    get durationUnit() {
        return this.props.durationUnit;
    }
    get tags() {
        return this.props.tags;
    }
    get position() {
        return this.props.position;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    // ── Domain Queries ────────────────────────────────────────────────────
    isSubtask() {
        return this.props.parentTaskId !== null;
    }
    isInInbox() {
        return (this.props.parentTaskId === null &&
            this.props.projectId === null &&
            this.props.areaId === null);
    }
    // ── Commands ──────────────────────────────────────────────────────────
    complete() {
        if (this.props.status === "done") {
            return Result.fail("Task is already completed");
        }
        this.props.status = "done";
        this.props.updatedAt = new Date();
        this.addDomainEvent(new TaskCompleted(this.id));
        return Result.ok(undefined);
    }
    reopen() {
        if (this.props.status !== "done") {
            return Result.fail("Task is not completed");
        }
        this.props.status = "todo";
        this.props.updatedAt = new Date();
        this.addDomainEvent(new TaskReopened(this.id));
        return Result.ok(undefined);
    }
    updateTitle(title) {
        const trimmed = title.trim();
        if (trimmed.length === 0) {
            return Result.fail("Task title cannot be empty");
        }
        this.props.title = trimmed;
        this.props.updatedAt = new Date();
        this.addDomainEvent(new TaskUpdated(this.id));
        return Result.ok(undefined);
    }
    updateDescription(description) {
        this.props.description = description;
        this.props.updatedAt = new Date();
        this.addDomainEvent(new TaskUpdated(this.id));
    }
    updatePriority(priority) {
        this.props.priority = priority;
        this.props.updatedAt = new Date();
        this.addDomainEvent(new TaskUpdated(this.id));
    }
    updateDueDate(dueDate) {
        this.props.dueDate = dueDate;
        this.props.updatedAt = new Date();
        this.addDomainEvent(new TaskUpdated(this.id));
    }
    updateDuration(duration, durationUnit) {
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
    updateTags(tags) {
        this.props.tags = [...tags];
        this.props.updatedAt = new Date();
        this.addDomainEvent(new TaskUpdated(this.id));
    }
    assignToProject(projectId) {
        if (this.isSubtask()) {
            return Result.fail("A subtask cannot be directly assigned to a project");
        }
        this.props.projectId = projectId;
        this.props.areaId = null;
        this.props.updatedAt = new Date();
        this.addDomainEvent(new TaskAssignedToProject(this.id, projectId));
        return Result.ok(undefined);
    }
    assignToArea(areaId) {
        if (this.isSubtask()) {
            return Result.fail("A subtask cannot be directly assigned to an area");
        }
        this.props.areaId = areaId;
        this.props.projectId = null;
        this.props.updatedAt = new Date();
        this.addDomainEvent(new TaskAssignedToArea(this.id, areaId));
        return Result.ok(undefined);
    }
    moveToInbox() {
        if (this.isSubtask()) {
            return Result.fail("A subtask cannot be moved to inbox — remove it from its parent first");
        }
        this.props.projectId = null;
        this.props.areaId = null;
        this.props.updatedAt = new Date();
        this.addDomainEvent(new TaskMovedToInbox(this.id));
        return Result.ok(undefined);
    }
    setPosition(position) {
        this.props.position = position;
        this.props.updatedAt = new Date();
        this.addDomainEvent(new TaskUpdated(this.id));
    }
    /**
     * Validates that this task CAN be a parent (i.e. it is not itself a subtask).
     * The actual subtask creation is done via Task.create() with parentTaskId.
     * This method is used by the application layer before persisting.
     */
    canHaveSubtask() {
        if (this.isSubtask()) {
            return Result.fail("Subtasks cannot have children — only one level of nesting is allowed");
        }
        return Result.ok(undefined);
    }
}
//# sourceMappingURL=Task.js.map