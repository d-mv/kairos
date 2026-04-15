import { Entity, UniqueId, Result } from "../shared/index.js";
import { ProjectCompleted, ProjectCreated, ProjectMovedToArea, ProjectReopened, ProjectRenamed, } from "./ProjectDomainEvents.js";
export class Project extends Entity {
    constructor(props, id) {
        super(props, id);
    }
    static create(name, userId, areaId = null, id) {
        const trimmed = name.trim();
        if (trimmed.length === 0) {
            return Result.fail("Project name cannot be empty");
        }
        const project = new Project({
            name: trimmed,
            areaId,
            completedAt: null,
            userId,
            createdAt: new Date(),
            updatedAt: new Date(),
        }, id ? new UniqueId(id) : undefined);
        project.addDomainEvent(new ProjectCreated(project.id, trimmed, areaId, userId));
        return Result.ok(project);
    }
    static reconstitute(id, props) {
        return new Project(props, new UniqueId(id));
    }
    get name() {
        return this.props.name;
    }
    get areaId() {
        return this.props.areaId;
    }
    get userId() {
        return this.props.userId;
    }
    get completedAt() {
        return this.props.completedAt;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    rename(newName) {
        const trimmed = newName.trim();
        if (trimmed.length === 0) {
            return Result.fail("Project name cannot be empty");
        }
        const oldName = this.props.name;
        this.props.name = trimmed;
        this.props.updatedAt = new Date();
        this.addDomainEvent(new ProjectRenamed(this.id, oldName, trimmed));
        return Result.ok(undefined);
    }
    moveToArea(areaId) {
        this.props.areaId = areaId;
        this.props.updatedAt = new Date();
        this.addDomainEvent(new ProjectMovedToArea(this.id, areaId));
    }
    complete(completedAt = new Date()) {
        if (this.props.completedAt)
            return;
        this.props.completedAt = completedAt;
        this.props.updatedAt = new Date();
        this.addDomainEvent(new ProjectCompleted(this.id));
    }
    reopen() {
        if (!this.props.completedAt)
            return;
        this.props.completedAt = null;
        this.props.updatedAt = new Date();
        this.addDomainEvent(new ProjectReopened(this.id));
    }
}
//# sourceMappingURL=Project.js.map