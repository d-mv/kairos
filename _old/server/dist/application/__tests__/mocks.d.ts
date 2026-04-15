import type { Area, AreaRepository } from "../../domain/area/index.js";
import type { Project, ProjectRepository } from "../../domain/project/index.js";
import type { Task, TaskRepository } from "../../domain/task/index.js";
import type { Link, LinkRepository } from "../../domain/link/index.js";
import type { EventBus } from "../EventBus.js";
import type { DomainEvent } from "../../domain/shared/index.js";
export declare class InMemoryAreaRepository implements AreaRepository {
    private store;
    findById(id: string, userId: string): Promise<Area | null>;
    findAll(userId: string): Promise<Area[]>;
    save(area: Area): Promise<void>;
    delete(id: string): Promise<void>;
}
export declare class InMemoryProjectRepository implements ProjectRepository {
    private store;
    findById(id: string, userId: string): Promise<Project | null>;
    findAll(userId: string): Promise<Project[]>;
    findByAreaId(areaId: string, userId: string): Promise<Project[]>;
    save(project: Project): Promise<void>;
    delete(id: string): Promise<void>;
}
export declare class InMemoryTaskRepository implements TaskRepository {
    store: Map<string, Task>;
    findById(id: string, userId: string): Promise<Task | null>;
    findAll(userId: string): Promise<Task[]>;
    findByProjectId(projectId: string, userId: string): Promise<Task[]>;
    findByAreaId(areaId: string, userId: string): Promise<Task[]>;
    findInbox(userId: string): Promise<Task[]>;
    findSubtasks(parentTaskId: string, userId: string): Promise<Task[]>;
    save(task: Task): Promise<void>;
    delete(id: string): Promise<void>;
}
export declare class InMemoryLinkRepository implements LinkRepository {
    private store;
    findById(id: string, userId: string): Promise<Link | null>;
    findBySourceId(sourceId: string, userId: string): Promise<Link[]>;
    findByTargetId(targetId: string, userId: string): Promise<Link[]>;
    findByEntityId(entityId: string, userId: string): Promise<Link[]>;
    save(link: Link): Promise<void>;
    delete(id: string): Promise<void>;
}
export declare class SpyEventBus implements EventBus {
    published: DomainEvent[];
    publish(events: ReadonlyArray<DomainEvent>): Promise<void>;
    reset(): void;
}
//# sourceMappingURL=mocks.d.ts.map