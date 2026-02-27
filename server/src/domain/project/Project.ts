import { Entity, UniqueId, Result } from "../shared/index.js";
import { ProjectCreated, ProjectRenamed, ProjectMovedToArea } from "./ProjectDomainEvents.js";

interface ProjectProps {
  name: string;
  areaId: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Project extends Entity<ProjectProps> {
  private constructor(props: ProjectProps, id?: UniqueId) {
    super(props, id);
  }

  static create(
    name: string,
    userId: string,
    areaId: string | null = null,
    id?: string,
  ): Result<Project, string> {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      return Result.fail("Project name cannot be empty");
    }
    const project = new Project(
      { name: trimmed, areaId, userId, createdAt: new Date(), updatedAt: new Date() },
      id ? new UniqueId(id) : undefined,
    );
    project.addDomainEvent(new ProjectCreated(project.id, trimmed, areaId, userId));
    return Result.ok(project);
  }

  static reconstitute(id: string, props: ProjectProps): Project {
    return new Project(props, new UniqueId(id));
  }

  get name(): string {
    return this.props.name;
  }
  get areaId(): string | null {
    return this.props.areaId;
  }
  get userId(): string {
    return this.props.userId;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  rename(newName: string): Result<void, string> {
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

  moveToArea(areaId: string | null): void {
    this.props.areaId = areaId;
    this.props.updatedAt = new Date();
    this.addDomainEvent(new ProjectMovedToArea(this.id, areaId));
  }
}
