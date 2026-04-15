import type { Area, AreaRepository } from "../../domain/area/index.js";
import type { BrainFolder, BrainFolderRepository } from "../../domain/brain-folder/index.js";
import type { BrainPage, BrainPageRepository } from "../../domain/brain-page/index.js";
import type {
  CollaborationInvite,
  CollaborationInviteRepository,
  CollaborationShare,
  CollaborationShareRepository,
  UserDirectory,
  UserDirectoryEntry,
} from "../../domain/collaboration/index.js";
import type { Project, ProjectRepository } from "../../domain/project/index.js";
import type { Task, TaskRepository } from "../../domain/task/index.js";
import type { Link, LinkRepository } from "../../domain/link/index.js";
import type { EventBus } from "../EventBus.js";
import type { DomainEvent } from "../../domain/shared/index.js";
import type { ShareEntityType } from "@kairos/shared";

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
  public store = new Map<string, Project>();
  public shared = new Map<string, Set<string>>();

  share(userId: string, projectId: string) {
    const ids = this.shared.get(userId) ?? new Set<string>();
    ids.add(projectId);
    this.shared.set(userId, ids);
  }

  async findById(id: string, userId: string): Promise<Project | null> {
    const p = this.store.get(id);
    return p && (p.userId === userId || this.shared.get(userId)?.has(id)) ? p : null;
  }

  async findAll(userId: string): Promise<Project[]> {
    return [...this.store.values()].filter(
      (p) => p.userId === userId || this.shared.get(userId)?.has(p.id),
    );
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
  public shared = new Map<string, Set<string>>();
  public sharedProjectIds = new Map<string, Set<string>>();

  share(userId: string, taskId: string) {
    const ids = this.shared.get(userId) ?? new Set<string>();
    ids.add(taskId);
    this.shared.set(userId, ids);
  }

  shareProject(userId: string, projectId: string) {
    const ids = this.sharedProjectIds.get(userId) ?? new Set<string>();
    ids.add(projectId);
    this.sharedProjectIds.set(userId, ids);
  }

  async findById(id: string, userId: string): Promise<Task | null> {
    const t = this.store.get(id);
    return t &&
      (t.userId === userId ||
        this.shared.get(userId)?.has(id) ||
        (t.projectId !== null && this.sharedProjectIds.get(userId)?.has(t.projectId)))
      ? t
      : null;
  }

  async findAll(userId: string): Promise<Task[]> {
    return [...this.store.values()].filter(
      (t) =>
        t.userId === userId ||
        this.shared.get(userId)?.has(t.id) ||
        (t.projectId !== null && this.sharedProjectIds.get(userId)?.has(t.projectId)),
    );
  }

  async findByProjectId(projectId: string, userId: string): Promise<Task[]> {
    return [...this.store.values()].filter(
      (t) =>
        (t.userId === userId || this.sharedProjectIds.get(userId)?.has(projectId)) &&
        t.projectId === projectId &&
        !t.isSubtask(),
    );
  }

  async findByAreaId(areaId: string, userId: string): Promise<Task[]> {
    return [...this.store.values()].filter((t) => t.userId === userId && t.areaId === areaId);
  }

  async findInbox(userId: string): Promise<Task[]> {
    return [...this.store.values()].filter(
      (t) => (t.userId === userId || this.shared.get(userId)?.has(t.id)) && t.isInInbox(),
    );
  }

  async findSubtasks(parentTaskId: string, userId: string): Promise<Task[]> {
    return [...this.store.values()].filter(
      (t) =>
        (t.userId === userId ||
          this.shared.get(userId)?.has(t.id) ||
          (t.projectId !== null && this.sharedProjectIds.get(userId)?.has(t.projectId))) &&
        t.parentTaskId === parentTaskId,
    );
  }

  async findSiblings(task: Task, userId: string): Promise<Task[]> {
    if (task.parentTaskId) return this.findSubtasks(task.parentTaskId, userId);
    if (task.projectId) return this.findByProjectId(task.projectId, userId);
    if (task.areaId) return this.findByAreaId(task.areaId, userId);
    return this.findInbox(userId);
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

export class InMemoryBrainFolderRepository implements BrainFolderRepository {
  private store = new Map<string, BrainFolder>();
  public shared = new Map<string, Set<string>>();

  share(userId: string, folderId: string) {
    const ids = this.shared.get(userId) ?? new Set<string>();
    ids.add(folderId);
    this.shared.set(userId, ids);
  }

  async findById(id: string, userId: string): Promise<BrainFolder | null> {
    const folder = this.store.get(id);
    return folder && (folder.userId === userId || this.shared.get(userId)?.has(id)) ? folder : null;
  }

  async findAll(userId: string): Promise<BrainFolder[]> {
    return [...this.store.values()].filter(
      (folder) => folder.userId === userId || this.shared.get(userId)?.has(folder.id),
    );
  }

  async save(folder: BrainFolder): Promise<void> {
    this.store.set(folder.id, folder);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}

export class InMemoryBrainPageRepository implements BrainPageRepository {
  private store = new Map<string, BrainPage>();
  public shared = new Map<string, Set<string>>();
  public sharedFolderIds = new Map<string, Set<string>>();

  share(userId: string, pageId: string) {
    const ids = this.shared.get(userId) ?? new Set<string>();
    ids.add(pageId);
    this.shared.set(userId, ids);
  }

  shareFolder(userId: string, folderId: string) {
    const ids = this.sharedFolderIds.get(userId) ?? new Set<string>();
    ids.add(folderId);
    this.sharedFolderIds.set(userId, ids);
  }

  async findById(id: string, userId: string): Promise<BrainPage | null> {
    const page = this.store.get(id);
    return page &&
      (page.userId === userId ||
        this.shared.get(userId)?.has(id) ||
        (page.folderId !== null && this.sharedFolderIds.get(userId)?.has(page.folderId)))
      ? page
      : null;
  }

  async findAll(userId: string): Promise<BrainPage[]> {
    return [...this.store.values()].filter(
      (page) =>
        page.userId === userId ||
        this.shared.get(userId)?.has(page.id) ||
        (page.folderId !== null && this.sharedFolderIds.get(userId)?.has(page.folderId)),
    );
  }

  async findByFolderId(folderId: string, userId: string): Promise<BrainPage[]> {
    return [...this.store.values()].filter(
      (page) =>
        (page.userId === userId || this.sharedFolderIds.get(userId)?.has(folderId)) &&
        page.folderId === folderId,
    );
  }

  async save(page: BrainPage): Promise<void> {
    this.store.set(page.id, page);
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

export class InMemoryCollaborationShareRepository implements CollaborationShareRepository {
  public store = new Map<string, CollaborationShare>();

  async findSharedEntityIds(userId: string, entityType: ShareEntityType): Promise<string[]> {
    return [...this.store.values()]
      .filter((share) => share.collaboratorUserId === userId && share.entityType === entityType)
      .map((share) => share.entityId);
  }

  async findShare(
    userId: string,
    entityType: ShareEntityType,
    entityId: string,
  ): Promise<CollaborationShare | null> {
    return (
      [...this.store.values()].find(
        (share) =>
          share.collaboratorUserId === userId &&
          share.entityType === entityType &&
          share.entityId === entityId,
      ) ?? null
    );
  }

  async save(share: CollaborationShare): Promise<void> {
    this.store.set(share.id, share);
  }
}

export class InMemoryCollaborationInviteRepository implements CollaborationInviteRepository {
  public store = new Map<string, CollaborationInvite>();

  async findPendingByRecipientUserId(userId: string): Promise<CollaborationInvite[]> {
    return [...this.store.values()].filter(
      (invite) => invite.recipientUserId === userId && invite.status === "pending",
    );
  }

  async findPendingByRecipientAndEntity(
    userId: string,
    entityType: ShareEntityType,
    entityId: string,
  ): Promise<CollaborationInvite | null> {
    return (
      [...this.store.values()].find(
        (invite) =>
          invite.recipientUserId === userId &&
          invite.entityType === entityType &&
          invite.entityId === entityId &&
          invite.status === "pending",
      ) ?? null
    );
  }

  async findById(id: string): Promise<CollaborationInvite | null> {
    return this.store.get(id) ?? null;
  }

  async save(invite: CollaborationInvite): Promise<void> {
    this.store.set(invite.id, invite);
  }
}

export class InMemoryUserDirectory implements UserDirectory {
  public store = new Map<string, UserDirectoryEntry>();

  add(user: UserDirectoryEntry) {
    this.store.set(user.id, user);
  }

  async findByEmail(email: string): Promise<UserDirectoryEntry | null> {
    return [...this.store.values()].find((user) => user.email === email) ?? null;
  }

  async findById(id: string): Promise<UserDirectoryEntry | null> {
    return this.store.get(id) ?? null;
  }
}
