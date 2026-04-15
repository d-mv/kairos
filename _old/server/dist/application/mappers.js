export function toAreaDTO(area) {
    return {
        id: area.id,
        name: area.name,
        userId: area.userId,
        createdAt: area.createdAt.toISOString(),
        updatedAt: area.updatedAt.toISOString(),
    };
}
export function toProjectDTO(project) {
    return {
        id: project.id,
        name: project.name,
        areaId: project.areaId,
        completedAt: project.completedAt?.toISOString() ?? null,
        userId: project.userId,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
    };
}
export function toTaskDTO(task) {
    return {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        parentTaskId: task.parentTaskId,
        projectId: task.projectId,
        areaId: task.areaId,
        userId: task.userId,
        dueDate: task.dueDate?.toISOString() ?? null,
        duration: task.duration,
        durationUnit: task.durationUnit,
        tags: task.tags,
        position: task.position,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
    };
}
export function toLinkDTO(link) {
    return {
        id: link.id,
        sourceId: link.sourceId,
        sourceType: link.sourceType,
        targetId: link.targetId,
        targetType: link.targetType,
        linkType: link.linkType,
        userId: link.userId,
        createdAt: link.createdAt.toISOString(),
    };
}
export function toBrainFolderDTO(folder) {
    return {
        id: folder.id,
        name: folder.name,
        userId: folder.userId,
        createdAt: folder.createdAt.toISOString(),
        updatedAt: folder.updatedAt.toISOString(),
    };
}
export function toBrainPageDTO(page) {
    return {
        id: page.id,
        title: page.title,
        folderId: page.folderId,
        contentJson: page.contentJson,
        userId: page.userId,
        createdAt: page.createdAt.toISOString(),
        updatedAt: page.updatedAt.toISOString(),
    };
}
//# sourceMappingURL=mappers.js.map