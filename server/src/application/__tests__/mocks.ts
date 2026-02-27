import type { Area, AreaRepository } from "../../domain/area/index.js";
import type { Project, ProjectRepository } from "../../domain/project/index.js";
import type { Task, TaskRepository } from "../../domain/task/index.js";
import type { Link, LinkRepository } from "../../domain/link/index.js";
import type { EventBus } from "../EventBus.js";
import type { DomainEvent } from "../../domain/shared/index.js";

export class InMemoryAreaRepository implements AreaRepository {
  private store = new Map<string, Area>();

  async findById(id: string, userId: string): Promise<Area | null> {
    const area = this.store.get(id);
    return area && area.userId === userId ? area : null;
  }

  async findAll(userId: string): Promise<Area[]> {
    return [...this.store.values()].filter((a) => a.userId === userId);
  }

  async save(area: Area): Promise<void> {
    this.store.set(area.id, area);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}

export class InMemoryProjectRepository implements ProjectRepository {
  private store = new Map<string, Project>();

  async findById(id: string, userId: string): Promise<Project | null> {
    const p = this.store.get(id);
    return p && p.userId === userId ? p : null;
  }

  async findAll(userId: string): Promise<Project[]> {
    return [...this.store.values()].filter((p) => p.userId === userId);
  }

  async findByAreaId(areaId: string, userId: string): Promise<Project[]> {
    return [...this.store.values()].filter((p) => p.userId === userId && p.areaId === areaId);
  }

  async save(project: Project): Promise<void> {
    this.store.set(project.id, project);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}

export class InMemoryTaskRepository implements TaskRepository {
  public store = new Map<string, Task>();

  async findById(id: string, userId: string): Promise<Task | null> {
    const t = this.store.get(id);
    return t && t.userId === userId ? t : null;
  }

  async findAll(userId: string): Promise<Task[]> {
    return [...this.store.values()].filter((t) => t.userId === userId);
  }

  async findByProjectId(projectId: string, userId: string): Promise<Task[]> {
    return [...this.store.values()].filter(
      (t) => t.userId === userId && t.projectId === projectId && !t.isSubtask(),
    );
  }

  async findByAreaId(areaId: string, userId: string): Promise<Task[]> {
    return [...this.store.values()].filter((t) => t.userId === userId && t.areaId === areaId);
  }

  async findInbox(userId: string): Promise<Task[]> {
    return [...this.store.values()].filter((t) => t.userId === userId && t.isInInbox());
  }

  async findSubtasks(parentTaskId: string, userId: string): Promise<Task[]> {
    return [...this.store.values()].filter(
      (t) => t.userId === userId && t.parentTaskId === parentTaskId,
    );
  }

  async save(task: Task): Promise<void> {
    this.store.set(task.id, task);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}

export class InMemoryLinkRepository implements LinkRepository {
  private store = new Map<string, Link>();

  async findById(id: string, userId: string): Promise<Link | null> {
    const l = this.store.get(id);
    return l && l.userId === userId ? l : null;
  }

  async findBySourceId(sourceId: string, userId: string): Promise<Link[]> {
    return [...this.store.values()].filter((l) => l.userId === userId && l.sourceId === sourceId);
  }

  async findByTargetId(targetId: string, userId: string): Promise<Link[]> {
    return [...this.store.values()].filter((l) => l.userId === userId && l.targetId === targetId);
  }

  async findByEntityId(entityId: string, userId: string): Promise<Link[]> {
    return [...this.store.values()].filter(
      (l) => l.userId === userId && (l.sourceId === entityId || l.targetId === entityId),
    );
  }

  async save(link: Link): Promise<void> {
    this.store.set(link.id, link);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}

export class SpyEventBus implements EventBus {
  public published: DomainEvent[] = [];

  async publish(events: ReadonlyArray<DomainEvent>): Promise<void> {
    this.published.push(...events);
  }

  reset() {
    this.published = [];
  }
}
