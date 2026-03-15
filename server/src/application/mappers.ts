import type {
  AreaDTO,
  BrainFolderDTO,
  BrainPageDTO,
  LinkDTO,
  ProjectDTO,
  TaskDTO,
} from "@kairos/shared";
import type { Area } from "../domain/area/index.js";
import type { BrainFolder } from "../domain/brain-folder/index.js";
import type { BrainPage } from "../domain/brain-page/index.js";
import type { Project } from "../domain/project/index.js";
import type { Task } from "../domain/task/index.js";
import type { Link } from "../domain/link/index.js";

export function toAreaDTO(area: Area): AreaDTO {
  return {
    id: area.id,
    name: area.name,
    userId: area.userId,
    createdAt: area.createdAt.toISOString(),
    updatedAt: area.updatedAt.toISOString(),
  };
}

export function toProjectDTO(project: Project): ProjectDTO {
  return {
    id: project.id,
    name: project.name,
    areaId: project.areaId,
    userId: project.userId,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

export function toTaskDTO(task: Task): TaskDTO {
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
    dueDate: task.dueDate?.toISOString().split("T")[0] ?? null,
    duration: task.duration,
    durationUnit: task.durationUnit,
    position: task.position,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

export function toLinkDTO(link: Link): LinkDTO {
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

export function toBrainFolderDTO(folder: BrainFolder): BrainFolderDTO {
  return {
    id: folder.id,
    name: folder.name,
    userId: folder.userId,
    createdAt: folder.createdAt.toISOString(),
    updatedAt: folder.updatedAt.toISOString(),
  };
}

export function toBrainPageDTO(page: BrainPage): BrainPageDTO {
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
