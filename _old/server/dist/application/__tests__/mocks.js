export class InMemoryAreaRepository {
    store = new Map();
    async findById(id, userId) {
        const area = this.store.get(id);
        return area && area.userId === userId ? area : null;
    }
    async findAll(userId) {
        return [...this.store.values()].filter((a) => a.userId === userId);
    }
    async save(area) {
        this.store.set(area.id, area);
    }
    async delete(id) {
        this.store.delete(id);
    }
}
export class InMemoryProjectRepository {
    store = new Map();
    async findById(id, userId) {
        const p = this.store.get(id);
        return p && p.userId === userId ? p : null;
    }
    async findAll(userId) {
        return [...this.store.values()].filter((p) => p.userId === userId);
    }
    async findByAreaId(areaId, userId) {
        return [...this.store.values()].filter((p) => p.userId === userId && p.areaId === areaId);
    }
    async save(project) {
        this.store.set(project.id, project);
    }
    async delete(id) {
        this.store.delete(id);
    }
}
export class InMemoryTaskRepository {
    store = new Map();
    async findById(id, userId) {
        const t = this.store.get(id);
        return t && t.userId === userId ? t : null;
    }
    async findAll(userId) {
        return [...this.store.values()].filter((t) => t.userId === userId);
    }
    async findByProjectId(projectId, userId) {
        return [...this.store.values()].filter((t) => t.userId === userId && t.projectId === projectId && !t.isSubtask());
    }
    async findByAreaId(areaId, userId) {
        return [...this.store.values()].filter((t) => t.userId === userId && t.areaId === areaId);
    }
    async findInbox(userId) {
        return [...this.store.values()].filter((t) => t.userId === userId && t.isInInbox());
    }
    async findSubtasks(parentTaskId, userId) {
        return [...this.store.values()].filter((t) => t.userId === userId && t.parentTaskId === parentTaskId);
    }
    async save(task) {
        this.store.set(task.id, task);
    }
    async delete(id) {
        this.store.delete(id);
    }
}
export class InMemoryLinkRepository {
    store = new Map();
    async findById(id, userId) {
        const l = this.store.get(id);
        return l && l.userId === userId ? l : null;
    }
    async findBySourceId(sourceId, userId) {
        return [...this.store.values()].filter((l) => l.userId === userId && l.sourceId === sourceId);
    }
    async findByTargetId(targetId, userId) {
        return [...this.store.values()].filter((l) => l.userId === userId && l.targetId === targetId);
    }
    async findByEntityId(entityId, userId) {
        return [...this.store.values()].filter((l) => l.userId === userId && (l.sourceId === entityId || l.targetId === entityId));
    }
    async save(link) {
        this.store.set(link.id, link);
    }
    async delete(id) {
        this.store.delete(id);
    }
}
export class SpyEventBus {
    published = [];
    async publish(events) {
        this.published.push(...events);
    }
    reset() {
        this.published = [];
    }
}
//# sourceMappingURL=mocks.js.map